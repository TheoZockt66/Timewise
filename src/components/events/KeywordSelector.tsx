"use client";

import React, { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Keyword } from "@/types";

/**
 * ─── KEYWORD SELECTOR ───
 * 
 * Single Responsibility: Nur für das Auswählen von Keywords zuständig.
 * Zeigt diese mit Farb-Tags an und ermöglicht Mehrfachauswahl.
 * 
 * Props sind die Schnittstelle — eltern-Komponente kontrolliert State.
 * (Controlled Component Pattern)
 */

export interface KeywordSelectorProps {
  keywords: Keyword[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  error?: string;
  isLoading?: boolean;
}

export function KeywordSelector({
  keywords,
  selectedIds,
  onSelectionChange,
  error,
  isLoading,
}: KeywordSelectorProps) {
  // Memoize sortierte Liste (verhindert unnötige Re-Renders)
  const sortedKeywords = useMemo(
    () => [...keywords].sort((a, b) => a.label.localeCompare(b.label)),
    [keywords]
  );

  // Handler: Toggle Keyword-Selektion
  const handleToggle = (id: string) => {
    const newIds = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id) // Entfernen
      : [...selectedIds, id]; // Hinzufügen
    onSelectionChange(newIds);
  };

  // State: Loading
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold text-text-primary">
          Tags
        </Label>
        <div className="p-4 text-center text-text-secondary text-sm">
          Tags werden geladen...
        </div>
      </div>
    );
  }

  // State: Keine Keywords verfügbar
  if (keywords.length === 0) {
    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold text-text-primary">
          Tags
        </Label>
        <div className="p-4 text-center border border-border/50 rounded bg-surface text-text-secondary text-sm">
          <p>Keine Tags verfügbar.</p>
          <p className="mt-1 text-xs opacity-75">
            Erstelle zuerst LernTagsbereiche in den Einstellungen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <fieldset className="space-y-4">
      <legend className="text-base font-semibold text-text-primary">
        Tags
      </legend>

      {/* Keyword-Checkboxen in Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-border rounded-lg bg-surface">
        {sortedKeywords.map((keyword) => {
          const isSelected = selectedIds.includes(keyword.id);

          return (
            <div
              key={keyword.id}
              className="flex items-start gap-3 p-2 rounded hover:bg-background transition-colors cursor-pointer"
            >
              {/* Checkbox */}
              <Checkbox
                id={`kw-${keyword.id}`}
                checked={isSelected}
                onCheckedChange={() => handleToggle(keyword.id)}
                className="h-5 w-5 mt-1"
              />

              {/* Label mit Keyword-Info */}
              <label
                htmlFor={`kw-${keyword.id}`}
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {/* Farb-Indikator */}
                  <div
                    className="w-3 h-3 rounded flex-shrink-0"
                    style={{ backgroundColor: keyword.color }}
                    title={keyword.color}
                  />

                  {/* Text */}
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {keyword.label}
                    </p>
                  </div>
                </div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Ausgewählte Keywords als Badges */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const kw = keywords.find((k) => k.id === id);
            return kw ? (
              <div
                key={id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${kw.color}20`,
                  color: kw.color,
                  border: `1px solid ${kw.color}40`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: kw.color }}
                />
                {kw.label}
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* Error-Anzeige */}
      {error && (
        <div
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
