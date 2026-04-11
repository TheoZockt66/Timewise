"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

/**
 * Props für die StatsFilterBar.
 *
 * Beschreibung:
 * - startDate / endDate → aktuell ausgewählter Zeitraum (YYYY-MM-DD)
 * - granularity → Gruppierung der Daten (day / week / month)
 * - keywordIds → aktuell ausgewählte Keywords für die Filterung
 * - onChange → Callback zur Aktualisierung der Filter im Parent (State wird dort gehalten)
 */
type Props = {
  startDate: string;
  endDate: string;
  granularity: "day" | "week" | "month";
  keywordIds: string[];

  onChange: (values: {
    startDate: string;
    endDate: string;
    granularity: "day" | "week" | "month";
    keywordIds: string[];
  }) => void;
};

/**
 * StatsFilterBar
 *
 * Ziel:
 * Stellt Filter für die Statistik dar (Zeitraum + Granularität).
 *
 * Architektur:
 * Reine UI-Komponente → keine Datenlogik
 */
export default function StatsFilterBar({
  startDate,
  endDate,
  granularity,
  keywordIds,
  onChange,
}: Props) {

  const updateFilters = (updates: Partial<{
    startDate: string;
    endDate: string;
    granularity: "day" | "week" | "month";
    keywordIds: string[];
  }>) => {
    onChange({
      startDate,
      endDate,
      granularity,
      keywordIds,
      ...updates,
    });
  };
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

      {/* Zeitraum-Auswahl (Start- und Enddatum) */}
      <div className="flex gap-2">
        <div>
          <label className="text-sm">Von</label>
          <Input
            type="date"
            value={startDate}
            /* Aktualisiert den Startzeitraum und übernimmt bestehende Filter (Granularität, Keywords) */
            onChange={(e) =>
              updateFilters({ startDate: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-sm">Bis</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) =>
              updateFilters({ endDate: e.target.value })
            }
          />
        </div>
      </div>

      {/* Auswahl der Gruppierung (Tag, Woche, Monat) */}
      <div className="flex gap-2">
        <Button
          variant={granularity === "day" ? "default" : "outline"}
          className="h-11"
          onClick={() => {
            const today = new Date();
            const date = formatDate(today);

            updateFilters({
              granularity: "day",
              startDate: date,
              endDate: date,
            });
          }}
        >
          Tag
        </Button>

        <Button
          variant={granularity === "week" ? "default" : "outline"}
          className="h-11"
          onClick={() => {
            const today = new Date();
            const day = today.getDay();

            // Berechnet die Verschiebung zum Montag der aktuellen Woche
            // (Sonntag = Sonderfall, da getDay() = 0)
            const offsetToMonday = day === 0 ? -6 : 1 - day;

            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() + offsetToMonday);

            updateFilters({
              granularity: "week",
              startDate: formatDate(startOfWeek),
              endDate: formatDate(today),
            });
          }}
        >
          Woche
        </Button>

        <Button
          variant={granularity === "month" ? "default" : "outline"}
          className="h-11"
          onClick={() => {
            const today = new Date();

            // Setzt den Zeitraum auf den ersten Tag des aktuellen Monats
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            updateFilters({
              granularity: "month",
              startDate: formatDate(startOfMonth),
              endDate: formatDate(today),
            });
          }}
        >
          Monat
        </Button>
      </div>
    </div>
  );
}