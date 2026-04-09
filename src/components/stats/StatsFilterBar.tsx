"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  startDate: string;
  endDate: string;
  granularity: "day" | "week" | "month";
  onChange: (values: {
    startDate: string;
    endDate: string;
    granularity: "day" | "week" | "month";
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
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      
      {/* Zeitraum */}
      <div className="flex gap-2">
        <div>
          <label className="text-sm">Von</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) =>
              onChange({
                startDate: e.target.value,
                endDate,
                granularity,
              })
            }
          />
        </div>

        <div>
          <label className="text-sm">Bis</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) =>
              onChange({
                startDate,
                endDate: e.target.value,
                granularity,
              })
            }
          />
        </div>
      </div>

      {/* Granularity */}
      <div className="flex gap-2">
        <Button
          variant={granularity === "day" ? "default" : "outline"}
          onClick={() =>
            onChange({ startDate, endDate, granularity: "day" })
          }
        >
          Tag
        </Button>

        <Button
          variant={granularity === "week" ? "default" : "outline"}
          onClick={() =>
            onChange({ startDate, endDate, granularity: "week" })
          }
        >
          Woche
        </Button>

        <Button
          variant={granularity === "month" ? "default" : "outline"}
          onClick={() =>
            onChange({ startDate, endDate, granularity: "month" })
          }
        >
          Monat
        </Button>
      </div>
    </div>
  );
}