"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Props für die StatsFilterBar.
 *
 * Beschreibung:
 * - startDate / endDate → aktueller Zeitraum
 * - granularity → aktuelle Gruppierung (day / week / month)
 * - keywordIds → aktuell ausgewählte Keywords (für spätere Filterung)
 * - onChange → Callback zur Aktualisierung der Filter im Parent
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
          onClick={() =>
            updateFilters({ granularity: "day" })
          }
        >
          Tag
        </Button>

        <Button
          variant={granularity === "week" ? "default" : "outline"}
          onClick={() =>
            updateFilters({ granularity: "week" })
          }
        >
          Woche
        </Button>

        <Button
          variant={granularity === "month" ? "default" : "outline"}
          onClick={() =>
            updateFilters({ granularity: "month" })
          }
        >
          Monat
        </Button>
      </div>
    </div>
  );
}