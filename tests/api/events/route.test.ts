import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET, POST } from "@/app/api/events/route";
import { createClient } from "@/lib/supabase/server";
import { createEvent, fetchEvents } from "@/lib/services/event.service";
import { createSupabaseClientMock } from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/event.service", () => ({
  createEvent: vi.fn(),
  fetchEvents: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedCreateEvent = vi.mocked(createEvent);
const mockedFetchEvents = vi.mocked(fetchEvents);

describe("events route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("GET returns 401 when no user is logged in", async () => {
    const { client } = createSupabaseClientMock({ user: null });
    mockedCreateClient.mockResolvedValue(client as never);

    const response = await GET(new Request("http://localhost/api/events"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: {
        code: "UNAUTHORIZED",
      },
    });
  });

  test("GET forwards query params to fetchEvents", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedFetchEvents.mockResolvedValue({
      data: [],
      error: null,
    });

    const response = await GET(
      new Request(
        "http://localhost/api/events?start_date=2026-04-01&end_date=2026-04-02&keyword_ids=keyword-1&keyword_ids=keyword-2"
      )
    );

    expect(response.status).toBe(200);
    expect(mockedFetchEvents).toHaveBeenCalledWith({
      start_date: "2026-04-01",
      end_date: "2026-04-02",
      keyword_ids: ["keyword-1", "keyword-2"],
    });
  });

  test("POST forwards the parsed body to createEvent", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedCreateEvent.mockResolvedValue({
      data: null,
      error: null,
    });

    const body = {
      start_time: "2026-04-10T09:00:00.000Z",
      end_time: "2026-04-10T10:00:00.000Z",
      keyword_ids: ["keyword-1"],
      label: "Lernen",
    };

    const response = await POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify(body),
      })
    );

    expect(response.status).toBe(200);
    expect(mockedCreateEvent).toHaveBeenCalledWith(body);
  });
});
