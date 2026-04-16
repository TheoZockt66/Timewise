"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import type { Keyword } from "@/types";

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
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-block">
            <Image
              src="/timewise-logo.svg"
              alt="Timewise Logo"
              width={216}
              height={56}
              className="h-14 w-[216px] object-contain"
              priority
            />
          </Link>
        </div>
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
                  setNewLabel(value);

                  // Live-Validierung: Länge prüfen
                  if (value.trim().length > 50) {
                    setCreateError("Label darf maximal 50 Zeichen lang sein");
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
                  onChange={(e) => setNewColor(e.target.value)}
                  className="h-11 w-11 cursor-pointer rounded border bg-background p-1"
                />
              </div>

              <Button
                onClick={handleCreate}
                className="min-h-11"
                disabled={!newLabel.trim() || newLabel.trim().length > 50}
              >
                Hinzufügen
              </Button>
            </div>

            {createError && (
              <p className="mt-2 text-sm text-red-500">{createError}</p>
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

                  <div className="flex flex-wrap gap-2">
                    {editingId === k.id ? (
                      <>
                        <Input
                          value={editLabel}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditLabel(value);

                            // Live-Validierung: Länge prüfen
                            if (value.trim().length > 50) {
                              setEditError("Label darf maximal 50 Zeichen lang sein");
                            } else {
                              setEditError("");
                            }
                          }}
                          className="w-full md:w-56"
                        />

                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="h-11 w-11 cursor-pointer rounded border bg-background p-1"
                        />

                        <Button
                          onClick={() => handleUpdate(k.id)}
                          className="min-h-11"
                          disabled={!editLabel.trim() || editLabel.trim().length > 50}
                        >
                          Speichern
                        </Button>

                        <Button
                          variant="outline"
                          onClick={resetEditState}
                          className="min-h-11"
                        >
                          Abbrechen
                        </Button>

                        {editError && (
                          <p className="w-full text-sm text-red-500">{editError}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
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
        </Card>
      </div>
    </main>
  );
}
