"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import HeaderWithBack from "@/components/layout/HeaderWithBack";
import type { Keyword } from "@/types";

const isColorTooLight = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 200;
};

export default function KeywordsPage() {
  // State für alle Keywords (Anzeige im UI)
  const [keywords, setKeywords] = useState<Keyword[]>([]);

  // State für Bearbeiten-Modus eines Keywords
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");

  // State für Fehlermeldungen beim Bearbeiten eines Keywords
  const [editError, setEditError] = useState("");

  // State für neues Keyword
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#000000");

  // State für Fehlermeldungen beim Erstellen eines Keywords
  const [createError, setCreateError] = useState("");

  const { toast } = useToast();

  const [createColorError, setCreateColorError] = useState("");
  const [editColorError, setEditColorError] = useState("");

  /**
 * Setzt den Bearbeitungsmodus zurück.
 *
 * Ziel:
 * - verlässt den Edit-Modus
 * - leert Eingabefelder
 * - entfernt Fehlermeldungen
 */
  const resetEditState = () => {
    setEditingId(null);
    setEditLabel("");
    setEditColor("");
    setEditError("");
    setEditColorError("");
  };

  // Lädt beim ersten Rendern alle Keywords vom Backend
  useEffect(() => {
    fetch("/api/keywords")
      .then((res) => res.json())
      .then((data) => setKeywords(data.data || []));
  }, []);

  // Erstellt ein neues Keyword und lädt danach die Liste neu
  const handleCreate = async () => {
    // Fehlermeldung zurücksetzen, bevor ein neuer Versuch startet
    setCreateError("");
    setCreateColorError("");

    // verhindert leere Eingaben
    if (!newLabel.trim()) {
      setCreateError("Bitte gib einen Namen ein.");
      return;
    }

    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        label: newLabel,
        color: newColor,
      }),
    });

    const result = await res.json();

    // Fehler aus dem Backend direkt im UI anzeigen
    if (!res.ok || result.error) {
      setCreateError(result.error?.message ?? "Keyword konnte nicht erstellt werden.");
      return;
    }

    // nach Erstellung: Liste neu laden (synchron mit Backend)
    const refreshed = await fetch("/api/keywords");
    const refreshedData = await refreshed.json();

    setKeywords(refreshedData.data || []);

    toast({
      title: "Erfolg",
      description: "Keyword erfolgreich erstellt",
      duration: 3000,
    });

    // Eingabefelder zurücksetzen
    setNewLabel("");
    setNewColor("#000000");
  };

  // Löscht ein Keyword und entfernt es direkt aus dem lokalen State
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/keywords/${id}`, {
      method: "DELETE",
    });

    const result = await res.json();

    if (!result.error) {
      // UI sofort aktualisieren (ohne kompletten Reload)
      setKeywords((prev) => prev.filter((k) => k.id !== id));

      toast({
        title: "Erfolg",
        description: "Keyword gelöscht",
      });
    } else {
      toast({
        title: "Fehler",
        description: "Keyword konnte nicht gelöscht werden",
      });
    }
  };

  // Aktualisiert ein Keyword und passt den lokalen State entsprechend an
  const handleUpdate = async (id: string) => {
    // Fehlermeldung zurücksetzen, bevor ein neuer Versuch startet
    setEditError("");
    setEditColorError("");

    // verhindert leere Eingaben
    if (!editLabel.trim()) {
      setEditError("Bitte gib einen Namen ein.");
      return;
    }

    const res = await fetch(`/api/keywords/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        label: editLabel.trim(),
        color: editColor,
      }),
    });

    const result = await res.json();

    // Fehler aus dem Backend direkt im UI anzeigen
    if (!res.ok || result.error) {
      setEditError(result.error?.message ?? "Keyword konnte nicht gespeichert werden.");
      return;
    }

    // nur das betroffene Keyword im State aktualisieren
    setKeywords((prev) =>
      prev.map((k) =>
        k.id === id
          ? { ...k, label: editLabel.trim(), color: editColor }
          : k
      )
    );

    resetEditState();

    toast({
      title: "Erfolg",
      description: "Keyword gespeichert",
    });
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Logo dient als Navigation zurück zur Startseite */}
        <HeaderWithBack />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meine Keywords</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lege eigene Keywords an, vergib Farben und halte deine Lernzeiten strukturiert.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Neues Keyword erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                value={newLabel}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value.length <= 50) {
                    setNewLabel(value);
                  }

                  if (value.length >= 50) {
                    setCreateError("Maximale Länge erreicht (50 Zeichen)");
                  } else {
                    setCreateError("");
                  }
                }}
                placeholder="Neues Keyword"
                className="md:flex-1"
              />

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => {
                    const color = e.target.value;
                    setNewColor(color);

                    if (isColorTooLight(color)) {
                      setCreateColorError("Farbe zu hell – möglicherweise schlecht sichtbar");
                    } else {
                      setCreateColorError("");
                    }
                  }}
                  className="h-11 w-11 cursor-pointer rounded border bg-background p-1"
                />
              </div>

              <Button
                onClick={handleCreate}
                className="min-h-11"
                disabled={!newLabel.trim()}
              >
                Hinzufügen
              </Button>
            </div>

            {(createError || createColorError) && (
              <p className="mt-2 text-sm text-red-500">
                {createError || createColorError}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vorhandene Keywords</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {keywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Keywords vorhanden
              </p>
            ) : (
              keywords.map((k) => (
                <div
                  key={k.id}
                  className="flex flex-col gap-3 rounded-lg border bg-background p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: k.color }}
                    />
                    <span className="text-base font-medium">{k.label}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {editingId === k.id ? (
                      <div className="flex flex-col gap-1 w-full">

                        {/* OBERE ZEILE */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input
                              value={editLabel}
                              onChange={(e) => {
                                const value = e.target.value;

                                if (value.length <= 50) {
                                  setEditLabel(value);
                                }

                                if (value.length >= 50) {
                                  setEditError("Maximale Länge erreicht (50 Zeichen)");
                                } else {
                                  setEditError("");
                                }
                              }}
                              className="w-full"
                            />
                          </div>

                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => {
                              const color = e.target.value;
                              setEditColor(color);

                              if (isColorTooLight(color)) {
                                setEditColorError("Farbe zu hell – möglicherweise schlecht sichtbar");
                              } else {
                                setEditColorError("");
                              }
                            }}
                            className="h-11 w-11 cursor-pointer rounded border bg-background p-1"
                          />

                          <Button
                            onClick={() => handleUpdate(k.id)}
                            className="min-h-11"
                            disabled={!editLabel.trim()}
                          >
                            Speichern
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={resetEditState}
                            className="min-h-11"
                          >
                            Abbrechen
                          </Button>
                        </div>

                        {/* FEHLER UNTEN */}
                        {(editError || editColorError) && (
                          <p className="text-sm text-red-500">
                            {editError || editColorError}
                          </p>
                        )}

                      </div>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={
                            () => {
                              setEditingId(k.id);
                              setEditLabel(k.label);
                              setEditColor(k.color);
                              setEditError("");
                            }}
                          className="min-h-11"
                        >
                          Bearbeiten
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(k.id)}
                          className="min-h-11"
                        >
                          Löschen
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card >
      </div >
    </main >
  );
}
