"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calculateDurationMinutes } from "@/lib/validators/event.validator";

/**
 * ─── TIME RANGE PICKER ───
 * 
 * Single Responsibility: Nur für Zeit-Auswahl zuständig.
 * Props sind die Schnittstelle — keine versteckten Dependencies.
 * 
 * Zeigt:
 * - Start-Zeit (datetime-local)
 * - End-Zeit (datetime-local)
 * - Berechnete Dauer (Minuten)
 * - Error-Nachricht (falls Validierung fehlgeschlagen)
 */

export interface TimeRangePickerProps {
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  error?: string;
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  error,
}: TimeRangePickerProps) {
  // Berechne Dauer zur Anzeige
  const duration = calculateDurationMinutes(startTime, endTime);
  const durationText =
    duration !== null ? `${duration} Minute${duration === 1 ? "" : "n"}` : "—";

  // Helfer: ISO 8601 → datetime-local Format (HTML5 Input)
  // "2025-04-07T14:30:00" → "2025-04-07T14:30"
  const toDatetimeLocal = (iso: string): string => (iso ? iso.slice(0, 16) : "");

  // Helfer: datetime-local → ISO 8601
  // "2025-04-07T14:30" → "2025-04-07T14:30:00"
  const toISO = (dt: string): string => (dt ? `${dt}:00` : "");

  return (
    <fieldset className="space-y-4 border border-border rounded-lg p-5 bg-surface">
      <legend className="text-base font-semibold text-text-primary px-2">
        Lernzeit
      </legend>

      {/* Startzeit und Endzeit nebeneinander */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="start-time"
            className="text-base font-medium text-text-primary"
          >
            Startzeit
          </Label>
          <Input
            id="start-time"
            type="datetime-local"
            value={toDatetimeLocal(startTime)}
            onChange={(e) => onStartChange(toISO(e.target.value))}
            className="h-11 text-base"
            aria-describedby={error ? "time-error" : undefined}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="end-time"
            className="text-base font-medium text-text-primary"
          >
            Endzeit
          </Label>
          <Input
            id="end-time"
            type="datetime-local"
            value={toDatetimeLocal(endTime)}
            onChange={(e) => onEndChange(toISO(e.target.value))}
            className="h-11 text-base"
            aria-describedby={error ? "time-error" : undefined}
          />
        </div>
      </div>

      {/* Dauer-Anzeige */}
      {startTime && endTime && (
        <div className="flex items-center justify-between p-3 bg-background rounded border border-border text-sm">
          <span className="text-text-secondary font-medium">Dauer:</span>
          <span className={duration ? "text-primary font-semibold" : "text-text-disabled"}>
            {durationText}
          </span>
        </div>
      )}

      {/* Error-Anzeige */}
      {error && (
        <div
          id="time-error"
          className="p-3 bg-error/10 border border-error rounded text-error text-sm flex gap-2"
          role="alert"
        >
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
    </fieldset>
  );
}
