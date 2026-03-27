import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Öffentliche Routen, die ohne Authentifizierung erreichbar sind
const PUBLIC_ROUTES = ["/login", "/register", "/reset-password"];

// API-Routen werden nicht redirected — sie geben selbst 401 zurück
const API_PREFIX = "/api/";

/**
 * Aktualisiert die Supabase Auth Session in der Middleware
 * und schützt geschützte Routen vor unauthentifizierten Zugriffen.
 *
 * Logik:
 * 1. Session-Token erneuern (JWT Refresh)
 * 2. Prüfen ob der User eingeloggt ist
 * 3. Unauthentifizierte User → /login (außer auf öffentlichen Routen)
 * 4. Authentifizierte User auf Auth-Seiten → /calendar
 *
 * Warum Middleware?
 * – Läuft VOR dem Rendering → User sieht nie kurz eine geschützte Seite
 * – Zentraler Ort für Route-Protection (Single Responsibility)
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // API-Routen nicht redirecten — die geben selbst 401 zurück
  if (pathname.startsWith(API_PREFIX)) {
    return supabaseResponse;
  }

  // Prüfe ob die aktuelle Route öffentlich ist
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (!user && !isPublicRoute) {
    // Nicht eingeloggt + geschützte Route → weiter zu /login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && isPublicRoute) {
    // Eingeloggt + auf Auth-Seite → weiter zu /calendar (Dashboard)
    const calendarUrl = request.nextUrl.clone();
    calendarUrl.pathname = "/calendar";
    return NextResponse.redirect(calendarUrl);
  }

  return supabaseResponse;
}
