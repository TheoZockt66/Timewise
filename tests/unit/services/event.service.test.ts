import { beforeEach, describe, expect, test, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
} from "@/lib/services/event.service";
import {
  buildEvent,
  buildEventKeywordJoin,
  buildEventWithKeywords,
} from "../../factories/events";
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

  test("returns FETCH_FAILED when loading events fails", async () => {
    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          select: {
            await: [createSupabaseResult(null, "query failed")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(fetchEvents()).resolves.toEqual({
      data: null,
      error: {
        code: "FETCH_FAILED",
        message: "Events konnten nicht geladen werden.",
        details: "query failed",
      },
    });
  });

  test("filters overlapping fetched events by keyword ids after loading their relations", async () => {
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
    expect(getTableCalls("events")[0]?.gte).toHaveBeenCalledWith("end_time", "2026-04-10");
    expect(getTableCalls("events")[0]?.lte).toHaveBeenCalledWith("start_time", "2026-04-11");
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

  test("returns UNAUTHORIZED when createEvent has no authenticated user", async () => {
    const { client } = createSupabaseClientMock({
      user: null,
      tables: {
        events: {
          select: {
            await: [createSupabaseResult([])],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      createEvent({
        start_time: "2026-04-10T09:00:00.000Z",
        end_time: "2026-04-10T10:00:00.000Z",
        keyword_ids: ["keyword-1"],
        label: "Lernen",
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Nicht eingeloggt",
      },
    });
  });

  test("creates an event and reloads it with keywords", async () => {
    const keyword = buildKeyword();
    const newEvent = buildEvent({
      id: "event-new",
      label: "Matheblock",
    });

    const { client, getTableCalls } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          select: {
            await: [createSupabaseResult([])],
            single: [
              createSupabaseResult({
                ...newEvent,
                event_keywords: buildEventKeywordJoin([keyword]),
              }),
            ],
          },
          insert: {
            single: [createSupabaseResult(newEvent)],
          },
        },
        event_keywords: {
          insert: {
            await: [createSupabaseResult(null)],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await createEvent({
      start_time: newEvent.start_time,
      end_time: newEvent.end_time,
      keyword_ids: [keyword.id],
      label: newEvent.label,
      description: newEvent.description,
    });

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      id: "event-new",
      keywords: [keyword],
      duration_minutes: 60,
    });
    expect(getTableCalls("event_keywords")[0]?.insert).toHaveBeenCalledWith([
      {
        event_id: "event-new",
        keyword_id: keyword.id,
      },
    ]);
  });

  test("returns CREATE_FAILED when event insert fails", async () => {
    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          select: {
            await: [createSupabaseResult([])],
          },
          insert: {
            single: [createSupabaseResult(null, "insert failed")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      createEvent({
        start_time: "2026-04-10T09:00:00.000Z",
        end_time: "2026-04-10T10:00:00.000Z",
        keyword_ids: ["keyword-1"],
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "CREATE_FAILED",
        message: "Speichern des Events fehlgeschlagen.",
        details: "insert failed",
      },
    });
  });

  test("rolls back the event when saving event_keywords fails", async () => {
    const newEvent = buildEvent({
      id: "event-new",
    });
    const { client, getTableCalls } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          select: {
            await: [createSupabaseResult([])],
          },
          insert: {
            single: [createSupabaseResult(newEvent)],
          },
          delete: {
            await: [createSupabaseResult(null)],
          },
        },
        event_keywords: {
          insert: {
            await: [createSupabaseResult(null, "join insert failed")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await createEvent({
      start_time: newEvent.start_time,
      end_time: newEvent.end_time,
      keyword_ids: ["keyword-1"],
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "CREATE_FAILED",
        message: "Fehler beim Speichern der Event-Keywords.",
        details: "join insert failed",
      },
    });
    expect(getTableCalls("events")).toHaveLength(3);
    expect(getTableCalls("events")[2]?.delete).toHaveBeenCalled();
    expect(getTableCalls("events")[2]?.eq).toHaveBeenCalledWith("id", "event-new");
  });

  test("returns FETCH_FAILED when updateEvent cannot load the current event", async () => {
    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          select: {
            single: [createSupabaseResult(null, "missing row")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      updateEvent("event-1", {
        start_time: "2026-04-10T09:00:00.000Z",
        end_time: "2026-04-10T10:00:00.000Z",
        keyword_ids: ["keyword-1"],
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "FETCH_FAILED",
        message: "Event konnte nicht gefunden werden.",
        details: "missing row",
      },
    });
  });

  test("returns a validation error when updated event data is invalid", async () => {
    const currentEvent = buildEvent({
      start_time: "2026-04-10T09:00:00.000Z",
      end_time: "2026-04-10T10:00:00.000Z",
    });

    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          select: {
            single: [createSupabaseResult(currentEvent)],
            await: [createSupabaseResult([])],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await updateEvent("event-1", {
      start_time: "2026-04-10T10:00:00.000Z",
      end_time: "2026-04-10T09:00:00.000Z",
      keyword_ids: ["keyword-1"],
    });

    expect(result.error).toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(result.error?.message).toContain("Endzeit");
  });

  test("returns UPDATE_FAILED when the event update query fails", async () => {
    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          update: {
            single: [createSupabaseResult(null, "update blocked")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      updateEvent("event-1", {
        label: "Neu",
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "UPDATE_FAILED",
        message: "Event konnte nicht aktualisiert werden.",
        details: "update blocked",
      },
    });
  });

  test("returns UPDATE_FAILED when keyword sync fails during update", async () => {
    const currentEvent = buildEvent();
    const updatedEvent = buildEvent({
      label: "Neu",
    });

    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          select: {
            single: [createSupabaseResult(currentEvent)],
          },
          update: {
            single: [createSupabaseResult(updatedEvent)],
          },
        },
        event_keywords: {
          insert: {
            await: [createSupabaseResult(null, "keyword sync failed")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      updateEvent("event-1", {
        keyword_ids: ["keyword-1"],
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "UPDATE_FAILED",
        message: "Fehler beim Aktualisieren der Event-Keywords.",
        details: "keyword sync failed",
      },
    });
  });

  test("returns FETCH_FAILED when the updated event cannot be reloaded", async () => {
    const updatedEvent = buildEvent({
      label: "Neu",
    });

    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          update: {
            single: [createSupabaseResult(updatedEvent)],
          },
          select: {
            single: [createSupabaseResult(null, "not found anymore")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      updateEvent("event-1", {
        label: "Neu",
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "FETCH_FAILED",
        message: "Aktualisiertes Event konnte nicht geladen werden.",
      },
    });
  });

  test("deletes an event successfully", async () => {
    const { client, getTableCalls } = createSupabaseClientMock();
    mockedCreateClient.mockResolvedValue(client as never);

    await expect(deleteEvent("event-1")).resolves.toEqual({
      data: null,
      error: null,
    });
    expect(getTableCalls("events")[0]?.eq).toHaveBeenCalledWith("id", "event-1");
  });

  test("returns DELETE_FAILED when deleting an event fails", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        events: {
          delete: {
            await: [createSupabaseResult(null, "delete failed")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(deleteEvent("event-1")).resolves.toEqual({
      data: null,
      error: {
        code: "DELETE_FAILED",
        message: "Event konnte nicht gel\u00f6scht werden.",
        details: "delete failed",
      },
    });
  });
});
