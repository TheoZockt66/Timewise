import { beforeEach, describe, expect, test, vi } from "vitest";
import { DELETE, PUT } from "@/app/api/keywords/[id]/route";
import { createClient } from "@/lib/supabase/server";
import { deleteKeyword, updateKeyword } from "@/lib/services/keyword.service";
import { buildKeyword } from "../../factories/keywords";
import { createSupabaseClientMock } from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/services/keyword.service", () => ({
  deleteKeyword: vi.fn(),
  updateKeyword: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);
const mockedDeleteKeyword = vi.mocked(deleteKeyword);
const mockedUpdateKeyword = vi.mocked(updateKeyword);

const context = {
  params: Promise.resolve({ id: "keyword-1" }),
};

describe("keywords detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("DELETE returns 401 when no user is logged in", async () => {
    const { client } = createSupabaseClientMock({ user: null });
    mockedCreateClient.mockResolvedValue(client as never);

    const response = await DELETE(
      new Request("http://localhost/api/keywords/keyword-1", {
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
    expect(mockedDeleteKeyword).not.toHaveBeenCalled();
  });

  test("PUT forwards the id and body to updateKeyword", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedUpdateKeyword.mockResolvedValue({
      data: buildKeyword(),
      error: null,
    });

    const body = { label: "Physik", color: "#00957F" };

    const response = await PUT(
      new Request("http://localhost/api/keywords/keyword-1", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(mockedUpdateKeyword).toHaveBeenCalledWith("keyword-1", body);
  });

  test("DELETE forwards the id to deleteKeyword for logged-in users", async () => {
    const { client } = createSupabaseClientMock({ user: { id: "user-1" } });
    mockedCreateClient.mockResolvedValue(client as never);
    mockedDeleteKeyword.mockResolvedValue({
      data: null,
      error: null,
    });

    const response = await DELETE(
      new Request("http://localhost/api/keywords/keyword-1", {
        method: "DELETE",
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(mockedDeleteKeyword).toHaveBeenCalledWith("keyword-1");
  });
});
