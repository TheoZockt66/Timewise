"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Image from "next/image";
import type { GoalWithProgress, Keyword } from "@/types";

// ─── Hilfsfunktionen (nur für die Darstellung) ───

/**
 * Wandelt Minuten in eine lesbare Stundenanzeige um.
 * Beispiel: 90 → "1h 30m", 60 → "1h", 45 → "45m"
 */
function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Extrahiert die Stundenanzahl aus einem PostgreSQL INTERVAL ("20:00:00" → 20).
 */
function parseIntervalToHours(interval: string): number {
  return parseInt(interval.split(":")[0] || "0", 10);
}

/**
 * Konvertiert ein HTML-Datumseingabefeld ("YYYY-MM-DD") in ISO 8601.
 * Ein leerer String wird als undefined zurückgegeben (kein Datum gesetzt).
 */
function dateInputToISO(value: string): string | undefined {
  if (!value) return undefined;
  // new Date("YYYY-MM-DD") interpretiert als UTC-Mitternacht → ISO String korrekt
  return new Date(value).toISOString();
}

/**
 * Konvertiert ein ISO-Datum zurück in das HTML-Format "YYYY-MM-DD" für Datumseingaben.
 */
function isoToDateInput(iso?: string): string {
  if (!iso) return "";
  return iso.substring(0, 10);
}

