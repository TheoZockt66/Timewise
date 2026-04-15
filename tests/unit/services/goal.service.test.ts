import { beforeEach, describe, expect, test, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  createGoal,
  getGoals,
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
});
