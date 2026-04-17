import { beforeEach, describe, expect, test, vi } from "vitest";
import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getPublicSupabaseEnv: vi.fn(),
}));

const mockedCreateBrowserClient = vi.mocked(createBrowserClient);
const mockedGetPublicSupabaseEnv = vi.mocked(getPublicSupabaseEnv);

describe("supabase browser client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetPublicSupabaseEnv.mockReturnValue({
      url: "https://timewise.supabase.co",
      anonKey: "anon-key",
    });
  });

  test("creates the browser client with the public supabase environment", () => {
    const browserClient = { source: "browser" };
    mockedCreateBrowserClient.mockReturnValue(browserClient as never);

    const result = createClient();

    expect(result).toBe(browserClient);
    expect(mockedCreateBrowserClient).toHaveBeenCalledWith(
      "https://timewise.supabase.co",
      "anon-key"
    );
  });
});
