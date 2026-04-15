import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/auth/reset/route";
import { resetPassword } from "@/lib/services/auth.service";

vi.mock("@/lib/services/auth.service", () => ({
  resetPassword: vi.fn(),
}));

const mockedResetPassword = vi.mocked(resetPassword);

describe("POST /api/auth/reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 400 for validation failures from the auth service", async () => {
    mockedResetPassword.mockResolvedValue({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "E-Mail-Adresse ist erforderlich.",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/reset", {
        method: "POST",
        body: JSON.stringify({ email: "" }),
      })
    );

    expect(response.status).toBe(400);
    expect(mockedResetPassword).toHaveBeenCalledWith("");
  });

  test("returns 200 with a stable success payload", async () => {
    mockedResetPassword.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const response = await POST(
      new Request("http://localhost/api/auth/reset", {
        method: "POST",
        body: JSON.stringify({ email: "test@example.com" }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { success: true },
      error: null,
    });
  });

  test("returns 500 when the request body cannot be parsed", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/reset", {
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
