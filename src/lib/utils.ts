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