import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "@/app/api/auth/callback/route";
import { exchangeCodeForSession } from "@/lib/services/auth.service";

vi.mock("@/lib/services/auth.service", () => ({
  exchangeCodeForSession: vi.fn(),
}));

const mockedExchangeCodeForSession = vi.mocked(exchangeCodeForSession);

describe("GET /api/auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("redirects back to login when the code is missing", async () => {
    const response = await GET(
      new Request("http://localhost/api/auth/callback")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?error=missing_code"
    );
    expect(mockedExchangeCodeForSession).not.toHaveBeenCalled();
  });

  test("redirects back to login when the code exchange fails", async () => {
    mockedExchangeCodeForSession.mockResolvedValue({
      data: null,
      error: {
        code: "CODE_EXCHANGE_FAILED",
        message: "Der Bestaetigungslink ist ungueltig oder abgelaufen.",
      },
    });

    const response = await GET(
      new Request("http://localhost/api/auth/callback?code=broken")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?error=invalid_code"
    );
  });

  test("redirects to the calendar after a successful code exchange", async () => {
    mockedExchangeCodeForSession.mockResolvedValue({
      data: { success: true },
      error: null,
    });

    const response = await GET(
      new Request("http://localhost/api/auth/callback?code=valid-code")
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/calendar");
    expect(mockedExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
  });
});
