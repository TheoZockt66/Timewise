import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { register } from "@/lib/services/auth.service";

vi.mock("@/lib/services/auth.service", () => ({
  register: vi.fn(),
}));

const mockedRegister = vi.mocked(register);

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 400 for validation failures from the auth service", async () => {
    mockedRegister.mockResolvedValue({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "E-Mail-Adresse ist erforderlich.",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: "", password: "12345678" }),
      })
    );

    expect(response.status).toBe(400);
    expect(mockedRegister).toHaveBeenCalledWith({
      email: "",
      password: "12345678",
    });
  });

  test("returns 201 with the service payload on success", async () => {
    mockedRegister.mockResolvedValue({
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
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "12345678",
        }),
      })
    );

    expect(response.status).toBe(201);
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
      new Request("http://localhost/api/auth/register", {
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
