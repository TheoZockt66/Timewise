import { NextResponse } from "next/server";
import { exchangeCodeForSession } from "@/lib/services/auth.service";

/**
 * GET /api/auth/callback
 *
 * Callback-Endpunkt für Supabase Auth.
 * Wird aufgerufen wenn ein Benutzer auf einen Link in einer
 * Bestätigungs- oder Passwort-Reset-E-Mail klickt.
 *
 * Ablauf:
 * 1. Auth-Code aus der URL auslesen (?code=...)
 * 2. Code gegen eine gültige Session tauschen (via Supabase)
 * 3. Weiterleitung zur App (Kalender-Seite bei Erfolg, Login bei Fehler)
 *
 * Randfall: Fehlt der Code-Parameter oder ist er ungültig,
 * wird zur Login-Seite mit Fehlermeldung weitergeleitet.
 *
 * Anforderungsbezug: F5 (E-Mail-Bestätigung), F4 (Passwort-Reset), AK10–AK11
 *
 * @mapigeblich KI-generiert
 */
export async function GET(request: Request): Promise<NextResponse> {
  // URL parsen um Query-Parameter auszulesen
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Kein Code vorhanden → zur Login-Seite weiterleiten
  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=missing_code`
    );
  }

  // Code gegen Session tauschen (Business Logic im Service)
  const result = await exchangeCodeForSession(code);

  if (result.error) {
    // Code ungültig oder abgelaufen → Login mit Fehlermeldung
    return NextResponse.redirect(
      `${origin}/login?error=invalid_code`
    );
  }

  // Erfolg → zur Kalender-Seite weiterleiten (Hauptseite nach Login)
  return NextResponse.redirect(`${origin}/calendar`);
}
