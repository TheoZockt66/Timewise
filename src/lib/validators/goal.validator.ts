type GoalValidationInput = {
  label?: string | null;
  target_study_time?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

type GoalValidationOptions = {
  requireLabel?: boolean;
  requireTargetStudyTime?: boolean;
};

type GoalValidationResult = {
  valid: boolean;
  error: string | null;
};

const INTERVAL_REGEX = /^\d+:\d{2}:\d{2}$/;

function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function parseIntervalToMinutes(interval: string): number {
  const [hours = "0", minutes = "0"] = interval.split(":");
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
}

/**
 * Validiert Eingaben für Goals für Create- und Update-Operationen.
 */
export function validateGoal(
  data: GoalValidationInput,
  options: GoalValidationOptions = {}
): GoalValidationResult {
  const trimmedLabel = data.label?.trim();

  if (options.requireLabel && !trimmedLabel) {
    return {
      valid: false,
      error: "Bezeichnung ist erforderlich. Bitte gib eine Bezeichnung an.",
    };
  }

  if (data.label !== undefined && data.label !== null) {
    if (trimmedLabel?.length === 0) {
      return {
        valid: false,
        error: "Bezeichnung ist erforderlich. Bitte gib eine Bezeichnung an.",
      };
    }

    if (trimmedLabel && trimmedLabel.length > 100) {
      return { valid: false, error: "Bezeichnung darf maximal 100 Zeichen lang sein." };
    }
  }

  if (options.requireTargetStudyTime && !data.target_study_time) {
    return {
      valid: false,
      error: "Zielzeit ist erforderlich. Bitte gib eine gültige Zielzeit an.",
    };
  }

  if (data.target_study_time !== undefined && data.target_study_time !== null) {
    if (!INTERVAL_REGEX.test(data.target_study_time)) {
      return {
        valid: false,
        error: "Zielzeit muss im Format HH:MM:SS sein.",
      };
    }

    if (parseIntervalToMinutes(data.target_study_time) <= 0) {
      return {
        valid: false,
        error: "Zielzeit muss größer als 0 Minuten sein.",
      };
    }
  }

  if (data.start_time && !isValidDate(data.start_time)) {
    return {
      valid: false,
      error: "Startdatum ist ungültig. Bitte wähle ein gültiges Datum.",
    };
  }

  if (data.end_time && !isValidDate(data.end_time)) {
    return {
      valid: false,
      error: "Enddatum ist ungültig. Bitte wähle ein gültiges Datum.",
    };
  }

  if (data.start_time && data.end_time) {
    if (new Date(data.end_time) < new Date(data.start_time)) {
      return {
        valid: false,
        error: "Enddatum muss nach dem Startdatum liegen.",
      };
    }
  }

  return { valid: true, error: null };
}
