import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useStats } from "@/hooks/useStats";
import { buildEventWithKeywords } from "../../factories/events";
import { buildKeyword } from "../../factories/keywords";

describe("useStats", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("loads aggregate data and clips overlapping day events into hourly buckets", async () => {
    const dayEvents = [
      buildEventWithKeywords({
        start_time: "2026-04-09T23:30:00",
        end_time: "2026-04-10T01:30:00",
        duration_minutes: 120,
      }),
    ];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              period: "10.04.2026",
              total_minutes: 90,
              by_keyword: [],
            },
          ],
          error: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: dayEvents,
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
        total_minutes: 90,
        by_keyword: [],
      },
    ]);
    expect(result.current.timelineData).toHaveLength(24);
    expect(result.current.timelineData[0]).toEqual({
      period: "0:00",
      total: 60,
      Mathe: 60,
    });
    expect(result.current.timelineData[1]).toEqual({
      period: "1:00",
      total: 30,
      Mathe: 30,
    });
    expect(result.current.events).toEqual(dayEvents);
    expect(result.current.error).toBeNull();
  });

  test("builds a full week timeline with ordered weekdays and split multi-day buckets", async () => {
    const math = buildKeyword();
    const physics = buildKeyword({
      id: "keyword-2",
      label: "Physik",
      color: "#00957F",
    });

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ period: "KW", total_minutes: 150, by_keyword: [] }],
          error: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            buildEventWithKeywords({
              start_time: "2026-04-13T23:00:00",
              end_time: "2026-04-14T01:00:00",
              duration_minutes: 120,
              keywords: [math],
            }),
            buildEventWithKeywords({
              id: "event-2",
              start_time: "2026-04-15T12:00:00",
              end_time: "2026-04-15T12:30:00",
              duration_minutes: 30,
              keywords: [physics],
            }),
          ],
          error: null,
        }),
      });

    const { result } = renderHook(() =>
      useStats({
        startDate: "2026-04-13",
        endDate: "2026-04-19",
        granularity: "week",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.timelineData).toEqual([
      { period: "Mo", total: 60, Mathe: 60, Physik: 0 },
      { period: "Di", total: 60, Mathe: 60, Physik: 0 },
      { period: "Mi", total: 30, Mathe: 0, Physik: 30 },
      { period: "Do", total: 0, Mathe: 0, Physik: 0 },
      { period: "Fr", total: 0, Mathe: 0, Physik: 0 },
      { period: "Sa", total: 0, Mathe: 0, Physik: 0 },
      { period: "So", total: 0, Mathe: 0, Physik: 0 },
    ]);
    expect(result.current.events).toHaveLength(2);
  });

  test("builds a month timeline and includes empty calendar weeks", async () => {
    const math = buildKeyword();

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ period: "04.2026", total_minutes: 75, by_keyword: [] }],
          error: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            buildEventWithKeywords({
              start_time: "2026-04-01T09:00:00",
              end_time: "2026-04-01T09:45:00",
              duration_minutes: 45,
              keywords: [math],
            }),
            buildEventWithKeywords({
              id: "event-2",
              start_time: "2026-04-30T18:00:00",
              end_time: "2026-04-30T18:30:00",
              duration_minutes: 30,
              keywords: [math],
            }),
          ],
          error: null,
        }),
      });

    const { result } = renderHook(() =>
      useStats({
        startDate: "2026-04-01",
        endDate: "2026-04-30",
        granularity: "month",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.timelineData).toEqual([
      { period: "KW 14", total: 45, Mathe: 45 },
      { period: "KW 15", total: 0, Mathe: 0 },
      { period: "KW 16", total: 0, Mathe: 0 },
      { period: "KW 17", total: 0, Mathe: 0 },
      { period: "KW 18", total: 30, Mathe: 30 },
    ]);
    expect(result.current.events).toHaveLength(2);
  });

  test("builds a month timeline from sunday boundaries and keeps empty weeks stable", async () => {
    const math = buildKeyword();

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ period: "03.2026", total_minutes: 30, by_keyword: [] }],
          error: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            buildEventWithKeywords({
              start_time: "2026-03-01T09:00:00",
              end_time: "2026-03-01T09:30:00",
              duration_minutes: 30,
              keywords: [math],
            }),
          ],
          error: null,
        }),
      });

    const { result } = renderHook(() =>
      useStats({
        startDate: "2026-03-01",
        endDate: "2026-03-01",
        granularity: "month",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.timelineData).toEqual([
      { period: "KW 9", total: 30, Mathe: 30 },
    ]);
  });

  test("keeps a stable empty week timeline when the event response is empty", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          error: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [],
          error: null,
        }),
      });

    const { result } = renderHook(() =>
      useStats({
        startDate: "2026-04-13",
        endDate: "2026-04-19",
        granularity: "week",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.timelineData).toEqual([
      { period: "Mo", total: 0 },
      { period: "Di", total: 0 },
      { period: "Mi", total: 0 },
      { period: "Do", total: 0 },
      { period: "Fr", total: 0 },
      { period: "Sa", total: 0 },
      { period: "So", total: 0 },
    ]);
    expect(result.current.events).toEqual([]);
  });

  test("surfaces invalid aggregate JSON as a hook error", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error("bad json");
      },
    });

    const { result } = renderHook(() =>
      useStats({
        startDate: "2026-04-10",
        endDate: "2026-04-10",
        granularity: "day",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.timelineData).toEqual([]);
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBe("Ungültige Serverantwort.");
  });

  test("falls back to an unknown error message when a non-error value is thrown", async () => {
    fetchMock.mockRejectedValueOnce("kaputt");

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

    expect(result.current.data).toEqual([]);
    expect(result.current.timelineData).toEqual([]);
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBe(
      "Unbekannter Fehler beim Laden der Statistiken."
    );
  });

  test("surfaces event fetch failures and resets the hook state", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ period: "10.04.2026", total_minutes: 60, by_keyword: [] }],
          error: null,
        }),
      })
      .mockRejectedValueOnce(new Error("Evente konnten nicht geladen werden."));

    const { result } = renderHook(() =>
      useStats({
        startDate: "2026-04-10",
        endDate: "2026-04-10",
        granularity: "day",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.timelineData).toEqual([]);
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBe("Evente konnten nicht geladen werden.");
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
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBe("Statistiken konnten nicht geladen werden.");
  });

  test("refetch reloads aggregate data and timeline state", async () => {
    const firstDayEvents = [
      buildEventWithKeywords({
        start_time: "2026-04-10T09:00:00",
        end_time: "2026-04-10T10:00:00",
        duration_minutes: 60,
      }),
    ];
    const secondDayEvents = [
      buildEventWithKeywords({
        start_time: "2026-04-10T11:00:00",
        end_time: "2026-04-10T12:30:00",
        duration_minutes: 90,
      }),
    ];

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ period: "10.04.2026", total_minutes: 60, by_keyword: [] }],
          error: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: firstDayEvents,
          error: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ period: "10.04.2026", total_minutes: 90, by_keyword: [] }],
          error: null,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: secondDayEvents,
          error: null,
        }),
      });

    const { result } = renderHook(() =>
      useStats({
        startDate: "2026-04-10",
        endDate: "2026-04-10",
        granularity: "day",
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(result.current.data).toEqual([
      { period: "10.04.2026", total_minutes: 90, by_keyword: [] },
    ]);
    expect(result.current.timelineData).toHaveLength(24);
    expect(result.current.timelineData[11]).toEqual({
      period: "11:00",
      total: 60,
      Mathe: 60,
    });
    expect(result.current.timelineData[12]).toEqual({
      period: "12:00",
      total: 30,
      Mathe: 30,
    });
    expect(result.current.events).toEqual(secondDayEvents);
  });
});
