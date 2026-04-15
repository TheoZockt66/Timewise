import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/events/route";
import { createClient } from "@/lib/supabase/server";
import { buildKeyword } from "../../factories/keywords";
import { buildEventKeywordJoin } from "../../factories/events";
import createEventRequest from "../../fixtures/events/create-event-request.json";
import createdEventRecord from "../../fixtures/events/created-event-record.json";
import {
  createSupabaseClientMock,
  createSupabaseResult,
} from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

describe("event creation flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("creates an event through route, service and keyword enrichment", async () => {
    const keyword = buildKeyword({
      id: createEventRequest.keyword_ids[0],
      label: "Mathe",
    });

    const { client, getTableCalls } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        events: {
          select: {
            await: [createSupabaseResult([])],
            single: [
              createSupabaseResult({
                ...createdEventRecord,
                event_keywords: buildEventKeywordJoin([keyword]),
              }),
            ],
          },
          insert: {
            single: [createSupabaseResult(createdEventRecord)],
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

    const response = await POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify(createEventRequest),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        id: createdEventRecord.id,
        label: createdEventRecord.label,
        keywords: [keyword],
        duration_minutes: 90,
      },
      error: null,
    });

    const eventKeywordCalls = getTableCalls("event_keywords");
    expect(eventKeywordCalls[0]?.insert).toHaveBeenCalledWith([
      {
        event_id: createdEventRecord.id,
        keyword_id: keyword.id,
      },
    ]);
  });
});
