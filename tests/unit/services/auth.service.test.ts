import { beforeEach, describe, expect, test, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForSession,
  login,
  logout,
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

  test("returns a validation error for an empty password during login", async () => {
    const result = await login({
      email: "test@example.com",
      password: "",
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Passwort ist erforderlich.",
      },
    });
  });

  test("returns a validation error for a short password during login", async () => {
    const result = await login({
      email: "test@example.com",
      password: "1234567",
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Passwort muss mindestens 8 Zeichen lang sein.",
      },
    });
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

  test("returns a validation error for invalid registration credentials", async () => {
    const result = await register({
      email: "invalid-mail",
      password: "12345678",
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ung\u00fcltiges E-Mail-Format. Bitte eine g\u00fcltige E-Mail-Adresse eingeben.",
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

  test("returns REGISTRATION_FAILED when Supabase rejects register", async () => {
    const { client } = createSupabaseClientMock({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: "duplicate key value violates unique constraint" },
        }),
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await register({
      email: "new@example.com",
      password: "12345678",
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "REGISTRATION_FAILED",
        message: "Registrierung fehlgeschlagen. Bitte versuche es erneut.",
        details: "duplicate key value violates unique constraint",
      },
    });
  });

  test("returns REGISTRATION_FAILED when Supabase does not create a user", async () => {
    const { client } = createSupabaseClientMock({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: null,
        }),
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    const result = await register({
      email: "new@example.com",
      password: "12345678",
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "REGISTRATION_FAILED",
        message: "Registrierung fehlgeschlagen. Kein Benutzer erstellt.",
      },
    });
  });

  test("returns success when logout succeeds", async () => {
    const { client } = createSupabaseClientMock();
    mockedCreateClient.mockResolvedValue(client as never);

    await expect(logout()).resolves.toEqual({
      data: { success: true },
      error: null,
    });
  });

  test("returns LOGOUT_FAILED when signOut errors", async () => {
    const { client } = createSupabaseClientMock({
      auth: {
        signOut: vi.fn().mockResolvedValue({
          error: { message: "session missing" },
        }),
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(logout()).resolves.toEqual({
      data: null,
      error: {
        code: "LOGOUT_FAILED",
        message: "Abmeldung fehlgeschlagen. Bitte versuche es erneut.",
        details: "session missing",
      },
    });
  });

  test("returns a validation error for an invalid reset email", async () => {
    const result = await resetPassword("invalid-mail");

    expect(result).toEqual({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ung\u00fcltiges E-Mail-Format. Bitte eine g\u00fcltige E-Mail-Adresse eingeben.",
      },
    });
    expect(mockedCreateClient).not.toHaveBeenCalled();
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

  test("returns success when a code exchange succeeds", async () => {
    const { client, auth } = createSupabaseClientMock();
    mockedCreateClient.mockResolvedValue(client as never);

    await expect(exchangeCodeForSession("valid-code")).resolves.toEqual({
      data: { success: true },
      error: null,
    });
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("valid-code");
  });

  test("returns CODE_EXCHANGE_FAILED when a code exchange fails", async () => {
    const { client } = createSupabaseClientMock({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          error: { message: "invalid flow state" },
        }),
      },
    });

    mockedCreateClient.mockResolvedValue(client as never);

    await expect(exchangeCodeForSession("expired-code")).resolves.toEqual({
      data: null,
      error: {
        code: "CODE_EXCHANGE_FAILED",
        message: "Der Bestätigungslink ist ungültig oder abgelaufen.",
        details: "invalid flow state",
      },
    });
  });
});
