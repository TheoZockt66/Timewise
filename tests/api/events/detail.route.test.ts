import { beforeEach, describe, expect, test, vi } from "vitest";
import { DELETE, PUT } from "@/app/api/events/[id]/route";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent, updateEvent } from "@/lib/services/event.service";
import { buildEventWithKeywords } from "../../factories/events";
import { createSupabaseClientMock } from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/event.service", () => ({
  deleteEvent: vi.fn(),
  updateEvent: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedDeleteEvent = vi.mocked(deleteEvent);
const mockedUpdateEvent = vi.mocked(updateEvent);

const context = {
  params: Promise.resolve({ id: "event-1" }),
};

describe("events detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("DELETE returns 401 when no user is logged in", async () => {
    const { client } = createSupabaseClientMock({ user: null });
    mockedCreateClient.mockResolvedValue(client as never);

    const response = await DELETE(
      new Request("http://localhost/api/events/event-1", {
        method: "DELETE",
      }),
      context
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: {
        code: "UNAUTHORIZED",
      },
    });
    expect(mockedDeleteEvent).not.toHaveBeenCalled();
  });

  test("PUT forwards the id and parsed body to updateEvent", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    const updatedEvent = buildEventWithKeywords({ id: "event-1" });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedUpdateEvent.mockResolvedValue({
      data: updatedEvent,
      error: null,
    });

    const body = {
      label: "Physikblock",
      keyword_ids: ["keyword-1"],
    };

    const response = await PUT(
      new Request("http://localhost/api/events/event-1", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateEvent).toHaveBeenCalledWith("event-1", body);
  });

  test("DELETE forwards the id to deleteEvent for logged-in users", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedDeleteEvent.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await DELETE(
      new Request("http://localhost/api/events/event-1", {
        method: "DELETE",
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(mockedDeleteEvent).toHaveBeenCalledWith("event-1");
  });
});
