import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/lib/env";

/**
 * Erstellt einen Supabase-Client für den Server (Server Components, Route Handlers).
 *
 * Warum createServerClient?
 * – Liest/schreibt die Session aus HTTP-Cookies (sicher für SSR)
 * – Jede Server-Anfrage bekommt einen eigenen Client-Kontext
 *
 * Randfall: cookies() ist ein Next.js API-Aufruf; darf nur in
 * Server Components oder Route Handlers aufgerufen werden – nie in Client Components.
 */
export async function createClient() {
  // cookieStore ist ein async Iterator in Next.js 15+
  const cookieStore = await cookies();
  const { url, anonKey } = getPublicSupabaseEnv();

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        // Liest alle Cookies aus dem aktuellen Request
        getAll() {
          return cookieStore.getAll();
        },
        // Setzt/löscht Cookies in der Response
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll kann in Server Components fehlschlagen (read-only context).
            // Das ist akzeptabel, da Middleware die Session-Cookies verwaltet.
          }
        },
      },
    }
  );
}