export default function GoalsPage() {
  // Ziele-Liste für die Anzeige im UI
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);

  // Alle verfügbaren Keywords des Users (für die Keyword-Auswahl im Formular)
  const [availableKeywords, setAvailableKeywords] = useState<Keyword[]>([]);

  // ─── State für das "Neues Ziel erstellen"-Formular ───
  const [newLabel, setNewLabel] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTargetHours, setNewTargetHours] = useState(1);
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newKeywordIds, setNewKeywordIds] = useState<string[]>([]);

  // ─── State für den Bearbeiten-Modus ───
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTargetHours, setEditTargetHours] = useState(1);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editKeywordIds, setEditKeywordIds] = useState<string[]>([]);

  const { toast } = useToast();

  // Beim ersten Rendern: Ziele und Keywords parallel laden
  useEffect(() => {
    Promise.all([
      fetch("/api/goals").then((r) => r.json()),
      fetch("/api/keywords").then((r) => r.json()),
    ]).then(([goalsData, keywordsData]) => {
      setGoals(goalsData.data || []);
      setAvailableKeywords(keywordsData.data || []);
    });
  }, []);

  /**
   * Schaltet die Auswahl eines Keywords in einer Checkbox-Liste um.
   * Wenn das Keyword bereits ausgewählt ist, wird es entfernt — sonst hinzugefügt.
   */
  const toggleKeyword = (
    id: string,
    selected: string[],
    setSelected: (ids: string[]) => void
  ) => {
    setSelected(
      selected.includes(id) ? selected.filter((k) => k !== id) : [...selected, id]
    );
  };

  /**
   * Wechselt in den Bearbeitungsmodus und füllt alle Edit-States
   * mit den aktuellen Werten des Ziels vor.
   */
  const startEdit = (goal: GoalWithProgress) => {
    setEditingId(goal.id);
    setEditLabel(goal.label || "");
    setEditDescription(goal.description || "");
    setEditTargetHours(parseIntervalToHours(goal.target_study_time || "0:00:00"));
    setEditStartDate(isoToDateInput(goal.start_time));
    setEditEndDate(isoToDateInput(goal.end_time));
    setEditKeywordIds(goal.keywords.map((k) => k.id));
  };

  /**
   * Beendet den Bearbeitungsmodus und setzt alle Edit-States zurück.
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
    setEditDescription("");
    setEditTargetHours(1);
    setEditStartDate("");
    setEditEndDate("");
    setEditKeywordIds([]);
  };

  /**
   * Sendet ein neues Ziel an die API und aktualisiert die Liste.
   */
  const handleCreate = async () => {
    if (newTargetHours < 1) {
      toast({ title: "Fehler", description: "Zielzeit muss mindestens 1 Stunde betragen" });
      return;
    }

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newLabel || undefined,
        description: newDescription || undefined,
        // Stunden in PostgreSQL INTERVAL umwandeln: 20 → "20:00:00"
        target_study_time: `${newTargetHours}:00:00`,
        start_time: dateInputToISO(newStartDate),
        end_time: dateInputToISO(newEndDate),
        keyword_ids: newKeywordIds,
      }),
    });

    const result = await res.json();

    if (!result.error) {
      // Neue Ziele-Liste vom Backend laden (damit Fortschritt korrekt ist)
      const refreshed = await fetch("/api/goals").then((r) => r.json());
      setGoals(refreshed.data || []);

      toast({ title: "Erfolg", description: "Ziel erfolgreich erstellt", duration: 3000 });

      // Formular zurücksetzen
      setNewLabel("");
      setNewDescription("");
      setNewTargetHours(1);
      setNewStartDate("");
      setNewEndDate("");
      setNewKeywordIds([]);
    } else {
      toast({ title: "Fehler", description: result.error.message });
    }
  };

  /**
   * Sendet die aktualisierten Daten eines Ziels an die API.
   */
  const handleUpdate = async (id: string) => {
    const res = await fetch(`/api/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: editLabel || undefined,
        description: editDescription || undefined,
        target_study_time: `${editTargetHours}:00:00`,
        start_time: editStartDate,
        end_time: editEndDate,
        keyword_ids: editKeywordIds,
      }),
    });

    const result = await res.json();

    if (!result.error) {
      // Nur das betroffene Ziel im State ersetzen (kein kompletter Reload nötig)
      setGoals((prev) => prev.map((g) => (g.id === id ? result.data : g)));
      cancelEdit();
      toast({ title: "Erfolg", description: "Ziel gespeichert" });
    } else {
      toast({ title: "Fehler", description: result.error.message });
    }
  };

  /**
   * Löscht ein Ziel und entfernt es direkt aus dem lokalen State.
   */
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    const result = await res.json();

    if (!result.error) {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      toast({ title: "Erfolg", description: "Ziel gelöscht" });
    } else {
      toast({ title: "Fehler", description: "Ziel konnte nicht gelöscht werden" });
    }
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Logo — Navigation zur Startseite */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="inline-block">
            <Image
              src="/timewise-logo.svg"
              alt="Timewise Logo"
              width={56}
              height={56}
              className="h-14 w-auto"
              priority
              style={{ width: "auto" }}
            />
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meine Ziele</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Definiere Lernziele, weise Keywords zu und verfolge deinen Fortschritt automatisch.
          </p>
        </div>

        {/* ─── Karte: Neues Ziel erstellen ─── */}
        <Card>
          <CardHeader>
            <CardTitle>Neues Ziel erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Erste Zeile: Bezeichnung und Zielstunden */}
              <div className="flex flex-col gap-3 md:flex-row">
                <Input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Bezeichnung (optional)"
                  className="md:flex-1"
                />
                <div className="flex items-center gap-2 md:w-48">
                  <Input
                    type="number"
                    min={1}
                    value={newTargetHours}
                    onChange={(e) => setNewTargetHours(parseInt(e.target.value) || 1)}
                    className="w-full"
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Stunden</span>
                </div>
              </div>

              {/* Zweite Zeile: Beschreibung */}
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Beschreibung (optional)"
              />

              {/* Dritte Zeile: Zeitraum */}
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="flex flex-col gap-1 md:flex-1">
                  <label className="text-xs text-muted-foreground">Startdatum (optional)</label>
                  <Input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1 md:flex-1">
                  <label className="text-xs text-muted-foreground">Enddatum (optional)</label>
                  <Input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Keywords-Auswahl */}
              {availableKeywords.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">Keywords (optional)</span>
                  <div className="flex flex-wrap gap-2">
                    {availableKeywords.map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => toggleKeyword(k.id, newKeywordIds, setNewKeywordIds)}
                        className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
                          newKeywordIds.includes(k.id)
                            ? "border-transparent text-white"
                            : "border-border bg-background text-foreground hover:bg-muted"
                        }`}
                        // Ausgewählte Keywords bekommen die eigene Keyword-Farbe als Hintergrund
                        style={newKeywordIds.includes(k.id) ? { backgroundColor: k.color } : {}}
                      >
                        <span
                          className="h-2 w-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: newKeywordIds.includes(k.id) ? "white" : k.color }}
                        />
                        {k.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleCreate}
                className="min-h-11 md:self-start"
                disabled={newTargetHours < 1}
              >
                Hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Karte: Vorhandene Ziele ─── */}
        <Card>
          <CardHeader>
            <CardTitle>Meine Ziele</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Ziele vorhanden</p>
            ) : (
              goals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-lg border bg-background p-4 flex flex-col gap-3"
                >
                  {editingId === goal.id ? (
                    // ─── Edit-Modus: Formular mit bestehenden Werten ───
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 md:flex-row">
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          placeholder="Bezeichnung (optional)"
                          className="md:flex-1"
                        />
                        <div className="flex items-center gap-2 md:w-48">
                          <Input
                            type="number"
                            min={1}
                            value={editTargetHours}
                            onChange={(e) => setEditTargetHours(parseInt(e.target.value) || 1)}
                            className="w-full"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">Stunden</span>
                        </div>
                      </div>

                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Beschreibung (optional)"
                      />

                      <div className="flex flex-col gap-3 md:flex-row">
                        <div className="flex flex-col gap-1 md:flex-1">
                          <label className="text-xs text-muted-foreground">Startdatum (optional)</label>
                          <Input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1 md:flex-1">
                          <label className="text-xs text-muted-foreground">Enddatum (optional)</label>
                          <Input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                          />
                        </div>
                      </div>

                      {availableKeywords.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-muted-foreground">Keywords</span>
                          <div className="flex flex-wrap gap-2">
                            {availableKeywords.map((k) => (
                              <button
                                key={k.id}
                                type="button"
                                onClick={() => toggleKeyword(k.id, editKeywordIds, setEditKeywordIds)}
                                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
                                  editKeywordIds.includes(k.id)
                                    ? "border-transparent text-white"
                                    : "border-border bg-background text-foreground hover:bg-muted"
                                }`}
                                style={editKeywordIds.includes(k.id) ? { backgroundColor: k.color } : {}}
                              >
                                <span
                                  className="h-2 w-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: editKeywordIds.includes(k.id) ? "white" : k.color }}
                                />
                                {k.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => handleUpdate(goal.id)} className="min-h-11">
                          Speichern
                        </Button>
                        <Button variant="outline" onClick={cancelEdit} className="min-h-11">
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // ─── Anzeige-Modus: Ziel mit Fortschrittsanzeige ───
                    <>
                      {/* Titelzeile: Bezeichnung + Ziel-erreicht-Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Farbpunkt des ersten Keywords als visueller Anker */}
                          {goal.keywords.length > 0 && (
                            <span
                              className="h-3 w-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: goal.keywords[0].color }}
                            />
                          )}
                          <span className="text-base font-semibold truncate">
                            {goal.label || "Unbenanntes Ziel"}
                          </span>
                        </div>

                        {goal.is_achieved && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 whitespace-nowrap">
                            Ziel erreicht
                          </span>
                        )}
                      </div>

                      {/* Beschreibung (wenn vorhanden) */}
                      {goal.description && (
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      )}

                      {/* Keywords als farbige Badges */}
                      {goal.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {goal.keywords.map((k) => (
                            <span
                              key={k.id}
                              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                              style={{ backgroundColor: k.color }}
                            >
                              {k.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Fortschrittsbalken */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {formatMinutes(goal.logged_minutes)} von{" "}
                            {formatMinutes(goal.target_minutes)}
                          </span>
                          <span className="font-medium">{goal.percentage}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            // Balken bei 100% kappen — Überschreitung wird im Badge angezeigt
                            style={{ width: `${Math.min(100, goal.percentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Metadaten: Zeitraum und verbleibende Tage */}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {goal.start_time && (
                          <span>
                            ab {new Date(goal.start_time).toLocaleDateString("de-DE")}
                          </span>
                        )}
                        {goal.end_time && (
                          <span>
                            bis {new Date(goal.end_time).toLocaleDateString("de-DE")}
                          </span>
                        )}
                        {goal.days_remaining > 0 && !goal.is_achieved && (
                          <span>{goal.days_remaining} Tage verbleibend</span>
                        )}
                      </div>

                      {/* Aktionsbuttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => startEdit(goal)}
                          className="min-h-11"
                        >
                          Bearbeiten
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(goal.id)}
                          className="min-h-11"
                        >
                          Löschen
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
