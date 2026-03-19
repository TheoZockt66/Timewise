import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Aktualisiert die Supabase Auth Session in der Middleware.
 *
 * Warum Middleware?
 * – Supabase JWT-Sessions haben eine kurze Lebensdauer und müssen
 *   serverseitig erneuert werden, bevor jede Seite gerendert wird.
 * – Die Middleware läuft vor jedem Request und ist der richtige Ort dafür.
 *
 * Randfall: Läuft auf der Edge Runtime – keine Node.js-APIs verfügbar.
 */
export async function updateSession(request: NextRequest) {
  // Erstelle eine Antwort, die wir anschließend modifizieren können
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          // Cookies in den Request-Header setzen (für nachfolgende Server-Reads)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Neue Response mit aktualisierten Cookies erstellen
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // WICHTIG: getUser() muss aufgerufen werden, um die Session zu erneuern.
  // Niemals durch getSession() ersetzen – das würde den Token nicht refreshen.
  await supabase.auth.getUser();

  return supabaseResponse;
}
