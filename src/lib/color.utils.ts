/**
 * Prüft, ob eine Farbe zu hell ist.
 *
 * Ziel:
 * Verhindert Darstellungsprobleme bei sehr hellen Farben (z. B. Gelb oder Weiß),
 * indem erkannt wird, ob eine zusätzliche Umrandung benötigt wird.
 *
 * Funktionsweise:
 * - Extrahiert die RGB-Werte aus dem Hex-Farbcode
 * - Berechnet die Helligkeit anhand einer gewichteten Formel
 *   (Standardformel für wahrgenommene Helligkeit)
 * - Gibt true zurück, wenn die Farbe als „zu hell“ eingestuft wird
 *
 * Rückgabewert:
 * - true  → Farbe ist sehr hell (Umrandung sinnvoll)
 * - false → Farbe ist ausreichend dunkel
 */
export const isColorTooLight = (hex: string) => {
    // Rot-, Grün- und Blauanteil aus dem Hex-Code extrahieren
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // Berechnung der wahrgenommenen Helligkeit (Standardformel)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Schwellenwert: ab ca. 200 gilt die Farbe als sehr hell
    return brightness > 200;
};