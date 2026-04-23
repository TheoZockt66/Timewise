'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface DeleteEventDialogProps {
  /**
   * Name oder Label des Events für die Bestätigungsnachricht
   */
  eventLabel?: string;
  /**
   * Callback wenn der Nutzer das Löschen bestätigt
   */
  onConfirm: () => Promise<void>;
  /**
   * Callback um den Dialog zu schließen (bei Abbruch)
   */
  onCancel: () => void;
  /**
   * True, wenn die Lösch-Operation gerade läuft
   */
  isLoading?: boolean;
}

export function DeleteEventDialog({
  eventLabel,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteEventDialogProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <>
      {/* Overlay-Scrim: Hintergrund verdunkeln */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onCancel}
        role="presentation"
        aria-hidden="true"
      />

      {/* Dialog-Container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        onKeyDown={handleKeyDown}
      >
        {/* Dialog-Card */}
        <div className="bg-white rounded-lg shadow-xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
          {/* Header mit Warnsymbol */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h2
                  id="delete-dialog-title"
                  className="text-lg font-semibold text-text-primary"
                >
                  Termin löschen?
                </h2>
                <p
                  id="delete-dialog-description"
                  className="mt-2 text-sm text-text-secondary"
                >
                  Dieser wird endgültig gelöscht und kann nicht wiederhergestellt werden.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 p-6 pt-4 border-t border-border">
            <Button
              onClick={onCancel}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
              aria-label="Löschen abbrechen"
            >
              Abbrechen
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isLoading}
              variant="destructive"
              className="flex-1"
              aria-label="Termin endgültig löschen"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⌛</span>
                  Löschen...
                </>
              ) : (
                'Löschen'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
