import type { Event } from "@/types";

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

export function validateTimeRange(
  startTime: string,
  endTime: string
): ValidationError | null {
  if (!isValidDate(startTime) || !isValidDate(endTime)) {
    return {
      field: "time_range",
      message: "Ungueltiges Zeitformat.",
      code: "INVALID_TIME_RANGE",
    };
  }

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
}

export function validateKeywordSelection(keywordIds: string[]): ValidationError | null {
  if (keywordIds.length === 0) {
    return {
      field: "keyword_ids",
      message: "Bitte waehle mindestens ein Keyword aus.",
      code: "KEYWORD_REQUIRED",
    };
  }

  return null;
}

export function validateNotInFuture(endTime: string): ValidationError | null {
  if (!isValidDate(endTime)) {
    return {
      field: "end_time",
      message: "Ungueltiges Zeitformat.",
      code: "FUTURE_NOT_ALLOWED",
    };
  }

  const end = new Date(endTime);
  const tolerance = 60 * 1000;

  if (end.getTime() > Date.now() + tolerance) {
    return {
      field: "end_time",
      message: "Lernzeiten koennen nur fuer die Vergangenheit erfasst werden.",
      code: "FUTURE_NOT_ALLOWED",
    };
  }

  return null;
}

export function validateNoOverlap(
  startTime: string,
  endTime: string,
  existingEvents: Event[],
  excludeEventId?: string
): ValidationError | null {
  if (!isValidDate(startTime) || !isValidDate(endTime)) {
    return {
      field: "overlap",
      message: "Fehler bei der Ueberschneidungspruefung.",
      code: "OVERLAP",
    };
  }

  const newStart = new Date(startTime).getTime();
  const newEnd = new Date(endTime).getTime();

  for (const event of existingEvents) {
    if (excludeEventId && event.id === excludeEventId) {
      continue;
    }

    if (!isValidDate(event.start_time) || !isValidDate(event.end_time)) {
      continue;
    }

    const existingStart = new Date(event.start_time).getTime();
    const existingEnd = new Date(event.end_time).getTime();

    if (newStart < existingEnd && newEnd > existingStart) {
      return {
        field: "overlap",
        message: "Zeitliche Ueberschneidung mit bestehender Lernzeit erkannt.",
        code: "OVERLAP",
      };
    }
  }

  return null;
}

export function calculateDurationMinutes(
  startTime: string,
  endTime: string
): number | null {
  if (!isValidDate(startTime) || !isValidDate(endTime)) {
    return null;
  }

  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();

  if (durationMs <= 0) {
    return null;
  }

  return Math.round(durationMs / 60000);
}

export function validateEvent(data: {
  startTime: string;
  endTime: string;
  keywordIds: string[];
  existingEvents: Event[];
  excludeEventId?: string;
}): { isValid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  const timeRangeError = validateTimeRange(data.startTime, data.endTime);
  if (timeRangeError) {
    return {
      isValid: false,
      errors: [timeRangeError],
    };
  }

  const keywordError = validateKeywordSelection(data.keywordIds);
  if (keywordError) {
    errors.push(keywordError);
  }

  const futureError = validateNotInFuture(data.endTime);
  if (futureError) {
    errors.push(futureError);
  }

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
