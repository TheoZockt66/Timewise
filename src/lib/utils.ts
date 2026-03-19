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
