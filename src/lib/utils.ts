import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Hilfsfunktion für bedingte Tailwind-Klassen (shadcn/ui Standard).
 *
 * clsx:      kombiniert mehrere Klassen-Argumente (auch bedingte Objekte)
 * twMerge:   löst Tailwind-Konflikte auf (z.B. "p-2 p-4" → "p-4")
 *
 * Verwendung: cn("text-sm", isActive && "font-bold", "text-foreground")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/**
 * Formatiert ein Date-Objekt in YYYY-MM-DD (für Input-Felder).
 * Wichtig: nutzt lokale Zeit → kein UTC-Bug wie bei toISOString().
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeHexColor(color: string): string | null {
  const trimmedColor = color.trim();
  const shortHexMatch = /^#([0-9a-fA-F]{3})$/.exec(trimmedColor);

  if (shortHexMatch) {
    const [r, g, b] = shortHexMatch[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return /^#([0-9a-fA-F]{6})$/.test(trimmedColor) ? trimmedColor : null;
}

export function isLightHexColor(color: string): boolean {
  const normalizedColor = normalizeHexColor(color);

  if (!normalizedColor) {
    return false;
  }

  const red = parseInt(normalizedColor.slice(1, 3), 16);
  const green = parseInt(normalizedColor.slice(3, 5), 16);
  const blue = parseInt(normalizedColor.slice(5, 7), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance >= 186;
}

function isNearWhiteHexColor(color: string): boolean {
  const normalizedColor = normalizeHexColor(color);

  if (!normalizedColor) {
    return false;
  }

  const red = parseInt(normalizedColor.slice(1, 3), 16);
  const green = parseInt(normalizedColor.slice(3, 5), 16);
  const blue = parseInt(normalizedColor.slice(5, 7), 16);
  const minChannel = Math.min(red, green, blue);
  const maxChannel = Math.max(red, green, blue);

  return minChannel >= 245 && maxChannel - minChannel <= 12;
}

export function getKeywordBadgeStyles(color: string) {
  const isNearWhiteColor = isNearWhiteHexColor(color);
  const isLightColor = isLightHexColor(color);

  if (isNearWhiteColor) {
    return {
      backgroundColor: "rgba(119, 0, 244, 0.08)",
      color: "#1A1A2E",
      borderColor: "rgba(119, 0, 244, 0.22)",
      boxShadow: "inset 0 0 0 1px rgba(119, 0, 244, 0.06)",
    };
  }

  if (isLightColor) {
    return {
      backgroundColor: color,
      color: "#1A1A2E",
      borderColor: "rgba(26, 26, 46, 0.14)",
    };
  }

  return {
    backgroundColor: color,
    color: "#FFFFFF",
    borderColor: "transparent",
  };
}

export function getKeywordDotStyles(color: string) {
  const isLightColor = isLightHexColor(color);

  return {
    backgroundColor: color,
    boxShadow: isLightColor ? "inset 0 0 0 1px rgba(26, 26, 46, 0.18)" : undefined,
  };
}

export function getSelectedKeywordDotStyles(color: string) {
  const isNearWhiteColor = isNearWhiteHexColor(color);
  const isLightColor = isLightHexColor(color);

  return {
    backgroundColor: isNearWhiteColor ? "#FFFFFF" : color,
    boxShadow: isLightColor ? "inset 0 0 0 1px rgba(26, 26, 46, 0.18)" : undefined,
  };
}
