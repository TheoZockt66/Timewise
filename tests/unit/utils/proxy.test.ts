import { describe, expect, test, vi } from "vitest";
import { NextResponse } from "next/server";
import { proxy, config } from "@/proxy";
import { updateSession } from "@/lib/supabase/middleware";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(),
}));

const mockedUpdateSession = vi.mocked(updateSession);

describe("proxy", () => {
  test("delegates requests to updateSession", async () => {
    const response = new NextResponse(null, { status: 204 });
    mockedUpdateSession.mockResolvedValue(response);

    const result = await proxy(new Request("http://localhost/calendar") as never);

    expect(result).toBe(response);
    expect(mockedUpdateSession).toHaveBeenCalledTimes(1);
  });

  test("keeps the matcher configuration for protected routes", () => {
    expect(config.matcher).toContain(
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"
    );
  });
});
