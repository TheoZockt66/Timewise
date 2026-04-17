import { beforeEach, describe, expect, test, vi } from "vitest";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getPublicSupabaseEnv: vi.fn(),
}));

const mockedCreateServerClient = vi.mocked(createServerClient);
const mockedCookies = vi.mocked(cookies);
const mockedGetPublicSupabaseEnv = vi.mocked(getPublicSupabaseEnv);

describe("supabase server client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetPublicSupabaseEnv.mockReturnValue({
      url: "https://timewise.supabase.co",
      anonKey: "anon-key",
    });
  });

  test("creates the server client and wires cookie reads and writes", async () => {
    const cookieStore = {
      getAll: vi.fn(() => [{ name: "existing", value: "cookie" }]),
      set: vi.fn(),
    };

    mockedCookies.mockResolvedValue(cookieStore as never);
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

      return { source: "server" } as never;
    });

    const result = await createClient();

    expect(result).toEqual({ source: "server" });
    expect(cookieStore.set).toHaveBeenCalledWith("sb-access-token", "token", {
      path: "/",
    });
    expect(mockedCreateServerClient).toHaveBeenCalledWith(
      "https://timewise.supabase.co",
      "anon-key",
      expect.any(Object)
    );
  });

  test("ignores read-only cookie store write failures", async () => {
    const cookieStore = {
      getAll: vi.fn(() => []),
      set: vi.fn(() => {
        throw new Error("read-only");
      }),
    };

    mockedCookies.mockResolvedValue(cookieStore as never);
    mockedCreateServerClient.mockImplementation((_url, _anonKey, options: any) => {
      expect(() =>
        options.cookies.setAll([
          {
            name: "sb-refresh-token",
            value: "refresh",
            options: { path: "/" },
          },
        ])
      ).not.toThrow();

      return { source: "server-readonly" } as never;
    });

    await expect(createClient()).resolves.toEqual({
      source: "server-readonly",
    });
  });
});
