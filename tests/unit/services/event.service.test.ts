import { beforeEach, describe, expect, test, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  createEvent,
  fetchEvents,
} from "@/lib/services/event.service";
import { buildEvent, buildEventKeywordJoin } from "../../factories/events";
import { buildKeyword } from "../../factories/keywords";
import {
  createSupabaseClientMock,
  createSupabaseResult,
} from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

describe("event.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns UNAUTHORIZED when no user is available for fetchEvents", async () => {
    const { client } = createSupabaseClientMock({ user: null });
    mockedCreateClient.mockResolvedValue(client as never);

    await expect(fetchEvents()).resolves.toEqual({
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Nicht eingeloggt",
      },
    });
  });

  test("filters fetched events by keyword ids after loading their relations", async () => {
    const keyword = buildKeyword();
    const firstEvent = buildEvent({
      id: "event-1",
    });
    const secondEvent = buildEvent({
      id: "event-2",
      start_time: "2026-04-10T11:00:00.000Z",
      end_time: "2026-04-10T12:00:00.000Z",
      label: "Physik",
    });

    const { client, getTableCalls } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          select: {
            await: [
              createSupabaseResult([
                {
                  ...firstEvent,
                  event_keywords: buildEventKeywordJoin([keyword]),
                },
                {
                  ...secondEvent,
                  event_keywords: buildEventKeywordJoin([
                    buildKeyword({ id: "keyword-2", label: "Physik" }),
                  ]),
                },
              ]),
            ],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await fetchEvents({
      start_date: "2026-04-10",
      end_date: "2026-04-11",
      keyword_ids: [keyword.id],
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0]).toMatchObject({
      id: "event-1",
      duration_minutes: 60,
      keywords: [keyword],
    });
    expect(getTableCalls("events")[0]?.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(getTableCalls("events")[0]?.gte).toHaveBeenCalledWith("start_time", "2026-04-10");
    expect(getTableCalls("events")[0]?.lte).toHaveBeenCalledWith("end_time", "2026-04-11");
  });

  test("returns a validation error when createEvent is called without keywords", async () => {
    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          select: {
            await: [createSupabaseResult([])],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await createEvent({
      start_time: "2026-04-10T09:00:00.000Z",
      end_time: "2026-04-10T10:00:00.000Z",
      keyword_ids: [],
      label: "Lernen",
    });

    expect(result.error).toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(result.error?.message).toContain("Keyword");
  });
});
