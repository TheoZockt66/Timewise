import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useGoals } from "@/hooks/useGoals";
import { buildGoalWithProgress } from "../../factories/goals";
import { buildKeyword } from "../../factories/keywords";

describe("useGoals", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("loads goals and available keywords on mount", async () => {
    const goal = buildGoalWithProgress();
    const keyword = buildKeyword();

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [goal], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [keyword], error: null }),
      });

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/goals");
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/keywords");
    expect(result.current.goals).toEqual([goal]);
    expect(result.current.availableKeywords).toEqual([keyword]);
    expect(result.current.error).toBeNull();
  });

  test("surfaces invalid goal JSON responses but still keeps valid keywords", async () => {
    const keyword = buildKeyword();

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("broken json");
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [keyword], error: null }),
      });

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.goals).toEqual([]);
    expect(result.current.availableKeywords).toEqual([keyword]);
    expect(result.current.error).toBe(
      "Der Server hat keine gültige Antwort geliefert."
    );
  });

  test("surfaces keyword fetch fallback errors and keeps previously read goals", async () => {
    const goal = buildGoalWithProgress();

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [goal], error: null }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ data: null, error: null }),
      });

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.goals).toEqual([goal]);
    expect(result.current.availableKeywords).toEqual([]);
    expect(result.current.error).toBe("Keywords konnten nicht geladen werden.");
  });

  test("creates, updates and deletes a goal entry via the API helpers", async () => {
    const createdGoal = buildGoalWithProgress({
      id: "goal-1",
      label: "Klausur",
      keywords: [buildKeyword()],
    });
    const updatedGoal = buildGoalWithProgress({
      id: "goal-1",
      label: "Klausur Phase 2",
      keywords: [buildKeyword({ id: "keyword-2", label: "Physik" })],
    });

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [buildKeyword()], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: createdGoal, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedGoal, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true }, error: null }),
      });

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.createGoalEntry({
        label: "Klausur",
        description: "Lineare Algebra",
        targetHours: "10",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        keywordIds: ["keyword-1"],
      });
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/goals",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[2][1].body as string)).toEqual({
      label: "Klausur",
      description: "Lineare Algebra",
      target_study_time: "10:00:00",
      start_time: "2026-04-01T00:00:00.000Z",
      end_time: "2026-04-30T23:59:59.999Z",
      keyword_ids: ["keyword-1"],
    });
    expect(result.current.goals[0]).toEqual(createdGoal);

    await act(async () => {
      await result.current.updateGoalEntry("goal-1", {
        label: "Klausur Phase 2",
        description: "",
        targetHours: "",
        startDate: "",
        endDate: "",
        keywordIds: ["keyword-2"],
      });
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "/api/goals/goal-1",
      expect.objectContaining({
        method: "PUT",
      })
    );
    expect(result.current.goals[0]).toEqual(updatedGoal);

    await act(async () => {
      await result.current.deleteGoalEntry("goal-1");
    });

    expect(fetchMock).toHaveBeenNthCalledWith(5, "/api/goals/goal-1", {
      method: "DELETE",
    });
    expect(result.current.goals).toEqual([]);
    expect(result.current.deletingId).toBeNull();
  });

  test("returns fallback create, update and delete errors when the API response has no data", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [buildKeyword()], error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: null, error: null }),
      });

    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let createResult;
    let updateResult;
    let deleteResult;

    await act(async () => {
      createResult = await result.current.createGoalEntry({
        label: "Klausur",
        description: "",
        targetHours: "",
        startDate: "",
        endDate: "",
        keywordIds: [],
      });
    });

    await act(async () => {
      updateResult = await result.current.updateGoalEntry("goal-1", {
        label: "Klausur",
        description: "",
        targetHours: "",
        startDate: "",
        endDate: "",
        keywordIds: [],
      });
    });

    await act(async () => {
      deleteResult = await result.current.deleteGoalEntry("goal-1");
    });

    expect(createResult).toEqual({
      data: null,
      error: {
        code: "CREATE_FAILED",
        message: "Ziel konnte nicht erstellt werden.",
      },
    });
    expect(updateResult).toEqual({
      data: null,
      error: {
        code: "UPDATE_FAILED",
        message: "Ziel konnte nicht aktualisiert werden.",
      },
    });
    expect(deleteResult).toEqual({
      data: null,
      error: {
        code: "DELETE_FAILED",
        message: "Ziel konnte nicht gelöscht werden.",
      },
    });
    expect(result.current.goals).toEqual([]);
    expect(result.current.saving).toBe(false);
    expect(result.current.deletingId).toBeNull();
  });
});
