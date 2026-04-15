import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "@/app/api/events/aggregate/route";
import { fetchEvents } from "@/lib/services/event.service";
import { buildEventWithKeywords } from "../../factories/events";
import { buildKeyword } from "../../factories/keywords";

vi.mock("@/lib/services/event.service", () => ({
  fetchEvents: vi.fn(),
}));

const mockedFetchEvents = vi.mocked(fetchEvents);

describe("events aggregate route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("aggregates returned events by day and keyword", async () => {
    const math = buildKeyword();
    const physics = buildKeyword({
      id: "keyword-2",
      label: "Physik",
      color: "#00957F",
    });

    mockedFetchEvents.mockResolvedValue({
      data: [
        buildEventWithKeywords({
          id: "event-1",
          start_time: "2026-04-10T09:00:00",
          end_time: "2026-04-10T10:00:00",
          duration_minutes: 60,
          keywords: [math],
        }),
        buildEventWithKeywords({
          id: "event-2",
          start_time: "2026-04-10T11:00:00",
          end_time: "2026-04-10T11:30:00",
          duration_minutes: 30,
          keywords: [math, physics],
        }),
      ],
      error: null,
    });

    const response = await GET(
      new Request(
        "http://localhost/api/events/aggregate?start_date=2026-04-10&end_date=2026-04-10&granularity=day&keyword_ids=keyword-1"
      )
    );

    expect(response.status).toBe(200);
    expect(mockedFetchEvents).toHaveBeenCalledWith({
      start_date: "2026-04-10",
      end_date: "2026-04-10",
      keyword_ids: ["keyword-1"],
    });

    await expect(response.json()).resolves.toEqual({
      data: [
        {
          period: "10.04.2026",
          total_minutes: 90,
          by_keyword: [
            {
              keyword_id: "keyword-1",
              keyword_label: "Mathe",
              keyword_color: "#7700F4",
              minutes: 90,
            },
            {
              keyword_id: "keyword-2",
              keyword_label: "Physik",
              keyword_color: "#00957F",
              minutes: 30,
            },
          ],
        },
      ],
      error: null,
    });
  });

  test("returns 500 with the service error wrapper when aggregation cannot be built", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockedFetchEvents.mockResolvedValue({
      data: null,
      error: {
        code: "FETCH_FAILED",
        message: "Events konnten nicht geladen werden.",
      },
    });

    const response = await GET(
      new Request("http://localhost/api/events/aggregate?granularity=week")
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: {
        code: "FETCH_FAILED",
      },
    });

    consoleErrorSpy.mockRestore();
  });
});
