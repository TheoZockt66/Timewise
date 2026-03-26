"use client";

import { Clock } from "lucide-react";

/**
 * AuthLogo – Timewise Logo-Komponente für Auth-Seiten.
 * Zeigt das Timewise-Logo mit Uhr-Icon und Schriftzug.
 * Single Responsibility: nur für die Logo-Darstellung zuständig.
 */
export function AuthLogo() {
  return (
    <div className="flex items-center gap-2">
      {/* Uhr-Icon als visuelles Symbol für Zeitmanagement */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
        <Clock className="h-6 w-6 text-primary-foreground" />
      </div>
      {/* Markenname mit Primärfarbe */}
      <span className="text-2xl font-bold text-primary">Timewise</span>
    </div>
  );
}
