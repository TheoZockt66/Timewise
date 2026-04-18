"use client";

import React, { useMemo } from "react";
import { getKeywordBadgeStyles, getSelectedKeywordDotStyles } from "@/lib/utils";
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
  disabled?: boolean;
  error?: string;
  isLoading?: boolean;
}

export function KeywordSelector({
  keywords,
  selectedIds,
  onSelectionChange,
  disabled = false,
  error,
  isLoading,
}: KeywordSelectorProps) {
  // Memoize sortierte Liste (verhindert unnötige Re-Renders)
  const sortedKeywords = useMemo(
    () => [...keywords].sort((a, b) => a.label.localeCompare(b.label)),
    [keywords]
  );

  // State: Loading
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Keywords (optional)</span>
        <div className="p-4 text-center text-text-secondary text-sm">
          Keywords werden geladen...
        </div>
      </div>
    );
  }

  // State: Keine Keywords verfügbar
  if (keywords.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Keywords (optional)</span>
        <div className="p-4 text-center border border-border/50 rounded bg-surface text-text-secondary text-sm">
          <p>Keine Keywords verfügbar.</p>
          <p className="mt-1 text-xs opacity-75">
            Erstelle zuerst LernTagsbereiche in den Einstellungen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Keywords (optional)</span>
      <div className="flex flex-wrap gap-2">
        {sortedKeywords.map((keyword) => {
          const isSelected = selectedIds.includes(keyword.id);
          const selectedKeywordStyles = getKeywordBadgeStyles(keyword.color);

          return (
            <button
              key={keyword.id}
              type="button"
              onClick={() => {
                const newIds = selectedIds.includes(keyword.id)
                  ? selectedIds.filter((id) => id !== keyword.id)
                  : [...selectedIds, keyword.id];
                onSelectionChange(newIds);
              }}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
                isSelected
                  ? ""
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
              style={isSelected ? selectedKeywordStyles : {}}
              disabled={disabled}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{
                  ...(isSelected
                    ? getSelectedKeywordDotStyles(keyword.color)
                    : { backgroundColor: keyword.color }),
                }}
              />
              {keyword.label}
            </button>
          );
        })}
      </div>

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
    </div>
  );
}
