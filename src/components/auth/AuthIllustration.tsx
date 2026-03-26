"use client";

import { BarChart3, Clock, Target, TrendingUp } from "lucide-react";

/**
 * AuthIllustration – Dekorative Illustration für die rechte Seite der Auth-Seiten.
 * Zeigt stilisierte Icons und einen Slogan, um den Zweck der App zu vermitteln.
 * Orientiert sich am Design-Referenzbild mit einer visuellen Darstellung rechts.
 */
export function AuthIllustration() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 px-8 text-center">
      {/* Icon-Grid als abstrakte Illustration */}
      <div className="relative">
        {/* Hintergrund-Kreis als dekoratives Element */}
        <div className="h-64 w-64 rounded-full bg-white/10 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-6">
            {/* Vier thematische Icons repräsentieren die Hauptfunktionen */}
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Clock className="h-12 w-12 text-white" />
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <BarChart3 className="h-12 w-12 text-[var(--tw-accent-200)]" />
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <Target className="h-12 w-12 text-[var(--tw-accent-100)]" />
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <TrendingUp className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Slogan und Beschreibung analog zum Referenzdesign */}
      <div className="max-w-sm">
        <h2 className="text-2xl font-bold text-white">
          Behalte deine Lernzeit im Blick
        </h2>
        <p className="mt-3 text-base text-white/70">
          Erfasse deine Lernzeiten, visualisiere deinen Fortschritt und
          erreiche deine Ziele – strukturiert und übersichtlich.
        </p>
      </div>
    </div>
  );
}
