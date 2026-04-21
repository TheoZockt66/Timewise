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

  test("aggregates returned events by day and keeps keyword totals scoped to each day", async () => {
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
          start_time: "2026-04-11T11:00:00",
          end_time: "2026-04-11T11:30:00",
          duration_minutes: 30,
          keywords: [physics],
        }),
      ],
      error: null,
    });

    const response = await GET(
      new Request(
        "http://localhost/api/events/aggregate?start_date=2026-04-10&end_date=2026-04-11&granularity=day&keyword_ids=keyword-1"
      )
    );

    expect(response.status).toBe(200);
    expect(mockedFetchEvents).toHaveBeenCalledWith({
      start_date: "2026-04-10",
      end_date: "2026-04-11",
      keyword_ids: ["keyword-1"],
    });

    await expect(response.json()).resolves.toEqual({
      data: [
        {
          period: "10.04.2026",
          total_minutes: 60,
          by_keyword: [
            {
              keyword_id: "keyword-1",
              keyword_label: "Mathe",
              keyword_color: "#7700F4",
              minutes: 60,
            },
          ],
        },
        {
          period: "11.04.2026",
          total_minutes: 30,
          by_keyword: [
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

  test("aggregates returned events by week", async () => {
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
          start_time: "2026-04-15T09:00:00",
          end_time: "2026-04-15T09:45:00",
          duration_minutes: 45,
          keywords: [physics],
        }),
      ],
      error: null,
    });

    const response = await GET(
      new Request("http://localhost/api/events/aggregate?granularity=week")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          period: "06.04.2026 - 12.04.2026",
          total_minutes: 60,
          by_keyword: [
            {
              keyword_id: "keyword-1",
              keyword_label: "Mathe",
              keyword_color: "#7700F4",
              minutes: 60,
            },
          ],
        },
        {
          period: "13.04.2026 - 19.04.2026",
          total_minutes: 45,
          by_keyword: [
            {
              keyword_id: "keyword-2",
              keyword_label: "Physik",
              keyword_color: "#00957F",
              minutes: 45,
            },
          ],
        },
      ],
      error: null,
    });
  });

  test("splits multi-day events proportionally across daily periods", async () => {
    const math = buildKeyword();

    mockedFetchEvents.mockResolvedValue({
      data: [
        buildEventWithKeywords({
          id: "event-1",
          start_time: "2026-04-10T23:00:00",
          end_time: "2026-04-11T01:30:00",
          duration_minutes: 150,
          keywords: [math],
        }),
      ],
      error: null,
    });

    const response = await GET(
      new Request(
        "http://localhost/api/events/aggregate?start_date=2026-04-10&end_date=2026-04-11&granularity=day"
      )
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          period: "10.04.2026",
          total_minutes: 60,
          by_keyword: [
            {
              keyword_id: "keyword-1",
              keyword_label: "Mathe",
              keyword_color: "#7700F4",
              minutes: 60,
            },
          ],
        },
        {
          period: "11.04.2026",
          total_minutes: 90,
          by_keyword: [
            {
              keyword_id: "keyword-1",
              keyword_label: "Mathe",
              keyword_color: "#7700F4",
              minutes: 90,
            },
          ],
        },
      ],
      error: null,
    });
  });

  test("aggregates returned events by month", async () => {
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
          start_time: "2026-05-02T14:00:00",
          end_time: "2026-05-02T14:30:00",
          duration_minutes: 30,
          keywords: [physics],
        }),
      ],
      error: null,
    });

    const response = await GET(
      new Request("http://localhost/api/events/aggregate?granularity=month")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          period: "04.2026",
          total_minutes: 60,
          by_keyword: [
            {
              keyword_id: "keyword-1",
              keyword_label: "Mathe",
              keyword_color: "#7700F4",
              minutes: 60,
            },
          ],
        },
        {
          period: "05.2026",
          total_minutes: 30,
          by_keyword: [
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
