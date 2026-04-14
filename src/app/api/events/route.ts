import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createEvent, fetchEventsServer } from "@/lib/services/event.service";

// ─── API-Endpunkte für Events ───

/**
 * Erstellt ein neues Event (POST /api/events).
 *
 * Ziel:
 * Ein neues Event wird für den aktuell eingeloggten Benutzer erstellt,
 * damit es später im Kalender und in Statistiken angezeigt werden kann.
 *
 * Ablauf:
 * 1. Aktuellen Benutzer über Supabase Auth ermitteln
 * 2. Request-Body auslesen (Daten vom Frontend)
 * 3. Event über den Service erstellen
 * 4. Ergebnis (Erfolg oder Fehler) zurückgeben
 *
 * Randfall:
 * Wenn kein Benutzer eingeloggt ist, wird der Request abgelehnt,
 * da Events immer einem User zugeordnet sein müssen.
 */
export async function POST(request: Request) {
  // Schritt 1: Verbindung zu Supabase herstellen
  const supabase = await createClient();

  // Schritt 2: Aktuellen Benutzer abrufen (JWT-Validierung)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Wenn kein User vorhanden ist → Zugriff verweigern
  if (!user) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "Nicht eingeloggt",
        },
      },
      { status: 401 }
    );
  }

  // Schritt 3: Daten aus dem Request (Frontend) lesen
  const body = await request.json();

  // Schritt 4: Event über den Service erstellen
  // user_id wird automatisch im Service gesetzt
  const result = await createEvent(body);

  // Schritt 5: Ergebnis zurückgeben (inkl. Fehlerhandling aus dem Service)
  return NextResponse.json(result);
}

/**
 * Gibt Events des aktuellen Benutzers zurück (GET /api/events).
 *
 * Ziel:
 * Events eines Users laden, gefiltert nach Zeitraum und Keywords,
 * damit sie im Kalender und in Statistiken angezeigt werden können.
 *
 * Ablauf:
 * 1. Aktuellen Benutzer über Supabase Auth ermitteln
 * 2. Query-Parameter auslesen (start_date, end_date, keyword_ids)
 * 3. Events über den Service laden
 * 4. Ergebnis zurückgeben
 *
 * Randfall:
 * Wenn kein Benutzer eingeloggt ist, wird ein 401 UNAUTHORIZED zurückgegeben,
 * damit das Frontend den Zustand korrekt erkennen kann.
 */
export async function GET(request: Request) {
  // Schritt 1: Verbindung zu Supabase herstellen
  const supabase = await createClient();

  // Schritt 2: Aktuellen Benutzer abrufen
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Kein User → Zugriff verweigert (401), damit das Frontend den Zustand unterscheiden kann
  if (!user) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "UNAUTHORIZED",
          message: "Nicht eingeloggt",
        },
      },
      { status: 401 }
    );
  }

  // Schritt 3: Query-Parameter auslesen
  const { searchParams } = new URL(request.url);
  const start_date = searchParams.get("start_date") || undefined;
  const end_date = searchParams.get("end_date") || undefined;
  const keyword_ids = searchParams.getAll("keyword_ids");

  // Schritt 4: Events über den Service laden
  const result = await fetchEventsServer({
    start_date,
    end_date,
    keyword_ids,
  });

  // Schritt 5: Ergebnis zurückgeben
  return NextResponse.json(result);
}