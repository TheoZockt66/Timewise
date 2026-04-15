import { afterEach, describe, expect, test } from "vitest";
import { getPublicSupabaseEnv } from "@/lib/env";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe("env", () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  });

  test("returns the public supabase environment when both values exist", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(getPublicSupabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "anon-key",
    });
  });

  test("throws when a required environment variable is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    expect(() => getPublicSupabaseEnv()).toThrow(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
    );
  });
});
