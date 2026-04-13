const REQUIRED_PUBLIC_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type PublicEnvKey = (typeof REQUIRED_PUBLIC_ENV_VARS)[number];

function readRequiredEnv(name: PublicEnvKey): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it locally in .env.local and in the Vercel project settings.`
    );
  }

  return value;
}

export function getPublicSupabaseEnv() {
  return {
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
