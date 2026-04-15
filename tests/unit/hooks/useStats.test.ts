import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useStats } from "@/hooks/useStats";
import { buildEventWithKeywords } from "../../factories/events";

describe("useStats", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("loads aggregate data and builds timeline data for the selected range", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              period: "10.04.2026",
              total_minutes: 60,
              by_keyword: [],
            },
          ],
          error: null,
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: [
            buildEventWithKeywords({
              start_time: "2026-04-10T09:00:00",
              end_time: "2026-04-10T10:00:00",
              duration_minutes: 60,
            }),
          ],
          error: null,
        }),
      });

    const { result } = renderHook(() =>
      useStats({
        startDate: "2026-04-10",
        endDate: "2026-04-10",
        granularity: "day",
        keywordIds: ["keyword-1"],
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/api/events/aggregate?")
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("granularity=day")
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("keyword_ids=keyword-1")
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/api/events?")
    );

    expect(result.current.data).toEqual([
      {
        period: "10.04.2026",
        total_minutes: 60,
        by_keyword: [],
      },
    ]);
    expect(result.current.timelineData).toEqual([
      {
        period: "9:00",
        total_minutes: 60,
      },
    ]);
    expect(result.current.error).toBeNull();
  });

  test("surfaces aggregate api errors and leaves the hook in a stable empty state", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        data: null,
        error: {
          message: "Statistiken konnten nicht geladen werden.",
        },
      }),
    });

    const { result } = renderHook(() =>
      useStats({
        startDate: "2026-04-10",
        endDate: "2026-04-10",
        granularity: "week",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([]);
    expect(result.current.timelineData).toEqual([]);
    expect(result.current.error).toBe("Statistiken konnten nicht geladen werden.");
  });
});
