import { NextResponse } from "next/server";
import { deleteEvent, updateEvent } from "@/lib/services/event.service";
import { createClient } from "@/lib/supabase/server";

function buildUnauthorizedResponse() {
  return NextResponse.json(
    { data: null, error: { code: "UNAUTHORIZED", message: "Nicht eingeloggt" } },
    { status: 401 }
  );
}

// ─── API-Endpunkte für einzelne Events ───

/**
 * Löscht ein Event anhand der ID (DELETE /api/events/:id).
 *
 * Ziel:
 * Ein Event wird entfernt, damit es nicht mehr im Kalender
 * und in Statistiken angezeigt wird.
 *
 * Ablauf:
 * 1. Aktuellen Benutzer über Supabase Auth ermitteln
 * 2. Event anhand der ID löschen (über Service)
 * 3. Ergebnis zurückgeben
 *
 * Randfall:
 * Wenn kein Benutzer eingeloggt ist, wird der Zugriff verweigert.
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  // Schritt 1: Prüfen, ob ein Benutzer eingeloggt ist (nur eingeloggte User dürfen Änderungen durchführen)
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return buildUnauthorizedResponse();

  // Schritt 2: ID aus der URL extrahieren
  const { id } = await context.params;

  // Schritt 3: Event löschen (Business Logic im Service)
  const result = await deleteEvent(id);

  // 204 No Content bei Erfolg (RFC 9110); Fehler als JSON mit Statuscode
  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}

/**
 * Aktualisiert ein bestehendes Event (PUT /api/events/:id).
 *
 * Ziel:
 * Ein Event wird angepasst (z. B. Zeit, Beschreibung, Keywords),
 * damit es korrekt im Kalender und in Statistiken angezeigt wird.
 *
 * Ablauf:
 * 1. Aktuellen Benutzer über Supabase Auth ermitteln
 * 2. Request-Body auslesen (neue Daten)
 * 3. Event über den Service aktualisieren
 * 4. Ergebnis zurückgeben
 *
 * Randfall:
 * Wenn kein Benutzer eingeloggt ist, wird der Zugriff verweigert.
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  // Schritt 1: Prüfen, ob ein Benutzer eingeloggt ist (nur eingeloggte User dürfen Änderungen durchführen)
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return buildUnauthorizedResponse();

  // Schritt 2: ID und neue Daten auslesen
  const { id } = await context.params;
  const body = await request.json();

  // Schritt 3: Event aktualisieren (Business Logic im Service)
  const result = await updateEvent(id, body);

  return NextResponse.json(result);
}
