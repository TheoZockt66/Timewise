export function validateKeyword(data: {
  label?: string;
  color?: string;
  description?: string;
}) {
  // Label prüfen
  if (!data.label || data.label.trim().length === 0) {
    return {
      valid: false,
      error: "Label darf nicht leer sein",
    };
  }

  // Max Länge (z. B. 50 Zeichen)
  if (data.label.length > 50) {
    return {
      valid: false,
      error: "Label darf maximal 50 Zeichen lang sein",
    };
  }

  // Farbe prüfen (Hex-Code)
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!data.color || !hexRegex.test(data.color)) {
    return {
      valid: false,
      error: "Farbe muss ein gültiger Hex-Code sein (#RRGGBB)",
    };
  }

  return {
    valid: true,
    error: null,
  };
}