import type { Event } from "@/types";

/**
 * ─── EVENT VALIDATOR ───
 * 
 * Zentrale Stelle für Event-Validierung (Single Responsibility Principle).
 * Validierungslogik ist hier konzentriert, nicht verstreut über Komponenten.
 * 
 * Regeln (aus Projektkontext — copilot-instructions.md):
 * - end_time > start_time (gültiger Zeitbereich)
 * - end_time ≤ jetzt (Events nur für Vergangenheit)
 * - Keine Überschneidung mit bestehenden Events
 * - Min. 1 Keyword erforderlich
 */

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Prüft, ob die Zeitspannne gültig ist: end_time muss nach start_time liegen.
 */
export function validateTimeRange(
  startTime: string,
  endTime: string
): ValidationError | null {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return {
        field: "time_range",
        message: "Endzeit muss nach der Startzeit liegen.",
        code: "INVALID_TIME_RANGE",
      };
    }
    return null;
  } catch {
    return {
      field: "time_range",
      message: "Ungültiges Zeitformat.",
      code: "INVALID_TIME_RANGE",
    };
  }
}

/**
 * Prüft, dass Events nicht in der Zukunft liegen.
 * Events können nur für Vergangenheit (oder Gegenwart) erfasst werden.
 */
export function validateNotInFuture(endTime: string): ValidationError | null {
  try {
    const end = new Date(endTime);
    const now = new Date();
    // 60 Sekunden Toleranz für Verarbeitungszeit
    const tolerance = 60 * 1000;

    if (end.getTime() > now.getTime() + tolerance) {
      return {
        field: "end_time",
        message: "Lernzeiten können nur für die Vergangenheit erfasst werden.",
        code: "FUTURE_NOT_ALLOWED",
      };
    }
    return null;
  } catch {
    return {
      field: "end_time",
      message: "Ungültiges Zeitformat.",
      code: "FUTURE_NOT_ALLOWED",
    };
  }
}

/**
 * Prüft auf zeitliche Überschneidungen mit bestehenden Events.
 * 
 * Intervall-Algorithmus: Zwei Zeiträume überschneiden sich, wenn:
 * new.start < existing.end UND new.end > existing.start
 * 
 * Bei Update (mit excludeEventId): Das gerade bearbeitete Event wird ignoriert.
 */
export function validateNoOverlap(
  startTime: string,
  endTime: string,
  existingEvents: Event[],
  excludeEventId?: string
): ValidationError | null {
  try {
    const newStart = new Date(startTime).getTime();
    const newEnd = new Date(endTime).getTime();

    for (const event of existingEvents) {
      // Skip das Event, das gerade bearbeitet wird (bei Update)
      if (excludeEventId && event.id === excludeEventId) {
        continue;
      }

      const existStart = new Date(event.start_time).getTime();
      const existEnd = new Date(event.end_time).getTime();

      // Interval-Overlap Check
      if (newStart < existEnd && newEnd > existStart) {
        return {
          field: "overlap",
          message: `Zeitliche Überschneidung mit bestehender Lernzeit erkannt.`,
          code: "OVERLAP",
        };
      }
    }
    return null;
  } catch {
    return {
      field: "overlap",
      message: "Fehler bei der Überschneidungsprüfung.",
      code: "OVERLAP",
    };
  }
}

/**
 * Berechnet die Dauer eines Events in Minuten.
 * Wird für die UI-Anzeige verwendet (die offizielle Dauer kommt vom Backend).
 */
export function calculateDurationMinutes(
  startTime: string,
  endTime: string
): number | null {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();

    // Negative oder 0 Dauer ist ungültig
    if (durationMs <= 0) {
      return null;
    }

    return Math.round(durationMs / 60000); // Konvertiere zu Minuten
  } catch {
    return null;
  }
}

/**
 * Master-Validierungsfunktion: Führt alle Checks durch.
 * (Template Method Pattern: Feste Reihenfolge der Validierungsschritte)
 */
export function validateEvent(data: {  
  startTime: string,
  endTime: string,
  keywordIds: string[],
  existingEvents: Event[],
  excludeEventId?: string
}): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // 1. Zeitbereich-Validierung (kritisch — andere Prüfungen hängen davon ab)
  const timeRangeError = validateTimeRange(data.startTime, data.endTime);
  if (timeRangeError) {
    errors.push(timeRangeError);
    // Bei ungültigem Bereich können wir nicht weitermachen
    return { isValid: false, errors };
  }

  // 2. Zukunfts-Check
  const futureError = validateNotInFuture(data.endTime);
  if (futureError) {
    errors.push(futureError);
  }

  // 3. Überschneidungs-Check
  const overlapError = validateNoOverlap(
    data.startTime,
    data.endTime,
    data.existingEvents,
    data.excludeEventId
  );
  if (overlapError) {
    errors.push(overlapError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
