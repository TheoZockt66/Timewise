/**
 * Validiert die Eingabedaten für ein Ziel (Goal).
 *
 * Ziel:
 * Sicherstellen, dass nur gültige Zieldaten in der Datenbank gespeichert
 * werden — ungültige Zeitangaben oder zu lange Labels werden früh abgefangen.
 *
 * Ablauf:
 * 1. Label ist optional, darf aber nicht mehr als 100 Zeichen haben
 * 2. target_study_time muss ein gültiges PostgreSQL-INTERVAL haben ("HH:MM:SS")
 * 3. Wenn start_time und end_time gesetzt: end_time muss nach start_time liegen
 *
 * Randfall:
 * Leerzeichen im Label werden mit trim() bereinigt, damit " Mathe " korrekt
 * auf 5 Zeichen geprüft wird.
 */
export function validateGoal(data: {
  label?: string;
  target_study_time?: string;
  start_time?: string;
  end_time?: string;
}) {
  // Label ist optional — wenn gesetzt, darf es nicht zu lang sein
  if (data.label !== undefined && data.label.trim().length > 100) {
    return { valid: false, error: "Label darf maximal 100 Zeichen lang sein" };
  }

  // target_study_time muss im Format "HH:MM:SS" vorliegen (PostgreSQL INTERVAL)
  if (data.target_study_time !== undefined) {
    // Erlaubt: "20:00:00", "100:30:00" — Stunden dürfen > 24 sein
    const intervalRegex = /^\d+:\d{2}:\d{2}$/;
    if (!intervalRegex.test(data.target_study_time)) {
      return {
        valid: false,
        error: "Zielzeit muss im Format HH:MM:SS sein (z. B. '20:00:00' für 20 Stunden)",
      };
    }
  }

  // Wenn beide Zeitpunkte gesetzt, muss end_time nach start_time liegen
  if (data.start_time && data.end_time) {
    if (new Date(data.end_time) <= new Date(data.start_time)) {
      return { valid: false, error: "Enddatum muss nach dem Startdatum liegen" };
    }
  }

  return { valid: true, error: null };
}
