import { beforeEach, describe, expect, test, vi } from "vitest";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getPublicSupabaseEnv } from "@/lib/env";
import { updateSession } from "@/lib/supabase/middleware";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(),
    redirect: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  getPublicSupabaseEnv: vi.fn(),
}));

const mockedCreateServerClient = vi.mocked(createServerClient);
const mockedNext = vi.mocked(NextResponse.next);
const mockedRedirect = vi.mocked(NextResponse.redirect);
const mockedGetPublicSupabaseEnv = vi.mocked(getPublicSupabaseEnv);

function createResponse(kind: "next" | "redirect", location?: string) {
  return {
    kind,
    location,
    cookies: {
      set: vi.fn(),
    },
  };
}

function createRequest(pathname: string) {
  const url = new URL(`https://timewise.test${pathname}`);

  return {
    cookies: {
      getAll: vi.fn(() => [{ name: "existing", value: "cookie" }]),
      set: vi.fn(),
    },
    nextUrl: {
      pathname: url.pathname,
      clone: () => new URL(url.toString()),
    },
  } as never;
}

describe("updateSession", () => {
  let nextResponses: ReturnType<typeof createResponse>[];

  beforeEach(() => {
    vi.clearAllMocks();
    nextResponses = [];

    mockedGetPublicSupabaseEnv.mockReturnValue({
      url: "https://timewise.supabase.co",
      anonKey: "anon-key",
    });

    mockedNext.mockImplementation(() => {
      const response = createResponse("next");
      nextResponses.push(response);
      return response as never;
    });

    mockedRedirect.mockImplementation((url: URL) => {
      return createResponse("redirect", url.pathname) as never;
    });
  });

  test("returns the next response for API routes and synchronizes cookies", async () => {
    mockedCreateServerClient.mockImplementation((_url, _anonKey, options: any) => {
      expect(options.cookies.getAll()).toEqual([
        { name: "existing", value: "cookie" },
      ]);

      options.cookies.setAll([
        {
          name: "sb-access-token",
          value: "token",
          options: { path: "/" },
        },
      ]);

      return {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
          }),
        },
      } as never;
    });

    const request = createRequest("/api/events");
    const result = await updateSession(request);

    expect(mockedNext).toHaveBeenCalledTimes(2);
    expect(request.cookies.set).toHaveBeenCalledWith(
      "sb-access-token",
      "token"
    );
    expect(nextResponses[1].cookies.set).toHaveBeenCalledWith(
      "sb-access-token",
      "token",
      { path: "/" }
    );
    expect(result).toBe(nextResponses[1]);
  });

  test("allows unauthenticated access to nested public routes", async () => {
    mockedCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as never);

    const request = createRequest("/reset-password/token");
    const result = await updateSession(request);

    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(result).toBe(nextResponses[0]);
  });

  test("redirects unauthenticated users on protected routes to login", async () => {
    mockedCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    } as never);

    const request = createRequest("/calendar");
    const result = await updateSession(request);

    expect(result).toMatchObject({
      kind: "redirect",
      location: "/login",
    });
  });

  test("redirects authenticated users away from auth routes to home", async () => {
    mockedCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    } as never);

    const request = createRequest("/login");
    const result = await updateSession(request);

    expect(result).toMatchObject({
      kind: "redirect",
      location: "/",
    });
  });

  test("keeps authenticated users on protected routes", async () => {
    mockedCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
        }),
      },
    } as never);

    const request = createRequest("/goals");
    const result = await updateSession(request);

    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(result).toBe(nextResponses[0]);
  });
});
