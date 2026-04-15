import { beforeEach, describe, expect, test, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  createKeyword,
  fetchKeywords,
} from "@/lib/services/keyword.service";
import { buildKeyword } from "../../factories/keywords";
import {
  createSupabaseClientMock,
  createSupabaseResult,
} from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

describe("keyword.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns a validation error for invalid input", async () => {
    const result = await createKeyword({
      user_id: "user-1",
      label: "",
      color: "red",
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Label darf nicht leer sein",
      },
    });
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  test("returns UNAUTHORIZED when fetching keywords without a user", async () => {
    const { client } = createSupabaseClientMock({ user: null });
    mockedCreateClient.mockResolvedValue(client as never);

    await expect(fetchKeywords()).resolves.toEqual({
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Nicht eingeloggt",
      },
    });
  });

  test("creates a keyword successfully", async () => {
    const keyword = buildKeyword();
    const { client } = createSupabaseClientMock({
      tables: {
        keywords: {
          insert: {
            single: [createSupabaseResult(keyword)],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await createKeyword({
      user_id: keyword.user_id,
      label: keyword.label,
      color: keyword.color,
    });

    expect(result).toEqual({
      data: keyword,
      error: null,
    });
  });
});
