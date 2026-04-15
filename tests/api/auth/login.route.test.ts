import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/auth/login/route";
import { login } from "@/lib/services/auth.service";

vi.mock("@/lib/services/auth.service", () => ({
  login: vi.fn(),
}));

const mockedLogin = vi.mocked(login);

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 400 for validation failures from the auth service", async () => {
    mockedLogin.mockResolvedValue({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "E-Mail-Adresse ist erforderlich.",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "", password: "12345678" }),
      })
    );

    expect(response.status).toBe(400);
    expect(mockedLogin).toHaveBeenCalledWith({
      email: "",
      password: "12345678",
    });
  });

  test("returns 200 with the service payload on success", async () => {
    mockedLogin.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "test@example.com",
          created_at: "2026-04-15T10:00:00.000Z",
        },
        session: {
          access_token: "access",
          refresh_token: "refresh",
          expires_at: 123,
        },
      },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "12345678",
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        user: {
          email: "test@example.com",
        },
      },
      error: null,
    });
  });

  test("returns 500 when the request body cannot be parsed", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: "{",
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
      },
    });
  });
});
