import { beforeEach, describe, expect, test, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { login } from "./auth.service";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

const mockedCreateClient = vi.mocked(createClient);

function createSupabaseClientMock(signInWithPassword = vi.fn()) {
  return {
    auth: {
      signInWithPassword,
    },
  };
}

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns a validation error for an empty email", async () => {
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

  test("returns a validation error for an invalid email format", async () => {
    const result = await login({
      email: "ungueltig",
      password: "12345678",
    });

    expect(result).toEqual({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ung\u00fcltiges E-Mail-Format. Bitte eine g\u00fcltige E-Mail-Adresse eingeben.",
      },
    });
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  test("returns a validation error for a password shorter than eight characters", async () => {
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
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  test("logs in successfully and trims the email before sending it to Supabase", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
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
    });

    mockedCreateClient.mockResolvedValue(
      createSupabaseClientMock(signInWithPassword) as never
    );

    const result = await login({
      email: "  test@example.com  ",
      password: "12345678",
    });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "12345678",
    });
    expect(result).toEqual({
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
    });
  });

  test("returns generic invalid credentials when Supabase rejects the login", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: {
        message: "Invalid login credentials",
      },
    });

    mockedCreateClient.mockResolvedValue(
      createSupabaseClientMock(signInWithPassword) as never
    );

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
});
