import { beforeEach, describe, expect, test, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
} from "@/lib/services/goal.service";
import { buildGoal, buildGoalKeywordJoinRows } from "../../factories/goals";
import { buildKeyword } from "../../factories/keywords";
import {
  createSupabaseClientMock,
  createSupabaseResult,
} from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

describe("goal.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("rejects goal creation when the label is missing", async () => {
    const result = await createGoal({
      user_id: "user-1",
      label: "",
      keyword_ids: [],
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Bezeichnung ist erforderlich. Bitte gib eine Bezeichnung an.",
      },
    });
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  test("rejects keywords that do not belong to the user", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        keywords: {
          select: {
            await: [createSupabaseResult([{ id: "keyword-1" }])],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await createGoal({
      user_id: "user-1",
      label: "Klausur",
      keyword_ids: ["keyword-1", "keyword-2"],
    });

    expect(result.error).toMatchObject({
      code: "INVALID_KEYWORDS",
    });
  });

  test("returns FETCH_FAILED when loading goals fails", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          select: {
            await: [createSupabaseResult(null, "database offline")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(getGoals("user-1")).resolves.toEqual({
      data: null,
      error: {
        code: "FETCH_FAILED",
        message: "Ziele konnten nicht geladen werden.",
        details: "database offline",
      },
    });
  });

  test("returns the catch fallback when goal loading throws unexpectedly", async () => {
    mockedCreateClient.mockResolvedValue({
      from: vi.fn(() => {
        throw new Error("unexpected crash");
      }),
    } as never);

    await expect(getGoals("user-1")).resolves.toEqual({
      data: null,
      error: {
        code: "FETCH_FAILED",
        message: "Ziele konnten nicht geladen werden.",
        details: "unexpected crash",
      },
    });
  });

  test("calculates goal progress based on matching event overlap", async () => {
    const keyword = buildKeyword();
    const goal = buildGoal({
      target_study_time: "02:00:00",
      start_time: "2026-04-02T09:30:00.000Z",
      end_time: "2026-04-02T10:30:00.000Z",
    });

    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          select: {
            await: [createSupabaseResult([goal])],
          },
        },
        goal_keywords: {
          select: {
            await: [createSupabaseResult(buildGoalKeywordJoinRows([keyword]))],
          },
        },
        event_keywords: {
          select: {
            await: [createSupabaseResult([{ event_id: "event-1" }])],
          },
        },
        events: {
          select: {
            await: [
              createSupabaseResult([
                {
                  start_time: "2026-04-02T09:00:00.000Z",
                  end_time: "2026-04-02T11:00:00.000Z",
                },
              ]),
            ],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await getGoals("user-1");

    expect(result.error).toBeNull();
    expect(result.data?.[0]).toMatchObject({
      logged_minutes: 60,
      target_minutes: 120,
      percentage: 50,
      remaining_minutes: 60,
    });
  });

  test("creates a goal with normalized optional fields and no keyword relations", async () => {
    const newGoal = buildGoal({
      id: "goal-new",
      label: "Klausur",
      description: null,
      target_study_time: null,
      start_time: null,
      end_time: null,
    });

    const { client, getTableCalls } = createSupabaseClientMock({
      tables: {
        goals: {
          insert: {
            single: [createSupabaseResult(newGoal)],
          },
        },
        goal_keywords: {
          select: {
            await: [createSupabaseResult([{ keywords: null }])],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await createGoal({
      user_id: "user-1",
      label: "  Klausur  ",
      description: "   ",
      target_study_time: null,
      start_time: null,
      end_time: null,
      keyword_ids: [],
    });

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      id: "goal-new",
      label: "Klausur",
      description: null,
      target_minutes: 0,
      logged_minutes: 0,
      keywords: [],
      days_remaining: 0,
    });
    expect(getTableCalls("goals")[0]?.insert).toHaveBeenCalledWith({
      label: "Klausur",
      description: null,
      target_study_time: null,
      start_time: null,
      end_time: null,
      user_id: "user-1",
    });
    expect(getTableCalls("goal_keywords")).toHaveLength(1);
    expect(getTableCalls("goal_keywords")[0]?.insert).not.toHaveBeenCalled();
  });

  test("returns KEYWORD_VALIDATION_FAILED when owned keyword lookup errors", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        keywords: {
          select: {
            await: [createSupabaseResult(null, "cannot validate keywords")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      createGoal({
        user_id: "user-1",
        label: "Klausur",
        keyword_ids: ["keyword-1"],
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "KEYWORD_VALIDATION_FAILED",
        message: "Keywords konnten nicht gepr\u00fcft werden.",
        details: "cannot validate keywords",
      },
    });
  });

  test("falls back to empty keywords when goal keyword loading fails", async () => {
    const goal = buildGoal({
      target_study_time: "02:00:00",
    });

    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          select: {
            await: [createSupabaseResult([goal])],
          },
        },
        goal_keywords: {
          select: {
            await: [createSupabaseResult(null, "goal keywords missing")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await getGoals("user-1");

    expect(result.error).toBeNull();
    expect(result.data?.[0]).toMatchObject({
      keywords: [],
      logged_minutes: 0,
      target_minutes: 120,
    });
  });

  test("falls back to zero logged minutes when progress loading fails", async () => {
    const keyword = buildKeyword();
    const goal = buildGoal({
      target_study_time: "02:00:00",
    });

    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          select: {
            await: [createSupabaseResult([goal])],
          },
        },
        goal_keywords: {
          select: {
            await: [createSupabaseResult(buildGoalKeywordJoinRows([keyword]))],
          },
        },
        event_keywords: {
          select: {
            await: [createSupabaseResult(null, "progress rows failed")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await getGoals("user-1");

    expect(result.error).toBeNull();
    expect(result.data?.[0]).toMatchObject({
      keywords: [keyword],
      logged_minutes: 0,
      target_minutes: 120,
    });
  });

  test("returns zero logged minutes when events do not overlap with the goal range", async () => {
    const keyword = buildKeyword();
    const goal = buildGoal({
      start_time: "2026-04-02T09:00:00.000Z",
      end_time: "2026-04-02T10:00:00.000Z",
    });

    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          select: {
            await: [createSupabaseResult([goal])],
          },
        },
        goal_keywords: {
          select: {
            await: [createSupabaseResult(buildGoalKeywordJoinRows([keyword]))],
          },
        },
        event_keywords: {
          select: {
            await: [createSupabaseResult([{ event_id: "event-1" }])],
          },
        },
        events: {
          select: {
            await: [
              createSupabaseResult([
                {
                  start_time: "2026-04-02T12:00:00.000Z",
                  end_time: "2026-04-02T13:00:00.000Z",
                },
              ]),
            ],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await getGoals("user-1");

    expect(result.error).toBeNull();
    expect(result.data?.[0]).toMatchObject({
      logged_minutes: 0,
      keywords: [keyword],
    });
  });

  test("creates a goal and returns CREATE_FAILED when the goal insert fails", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          insert: {
            single: [createSupabaseResult(null, "insert failed")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      createGoal({
        user_id: "user-1",
        label: "Klausur",
        target_study_time: "02:00:00",
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "CREATE_FAILED",
        message: "Ziel konnte nicht erstellt werden.",
        details: "insert failed",
      },
    });
  });

  test("rolls back the inserted goal when keyword assignment fails", async () => {
    const newGoal = buildGoal({
      id: "goal-new",
      label: "Rollback",
    });

    const { client, getTableCalls } = createSupabaseClientMock({
      tables: {
        goals: {
          insert: {
            single: [createSupabaseResult(newGoal)],
          },
          delete: {
            await: [createSupabaseResult(null)],
          },
        },
        keywords: {
          select: {
            await: [createSupabaseResult([{ id: "keyword-1" }])],
          },
        },
        goal_keywords: {
          insert: {
            await: [createSupabaseResult(null, "join insert failed")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await createGoal({
      user_id: "user-1",
      label: "Rollback",
      keyword_ids: ["keyword-1"],
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "CREATE_FAILED",
        message: "Die Keyword-Zuordnung für das Ziel konnte nicht gespeichert werden.",
        details: "join insert failed",
      },
    });
    expect(getTableCalls("goals")).toHaveLength(2);
    expect(getTableCalls("goals")[1]?.delete).toHaveBeenCalled();
    expect(getTableCalls("goals")[1]?.eq).toHaveBeenNthCalledWith(1, "id", "goal-new");
    expect(getTableCalls("goals")[1]?.eq).toHaveBeenNthCalledWith(2, "user_id", "user-1");
  });

  test("updates a goal without field changes by reloading the existing record", async () => {
    const goal = buildGoal();
    const { client, getTableCalls } = createSupabaseClientMock({
      tables: {
        goals: {
          select: {
            maybeSingle: [createSupabaseResult(goal)],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await updateGoal("goal-1", "user-1", {});

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      id: "goal-1",
      logged_minutes: 0,
      keywords: [],
    });
    expect(getTableCalls("goals")[0]?.update).not.toHaveBeenCalled();
    expect(getTableCalls("goals")[0]?.select).toHaveBeenCalledWith("*");
  });

  test("returns NOT_FOUND when updateGoal cannot find a goal", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          select: {
            maybeSingle: [createSupabaseResult(null)],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(updateGoal("goal-missing", "user-1", {})).resolves.toEqual({
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Ziel wurde nicht gefunden.",
      },
    });
  });

  test("returns a validation error when updateGoal receives invalid data", async () => {
    await expect(
      updateGoal("goal-1", "user-1", {
        target_study_time: "foo",
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Zielzeit muss im Format HH:MM:SS sein.",
      },
    });
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  test("returns UPDATE_FAILED when the goal update query itself fails", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          update: {
            maybeSingle: [createSupabaseResult(null, "update blocked")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      updateGoal("goal-1", "user-1", {
        label: "Neu",
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "UPDATE_FAILED",
        message: "Ziel konnte nicht aktualisiert werden.",
        details: "update blocked",
      },
    });
  });

  test("returns UPDATE_FAILED when deleting old goal keyword relations fails", async () => {
    const goal = buildGoal();
    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          update: {
            maybeSingle: [createSupabaseResult(goal)],
          },
        },
        keywords: {
          select: {
            await: [createSupabaseResult([{ id: "keyword-1" }])],
          },
        },
        goal_keywords: {
          delete: {
            await: [createSupabaseResult(null, "cannot delete relations")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      updateGoal("goal-1", "user-1", {
        label: "Neu",
        keyword_ids: ["keyword-1"],
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "UPDATE_FAILED",
        message: "Keyword-Zuordnungen konnten nicht aktualisiert werden.",
        details: "cannot delete relations",
      },
    });
  });

  test("updates optional fields and synchronizes goal keywords successfully", async () => {
    const keyword = buildKeyword();
    const updatedGoal = buildGoal({
      id: "goal-1",
      label: "Bearbeitet",
      description: null,
      start_time: null,
      end_time: "2026-05-01T00:00:00.000Z",
      target_study_time: null,
    });

    const { client, getTableCalls } = createSupabaseClientMock({
      tables: {
        goals: {
          update: {
            maybeSingle: [createSupabaseResult(updatedGoal)],
          },
        },
        keywords: {
          select: {
            await: [createSupabaseResult([{ id: "keyword-1" }])],
          },
        },
        goal_keywords: {
          delete: {
            await: [createSupabaseResult(null)],
          },
          insert: {
            await: [createSupabaseResult(null)],
          },
          select: {
            await: [createSupabaseResult(buildGoalKeywordJoinRows([keyword]))],
          },
        },
        event_keywords: {
          select: {
            await: [createSupabaseResult([])],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await updateGoal("goal-1", "user-1", {
      label: "  Bearbeitet  ",
      description: null,
      target_study_time: null,
      start_time: null,
      end_time: "2026-05-01T00:00:00.000Z",
      keyword_ids: ["keyword-1"],
    });

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      id: "goal-1",
      label: "Bearbeitet",
      description: null,
      end_time: "2026-05-01T00:00:00.000Z",
      keywords: [keyword],
      logged_minutes: 0,
    });
    expect(getTableCalls("goals")[0]?.update).toHaveBeenCalledWith({
      label: "Bearbeitet",
      description: null,
      target_study_time: null,
      start_time: null,
      end_time: "2026-05-01T00:00:00.000Z",
    });
    expect(getTableCalls("goal_keywords")[1]?.insert).toHaveBeenCalledWith([
      {
        goal_id: "goal-1",
        keyword_id: "keyword-1",
      },
    ]);
  });

  test("returns DELETE_FAILED when deleting a goal fails", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          delete: {
            maybeSingle: [createSupabaseResult(null, "delete failed")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(deleteGoal("goal-1", "user-1")).resolves.toEqual({
      data: null,
      error: {
        code: "DELETE_FAILED",
        message: "Ziel konnte nicht gelöscht werden.",
        details: "delete failed",
      },
    });
  });

  test("returns NOT_FOUND when deleteGoal cannot find a goal", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          delete: {
            maybeSingle: [createSupabaseResult(null)],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(deleteGoal("goal-1", "user-1")).resolves.toEqual({
      data: null,
      error: {
        code: "NOT_FOUND",
        message: "Ziel wurde nicht gefunden.",
      },
    });
  });

  test("deletes a goal successfully", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        goals: {
          delete: {
            maybeSingle: [createSupabaseResult({ id: "goal-1" })],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(deleteGoal("goal-1", "user-1")).resolves.toEqual({
      data: { success: true },
      error: null,
    });
  });
});
