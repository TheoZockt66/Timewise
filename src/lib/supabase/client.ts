import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env";

/**
 * Erstellt einen Supabase-Client für den Browser (Client Components).
 *
 * Warum createBrowserClient?
 * – Speichert die Session im localStorage (kein Leaken in SSR-Context)
 * – Wird in Client Components ("use client") verwendet
 *
 * Randfall: Fehlt eine der Env-Variablen, wirft Next.js einen Build-Fehler.
 * Dies ist gewollt – fehlerhafte Konfiguration soll sofort auffallen.
 */
export function createClient() {
  const { url, anonKey } = getPublicSupabaseEnv();

  return createBrowserClient(
    url,
    anonKey
  );
}
