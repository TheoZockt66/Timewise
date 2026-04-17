import { beforeEach, describe, expect, test, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  createKeyword,
  deleteKeyword,
  fetchKeywords,
  updateKeyword,
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

  test("creates a keyword successfully", async () => {
    const keyword = buildKeyword();
    const { client, getTableCalls } = createSupabaseClientMock({
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
    expect(getTableCalls("keywords")[0]?.insert).toHaveBeenCalledWith({
      label: keyword.label,
      color: keyword.color,
      user_id: keyword.user_id,
    });
  });

  test("returns CREATE_FAILED when keyword insert fails", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        keywords: {
          insert: {
            single: [createSupabaseResult(null, "insert exploded")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      createKeyword({
        user_id: "user-1",
        label: "Mathe",
        color: "#7700F4",
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "CREATE_FAILED",
        message: "Keyword konnte nicht erstellt werden.",
        details: "insert exploded",
      },
    });
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

  test("returns FETCH_FAILED when loading keywords fails", async () => {
    const { client } = createSupabaseClientMock({
      user: { id: "user-1" },
      tables: {
        keywords: {
          select: {
            await: [createSupabaseResult(null, "database offline")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(fetchKeywords()).resolves.toEqual({
      data: null,
      error: {
        code: "FETCH_FAILED",
        message: "Keywords konnten nicht geladen werden.",
        details: "database offline",
      },
    });
  });

  test("updates a keyword successfully", async () => {
    const updatedKeyword = buildKeyword({
      label: "Physik",
      color: "#00957F",
    });
    const { client, getTableCalls } = createSupabaseClientMock({
      tables: {
        keywords: {
          update: {
            single: [createSupabaseResult(updatedKeyword)],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await updateKeyword("keyword-1", {
      label: updatedKeyword.label,
      color: updatedKeyword.color,
    });

    expect(result).toEqual({
      data: updatedKeyword,
      error: null,
    });
    expect(getTableCalls("keywords")[0]?.eq).toHaveBeenCalledWith("id", "keyword-1");
  });

  test("returns a validation error when updateKeyword receives invalid data", async () => {
    const result = await updateKeyword("keyword-1", {
      label: "Mathe",
      color: "green",
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Farbe muss ein g\u00fcltiger Hex-Code sein (#RRGGBB)",
      },
    });
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  test("returns UPDATE_FAILED when the keyword update fails", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        keywords: {
          update: {
            single: [createSupabaseResult(null, "row level security")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(
      updateKeyword("keyword-1", {
        label: "Physik",
        color: "#00957F",
      })
    ).resolves.toEqual({
      data: null,
      error: {
        code: "UPDATE_FAILED",
        message: "Keyword konnte nicht aktualisiert werden.",
        details: "row level security",
      },
    });
  });

  test("deletes a keyword successfully", async () => {
    const { client, getTableCalls } = createSupabaseClientMock();
    mockedCreateClient.mockResolvedValue(client as never);

    await expect(deleteKeyword("keyword-1")).resolves.toEqual({
      data: null,
      error: null,
    });
    expect(getTableCalls("keywords")[0]?.eq).toHaveBeenCalledWith("id", "keyword-1");
  });

  test("returns DELETE_FAILED when deleteKeyword fails", async () => {
    const { client } = createSupabaseClientMock({
      tables: {
        keywords: {
          delete: {
            await: [createSupabaseResult(null, "still referenced")],
          },
        },
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(deleteKeyword("keyword-1")).resolves.toEqual({
      data: null,
      error: {
        code: "DELETE_FAILED",
        message: "Keyword konnte nicht gel\u00f6scht werden.",
        details: "still referenced",
      },
    });
  });
});
