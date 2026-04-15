import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCalendar } from "@/hooks/useCalendar";
import { buildEventWithKeywords } from "../../factories/events";

describe("useCalendar", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("loads calendar events and clears previous errors", async () => {
    const event = buildEventWithKeywords({
      start_time: "2026-04-10T09:00:00",
      end_time: "2026-04-10T10:00:00",
    });

    fetchMock.mockResolvedValue({
      json: async () => ({
        data: [event],
        error: null,
      }),
    });

    const { result } = renderHook(() => useCalendar());

    await act(async () => {
      await result.current.fetchEvents("2026-04-01", "2026-04-30");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/events?start_date=2026-04-01&end_date=2026-04-30"
    );
    expect(result.current.events).toEqual([event]);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  test("stores api errors and keeps the calendar state stable", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        data: null,
        error: {
          message: "Kalenderdaten konnten nicht geladen werden.",
        },
      }),
    });

    const { result } = renderHook(() => useCalendar());

    await act(async () => {
      await result.current.fetchEvents("2026-04-01", "2026-04-30");
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBe("Kalenderdaten konnten nicht geladen werden.");
    expect(result.current.isLoading).toBe(false);
  });
});
