import { NextResponse } from "next/server";
import { deleteKeyword, updateKeyword } from "@/lib/services/keyword.service";
import { createClient } from "@/lib/supabase/server";

// ─── API-Endpunkte für einzelne Keywords ───

/**
 * Löscht ein Keyword anhand der ID (DELETE /api/keywords/:id).
 *
 * Ziel:
 * Ein Keyword wird entfernt, damit es nicht mehr für Lernzeiteinträge
 * verwendet werden kann.
 *
 * Ablauf:
 * 1. Aktuellen Benutzer über Supabase Auth ermitteln
 * 2. Keyword anhand der ID löschen (über Service)
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

  if (!user) {
    return NextResponse.json({
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Nicht eingeloggt",
      },
    });
  }

  // Schritt 2: ID aus der URL extrahieren
  const { id } = await context.params;

  // Schritt 3: Keyword löschen (Business Logic im Service)
  const result = await deleteKeyword(id);

  return NextResponse.json(result);
}

/**
 * Aktualisiert ein bestehendes Keyword (PUT /api/keywords/:id).
 *
 * Ziel:
 * Ein Keyword wird angepasst (z. B. Name oder Farbe),
 * damit es weiterhin korrekt im System verwendet werden kann.
 *
 * Ablauf:
 * 1. Aktuellen Benutzer über Supabase Auth ermitteln
 * 2. Request-Body auslesen (neue Daten)
 * 3. Keyword über den Service aktualisieren
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

  if (!user) {
    return NextResponse.json({
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Nicht eingeloggt",
      },
    });
  }

  // Schritt 2: ID und neue Daten auslesen
  const { id } = await context.params;
  const body = await request.json();

  // Schritt 3: Keyword aktualisieren (Business Logic im Service)
  const result = await updateKeyword(id, body);

  return NextResponse.json(result);
}