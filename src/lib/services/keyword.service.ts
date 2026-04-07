import { createClient } from "@/lib/supabase/server";
import { validateKeyword } from "@/lib/validators/keyword.validator";

// ─── Service-Funktionen ───

/**
 * Löscht ein Keyword anhand der ID.
 *
 * Ziel:
 * Ein Keyword wird aus der Datenbank entfernt, damit es nicht mehr
 * für Lernzeiteinträge (Events) verwendet werden kann.
 *
 * Ablauf:
 * 1. Verbindung zur Datenbank herstellen
 * 2. Keyword anhand der ID aus der Tabelle "keywords" löschen
 * 3. Fehler behandeln oder Erfolg zurückgeben
 *
 * Randfall:
 * Wenn das Keyword nicht existiert, passiert nichts (kein Fehler).
 * Das Löschen ist idempotent – mehrfaches Löschen hat keine negativen Auswirkungen.
 */
export async function deleteKeyword(id: string) {
  // Schritt 1: Verbindung zur Datenbank herstellen
  const supabase = await createClient();

  // Schritt 2: Keyword mit der passenden ID löschen
  const { error } = await supabase
    .from("keywords")
    .delete()
    .eq("id", id);

  // Schritt 3: Fehlerbehandlung, falls die Datenbankoperation fehlschlägt
  if (error) {
    return {
      data: null,
      error: {
        code: "DELETE_FAILED",
        message: "Keyword konnte nicht gelöscht werden.",
        details: error.message,
      },
    };
  }

  // Erfolgsfall: Kein Fehler bedeutet, dass das Löschen erfolgreich war
  return {
    data: null,
    error: null,
  };
}

/**
 * Erstellt ein neues Keyword.
 *
 * Ziel:
 * Ein Keyword wird in der Datenbank gespeichert, damit es später
 * Lernzeiteinträgen (Events) zugeordnet werden kann.
 *
 * Ablauf:
 * 1. Eingabedaten validieren (z. B. leeres Label oder falscher Farbwert verhindern)
 * 2. Keyword in der Datenbank speichern
 * 3. Fehler behandeln oder das neu erstellte Keyword zurückgeben
 *
 * Randfall:
 * Ungültige Daten werden früh abgefangen, damit keine fehlerhaften
 * Einträge in der Datenbank entstehen.
 */
export async function createKeyword(data: {
  label?: string;
  color?: string;
  user_id: string;
}) {
  // Schritt 1: Validierung schützt die Datenbank vor ungültigen Eingaben
  // Beispiel: leeres Label oder ungültiger Hex-Farbwert
  const validation = validateKeyword(data);

  if (!validation.valid) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error,
      },
    };
  }

  // Schritt 2: Verbindung zur Datenbank herstellen
  const supabase = await createClient();

  // Schritt 3: Keyword wird in der Tabelle "keywords" gespeichert
  // .select().single() sorgt dafür, dass wir direkt das gespeicherte Objekt zurückbekommen
  const { data: newKeyword, error } = await supabase
    .from("keywords")
    .insert({
      label: data.label,
      color: data.color,
      user_id: data.user_id,
    })
    .select()
    .single();

  // Schritt 4: Falls ein Fehler von Supabase kommt (z. B. DB-Problem), sauber behandeln
  if (error) {
    return {
      data: null,
      error: {
        code: "CREATE_FAILED",
        message: "Keyword konnte nicht erstellt werden.",
        details: error.message,
      },
    };
  }

  // Erfolgsfall: Das neu erstellte Keyword wird zurückgegeben
  return {
    data: newKeyword,
    error: null,
  };
}

/**
 * Aktualisiert ein bestehendes Keyword.
 *
 * Ziel:
 * Ein vorhandenes Keyword wird angepasst (z. B. Name oder Farbe),
 * damit es weiterhin korrekt für Lernzeiteinträge (Events) verwendet werden kann.
 *
 * Ablauf:
 * 1. Eingabedaten validieren (ungültige Änderungen verhindern)
 * 2. Keyword in der Datenbank anhand der ID aktualisieren
 * 3. Fehler behandeln oder das aktualisierte Keyword zurückgeben
 *
 * Randfall:
 * Nur die übergebenen Felder werden geändert.
 * Nicht gesetzte Felder bleiben unverändert bestehen.
 */
export async function updateKeyword(
  id: string,
  data: {
    label?: string;
    color?: string;
  }
) {
  // Schritt 1: Validierung verhindert, dass ungültige Änderungen gespeichert werden
  const validation = validateKeyword(data);

  if (!validation.valid) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.error,
      },
    };
  }

  // Schritt 2: Verbindung zur Datenbank herstellen
  const supabase = await createClient();

  // Schritt 3: Keyword wird anhand der ID aktualisiert
  // Nur die angegebenen Felder (label, color) werden überschrieben
  const { data: updatedKeyword, error } = await supabase
    .from("keywords")
    .update({
      label: data.label,
      color: data.color,
    })
    .eq("id", id)
    .select()
    .single();

  // Schritt 4: Fehlerbehandlung, falls die Datenbankoperation fehlschlägt
  if (error) {
    return {
      data: null,
      error: {
        code: "UPDATE_FAILED",
        message: "Keyword konnte nicht aktualisiert werden.",
        details: error.message,
      },
    };
  }

  // Erfolgsfall: Das aktualisierte Keyword wird zurückgegeben
  return {
    data: updatedKeyword,
    error: null,
  };
}