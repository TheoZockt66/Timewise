import { createBrowserClient } from "@supabase/ssr";

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
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
