/**
 * Validiert die Eingabedaten für ein Keyword.
 *
 * Ziel:
 * Sicherstellen, dass nur gültige Keywords in der Datenbank gespeichert werden,
 * um fehlerhafte Daten (z. B. leere Labels oder ungültige Farben) zu verhindern.
 *
 * Ablauf:
 * 1. Prüfen, ob das Label vorhanden ist und nicht nur aus Leerzeichen besteht
 * 2. Prüfen, ob das Label die maximale Länge (50 Zeichen) nicht überschreitet
 * 3. Prüfen, ob die Farbe ein gültiger Hex-Code ist (#RRGGBB)
 *
 * Randfall:
 * Leerzeichen im Label werden entfernt (trim), damit Eingaben wie "   Mathe   "
 * korrekt behandelt werden und nicht als gültig durchrutschen.
 */
export function validateKeyword(data: {
  label?: string;
  color?: string;
  description?: string;
}) {
  // Label darf nicht leer sein (auch nicht nur Leerzeichen)
  if (!data.label || data.label.trim().length === 0) {
    return {
      valid: false,
      error: "Label darf nicht leer sein",
    };
  }

  // Label darf maximal 50 Zeichen lang sein (ohne führende/folgende Leerzeichen)
  if (data.label.trim().length > 50) {
    return {
      valid: false,
      error: "Label darf maximal 50 Zeichen lang sein",
    };
  }

  // Farbe muss ein gültiger Hex-Code sein (#RRGGBB)
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  if (!data.color || !hexRegex.test(data.color)) {
    return {
      valid: false,
      error: "Farbe muss ein gültiger Hex-Code sein (#RRGGBB)",
    };
  }

  // Alle Prüfungen bestanden → Keyword ist gültig
  return {
    valid: true,
    error: null,
  };
}