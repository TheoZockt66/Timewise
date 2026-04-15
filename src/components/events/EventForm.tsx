"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeRangePicker } from "@/components/events/TimeRangePicker";
import { KeywordSelector } from "@/components/events/KeywordSelector";
import { useToast } from "@/hooks/use-toast";
import { validateEvent, type ValidationError } from "@/lib/validators/event.validator";
import {
  createEvent,
  updateEvent,
  fetchEvents,
  type CreateEventRequest,
} from "@/lib/services/event.service";
import type {
  Event,
  EventWithKeywords,
  Keyword,
} from "@/types";

/**
 * ─── EVENT FORM ───
 * 
 * Zentrale Komponente für Lernzeiterfassung (M3).
 * 
 * Features:
 * - Erstellen und Bearbeiten von Events
 * - Live-Validierung
 * - Overlap-Check gegen DB
 * - Barrierefreiheit (WCAG 2.1)
 * - Responsive Design
 * 
 * Props:
 * - initialEvent: Optional — wenn vorhanden, Edit-Modus
 * - onSuccess: Callback nach erfolgreichem Speichern
 * - onCancel: Callback zum Abbrechen
 */

export interface EventFormProps {
  initialEvent?: EventWithKeywords;
  selectedRange?: { start: string; end: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Interne Form-State (Typ-safe, strukturiert)
interface FormState {
  start_time: string;
  end_time: string;
  keyword_ids: string[];
  label: string;
  description: string;
}

// Error-Map: field → error message
type ErrorMap = Map<string, string>;

export function EventForm({
  initialEvent,
  selectedRange,
  onSuccess,
  onCancel,
}: EventFormProps) {
  // ─── STATE MANAGEMENT ───

  // Form-Daten (initialisiert aus initialEvent bei Edit)
  const [formData, setFormData] = useState<FormState>({
    start_time: initialEvent?.start_time || selectedRange?.start || "",
    end_time: initialEvent?.end_time || selectedRange?.end || "",
    keyword_ids: initialEvent?.keywords?.map((k) => k.id) || [],
    label: initialEvent?.label || "",
    description: initialEvent?.description || "",
  });

  // UI-States
  const [isLoading, setIsLoading] = useState(false);
  const [isKeywordsLoading, setIsKeywordsLoading] = useState(true);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [errors, setErrors] = useState<ErrorMap>(new Map());

  const { toast } = useToast();

  // ─── EFFEKT: Keywords beim Mount laden ───

  useEffect(() => {
    const loadKeywords = async () => {
      setIsKeywordsLoading(true);
      try {
        const responseKW = await fetch("/api/keywords");
        const response = await responseKW.json();

        if (response.error) {
          toast({
            title: "Fehler",
            description: "Tags konnten nicht geladen werden.",
            variant: "destructive",
          });
          setKeywords([]);
        } else {
          setKeywords(response.data || []);
        }
      } catch {
        toast({
          title: "Fehler",
          description: "Tags konnten nicht geladen werden.",
          variant: "destructive",
        });
        setKeywords([]);
      }

      setIsKeywordsLoading(false);
    };

    loadKeywords();
  }, [toast]);

  // Synchronisiere markierten Kalenderbereich, wenn kein Event bearbeitet wird
  useEffect(() => {
    if (!initialEvent && selectedRange?.start && selectedRange?.end) {
      setFormData((prev) => ({
        ...prev,
        start_time: prev.start_time || selectedRange.start,
        end_time: prev.end_time || selectedRange.end,
      }));
    }
  }, [initialEvent, selectedRange]);

  // ─── HANDLERS: Feld-Eingabe mit Live-Validierung ───

  const handleFieldChange = useCallback(
    (field: keyof FormState, value: string | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // ─── VALIDIERUNG: Master-Funktion vor Submit ───

  const validateForm = async (): Promise<ErrorMap> => {
    const newErrors: ErrorMap = new Map();

    // Hole bestehende Events für Overlap-Check
    const eventsResponse = await fetchEvents({
      start_date: formData.start_time.split("T")[0],
      end_date: formData.end_time.split("T")[0],
    });

    const existingEvents: Event[] = eventsResponse.data || [];

    // Führe alle Validierungen durch
    const validationResult = validateEvent({
      startTime: formData.start_time,
      endTime: formData.end_time,
      keywordIds: formData.keyword_ids,
      existingEvents: existingEvents,
      excludeEventId: initialEvent?.id, // Bei Edit: das aktuelle Event ausschließen
    });

    // Sammle Fehlercodes in Map
    validationResult.errors.forEach((error) => {
      newErrors.set(error.code, error.message);
    });

    setErrors(newErrors);
    return newErrors;
  };

  // ─── SUBMIT: Event erstellen oder aktualisieren ───

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return; // Prevent double-submit

    // Validiere gesamtes Formular
    const errors = await validateForm();
    if (errors.size > 0) {
      toast({
        title: "Validierungsfehler",
        description: `Bitte überprüfen Sie die angezeigten Fehler:\n${Array.from(errors.values()).join("\n")}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Bereite Request-Daten vor
      const requestData: CreateEventRequest = {
        start_time: formData.start_time,
        end_time: formData.end_time,
        keyword_ids: formData.keyword_ids,
        label: formData.label || undefined,
        description: formData.description || undefined,
      };

      // Unterscheide zwischen Create und Update
      const response = initialEvent
        ? await updateEvent(initialEvent.id, requestData)
        : await createEvent(requestData);

      // Fehlerbehandlung
      if (response.error) {
        toast({
          title: "Speicherfehler",
          description: response.error.message || "Unbekannter Fehler",
          variant: "destructive",
        });
        return;
      }

      // Success: Toast + Reset + Callback
      toast({
        title: "Erfolg",
        description: initialEvent
          ? "Lernzeit aktualisiert."
          : "Lernzeit erfasst.",
        variant: "default",
      });

      // Reset Form
      setFormData({
        start_time: "",
        end_time: "",
        keyword_ids: [],
        label: "",
        description: "",
      });
      setErrors(new Map());

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ─── RENDER ───

  const errorObj = Object.fromEntries(errors);

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-full space-y-6 p-6 bg-background rounded-lg border border-border"
    >
      {/* Titel */}
      <h2 className="text-2xl font-bold text-text-primary">
        {initialEvent ? "Lernzeit bearbeiten" : "Lernzeit erfassen"}
      </h2>

      {/* Zeitbereich-Picker */}
      <TimeRangePicker
        startTime={formData.start_time}
        endTime={formData.end_time}
        onStartChange={(v) => handleFieldChange("start_time", v)}
        onEndChange={(v) => handleFieldChange("end_time", v)}
        error={
          errorObj.INVALID_TIME_RANGE ||
          errorObj.FUTURE_NOT_ALLOWED ||
          errorObj.OVERLAP
        }
      />

      {/* Keyword-Selector */}
      <KeywordSelector
        keywords={keywords}
        selectedIds={formData.keyword_ids}
        onSelectionChange={(ids) => handleFieldChange("keyword_ids", ids)}
        error={errorObj.KEYWORD_REQUIRED}
        isLoading={isKeywordsLoading}
      />

      {/* Label (optional) */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="event-label"
          className="text-base font-medium text-text-primary"
        >
          Titel (optional)
        </Label>
        <Input
          id="event-label"
          type="text"
          placeholder="z.B. Mathehausaufgaben"
          value={formData.label}
          onChange={(e) => handleFieldChange("label", e.target.value)}
          maxLength={100}
          className="h-11 text-base"
        />
      </div>

      {/* Beschreibung (optional) */}
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="event-desc"
          className="text-base font-medium text-text-primary"
        >
          Notizen (optional)
        </Label>
        <textarea
          id="event-desc"
          placeholder="z.B. Kapitel 3-5 durchgearbeitet"
          value={formData.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          maxLength={500}
          rows={3}
          className="p-3 text-base border border-border rounded-lg font-sans focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <p className="text-xs text-text-secondary">
          {formData.description.length} / 500 Zeichen
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || isKeywordsLoading}
          className="h-11 px-6 text-base font-medium"
        >
          {isLoading
            ? "Speichert..."
            : initialEvent
              ? "Aktualisieren"
              : "Speichern"}
        </Button>

        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            variant="outline"
            className="h-11 px-6 text-base font-medium"
          >
            Abbrechen
          </Button>
        )}
      </div>

      {/* Hilfreiche Tipps */}
      <div className="p-4 bg-info/10 border border-info/30 rounded text-info text-sm space-y-2">
        <p className="font-semibold">💡 Tipps:</p>
        <ul className="list-disc list-inside space-y-1 text-xs md:text-sm">
          <li>Erfasse Lernzeiten zeitnah nach dem Lernen.</li>
          <li>Mehrere Tags pro Eintrag sind möglich.</li>
          <li>Überschneidungen werden automatisch erkannt.</li>
        </ul>
      </div>
    </form>
  );
}
