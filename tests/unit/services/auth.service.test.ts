import { beforeEach, describe, expect, test, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  login,
  register,
  resetPassword,
} from "@/lib/services/auth.service";
import { createSupabaseClientMock } from "../../mocks/supabase";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns a validation error for an empty email during login", async () => {
    const result = await login({
      email: "",
      password: "12345678",
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "E-Mail-Adresse ist erforderlich.",
      },
    });
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  test("logs in successfully and trims the email before sending it to Supabase", async () => {
    const { client, auth } = createSupabaseClientMock({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-1",
              email: "test@example.com",
              created_at: "2026-04-13T10:00:00.000Z",
            },
            session: {
              access_token: "access-token",
              refresh_token: "refresh-token",
              expires_at: 12345,
            },
          },
          error: null,
        }),
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await login({
      email: "  test@example.com  ",
      password: "12345678",
    });

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "12345678",
    });
    expect(result.error).toBeNull();
    expect(result.data?.user.email).toBe("test@example.com");
  });

  test("returns generic invalid credentials when Supabase rejects the login", async () => {
    const { client } = createSupabaseClientMock({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: "Invalid login credentials" },
        }),
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await login({
      email: "test@example.com",
      password: "12345678",
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "E-Mail oder Passwort ist falsch. Bitte versuche es erneut.",
        details: "Invalid login credentials",
      },
    });
  });

  test("registers a user and normalizes a missing session to empty values", async () => {
    const { client } = createSupabaseClientMock({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "user-2",
              email: "new@example.com",
              created_at: "2026-04-15T10:00:00.000Z",
            },
            session: null,
          },
          error: null,
        }),
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await register({
      email: "new@example.com",
      password: "12345678",
    });

    expect(result.error).toBeNull();
    expect(result.data?.session).toEqual({
      access_token: "",
      refresh_token: "",
      expires_at: 0,
    });
  });

  test("resetPassword always returns success when Supabase responds with an error object", async () => {
    const { client } = createSupabaseClientMock({
      auth: {
        resetPasswordForEmail: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Unknown user" },
        }),
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await resetPassword("user@example.com");

    expect(result).toEqual({
      data: { success: true },
      error: null,
    });
  });
});
