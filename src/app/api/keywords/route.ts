import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createKeyword } from "@/lib/services/keyword.service";

// ─── API-Endpunkte für Keywords ───

/**
 * Erstellt ein neues Keyword (POST /api/keywords).
 *
 * Ziel:
 * Ein neues Keyword wird für den aktuell eingeloggten Benutzer erstellt,
 * damit es später für Lernzeiteinträge verwendet werden kann.
 *
 * Ablauf:
 * 1. Aktuellen Benutzer über Supabase Auth ermitteln
 * 2. Request-Body auslesen (Daten vom Frontend)
 * 3. Keyword über den Service erstellen
 * 4. Ergebnis (Erfolg oder Fehler) zurückgeben
 *
 * Randfall:
 * Wenn kein Benutzer eingeloggt ist, wird der Request abgelehnt,
 * da Keywords immer einem User zugeordnet sein müssen.
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

  // Schritt 4: Keyword über den Service erstellen
  // user_id wird hier gesetzt, damit das Keyword dem User gehört
  const result = await createKeyword({
    ...body,
    user_id: user.id,
  });

  // Schritt 5: Ergebnis zurückgeben (inkl. Fehlerhandling aus dem Service)
  return NextResponse.json(result);
}

/**
 * Gibt alle Keywords des aktuellen Benutzers zurück (GET /api/keywords).
 *
 * Ziel:
 * Alle gespeicherten Keywords eines Users laden, damit sie im UI angezeigt
 * und für Lernzeiteinträge ausgewählt werden können.
 *
 * Ablauf:
 * 1. Aktuellen Benutzer über Supabase Auth ermitteln
 * 2. Alle Keywords dieses Users alphabetisch sortiert nach Label aus der Datenbank laden
 * 3. Ergebnis zurückgeben
 *
 * Randfall:
 * Wenn kein Benutzer eingeloggt ist, wird ein 401 UNAUTHORIZED zurückgegeben,
 * damit das Frontend den Zustand korrekt erkennen kann.
 */
export async function GET() {
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

  // Schritt 3: Alle Keywords des Users alphabetisch sortiert laden
  const { data, error } = await supabase
    .from("keywords")
    .select("*")
    .eq("user_id", user.id)
    .order("label", { ascending: true });

  // Schritt 4: Ergebnis zurückgeben
  return NextResponse.json({
    data,
    error,
  });
}