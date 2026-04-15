import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET, POST } from "@/app/api/keywords/route";
import { createClient } from "@/lib/supabase/server";
import { createKeyword } from "@/lib/services/keyword.service";
import { buildKeyword } from "../../factories/keywords";
import {
  createSupabaseClientMock,
  createSupabaseResult,
} from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/keyword.service", () => ({
  createKeyword: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedCreateKeyword = vi.mocked(createKeyword);

describe("keywords route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("GET returns 401 when no user is logged in", async () => {
    const { client } = createSupabaseClientMock({ user: null });
    mockedCreateClient.mockResolvedValue(client as never);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: {
        code: "UNAUTHORIZED",
      },
    });
  });

  test("GET returns the current users keywords in wrapper format", async () => {
    const keyword = buildKeyword();
    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        keywords: {
          select: {
            await: [createSupabaseResult([keyword])],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [keyword],
      error: null,
    });
  });

  test("POST attaches the current user id before calling the service", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedCreateKeyword.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/keywords", {
        method: "POST",
        body: JSON.stringify({ label: "Mathe", color: "#7700F4" }),
      })
    );

    expect(response.status).toBe(200);
    expect(mockedCreateKeyword).toHaveBeenCalledWith({
      label: "Mathe",
      color: "#7700F4",
      user_id: "user-1",
    });
  });
});
