import { createClient } from "@/lib/supabase/server";
import { validateKeyword } from "@/lib/validators/keyword.validator";

// ─── Service-Funktionen ───

/**
 * Löscht ein Keyword anhand der ID.
 *
 * Ablauf:
 * 1. Supabase-Client erstellen
 * 2. Delete-Operation auf der keywords-Tabelle ausführen
 * 3. Fehler behandeln und Ergebnis zurückgeben
 *
 * Randfall: Wenn das Keyword nicht existiert, gibt Supabase keinen Fehler zurück.
 * Das Verhalten ist idempotent – mehrfaches Löschen ist unkritisch.
 */
export async function deleteKeyword(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("keywords")
    .delete()
    .eq("id", id);

  // Fehlerbehandlung für Supabase-Fehler
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

  return {
    data: null,
    error: null,
  };
}

/**
 * Erstellt ein neues Keyword.
 *
 * Ablauf:
 * 1. Eingabedaten validieren
 * 2. Supabase Insert-Operation ausführen
 * 3. Ergebnis zurückgeben
 *
 * Randfall: Ungültige Eingaben werden vor dem DB-Zugriff abgefangen.
 * Dadurch wird sichergestellt, dass nur valide Daten in die Datenbank gelangen.
 */
export async function createKeyword(data: {
  label?: string;
  color?: string;
  user_id: string;
}) {
  // Schritt 1: Eingabedaten validieren
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

  // Schritt 2: Supabase-Client erstellen und Insert durchführen
  const supabase = await createClient();

  const { data: newKeyword, error } = await supabase
    .from("keywords")
    .insert({
      label: data.label,
      color: data.color,
      user_id: data.user_id,
    })
    .select()
    .single();

  // Schritt 3: Fehlerbehandlung für Supabase-Fehler
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

  return {
    data: newKeyword,
    error: null,
  };
}

/**
 * Aktualisiert ein bestehendes Keyword.
 *
 * Ablauf:
 * 1. Eingabedaten validieren
 * 2. Supabase Update-Operation ausführen
 * 3. Ergebnis zurückgeben
 *
 * Randfall: Nur übergebene Felder werden aktualisiert.
 * Nicht gesetzte Felder bleiben unverändert in der Datenbank bestehen.
 */
export async function updateKeyword(
  id: string,
  data: {
    label?: string;
    color?: string;
    description?: string;
  }
) {
  // Schritt 1: Eingabedaten validieren
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

  // Schritt 2: Supabase-Client erstellen und Update durchführen
  const supabase = await createClient();

  const { data: updatedKeyword, error } = await supabase
    .from("keywords")
    .update({
      label: data.label,
      color: data.color,
    })
    .eq("id", id)
    .select()
    .single();

  // Schritt 3: Fehlerbehandlung für Supabase-Fehler
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

  return {
    data: updatedKeyword,
    error: null,
  };
}