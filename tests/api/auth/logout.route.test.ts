import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/auth/logout/route";
import { logout } from "@/lib/services/auth.service";

vi.mock("@/lib/services/auth.service", () => ({
  logout: vi.fn(),
}));

const mockedLogout = vi.mocked(logout);

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 200 when the session is closed successfully", async () => {
    mockedLogout.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { success: true },
      error: null,
    });
  });

  test("returns 500 when the auth service reports a logout failure", async () => {
    mockedLogout.mockResolvedValue({
      data: null,
      error: {
        code: "LOGOUT_FAILED",
        message: "Abmeldung fehlgeschlagen.",
      },
    });

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      data: null,
      error: {
        code: "LOGOUT_FAILED",
      },
    });
  });
});
