import { createClient } from "@/lib/supabase/server";
import { validateGoal } from "@/lib/validators/goal.validator";
import type { Goal, Keyword, GoalWithProgress } from "@/types";

// ─── Hilfsfunktionen ───

/**
 * Wandelt ein PostgreSQL INTERVAL ("HH:MM:SS") in Minuten um.
 * Beispiel: "20:30:00" → 1230
 */
function parseIntervalToMinutes(interval: string): number {
  const parts = interval.split(":");
  const hours = parseInt(parts[0] || "0", 10);
  const minutes = parseInt(parts[1] || "0", 10);
  return hours * 60 + minutes;
}

/**
 * Berechnet die verbleibenden Tage bis zum Enddatum (ab heute).
 * Gibt 0 zurück, wenn kein Enddatum gesetzt oder das Datum in der Vergangenheit liegt.
 */
function calcDaysRemaining(endTime?: string): number {
  if (!endTime) return 0;
  const diff = new Date(endTime).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Baut ein vollständiges GoalWithProgress-Objekt aus den Rohdaten zusammen.
 * Kapselt die Fortschrittsberechnung an einem einzigen Ort (DRY).
 */
function buildGoalWithProgress(
  goal: Goal,
  keywords: Keyword[],
  loggedMinutes: number,
  targetMinutes: number
): GoalWithProgress {
  // Prozentsatz: 0 wenn kein Ziel gesetzt, sonst gerundet
  const percentage = targetMinutes > 0
    ? Math.round((loggedMinutes / targetMinutes) * 100)
    : 0;

  return {
    ...goal,
    keywords,
    logged_minutes: loggedMinutes,
    target_minutes: targetMinutes,
    percentage,
    is_achieved: percentage >= 100,
    remaining_minutes: Math.max(0, targetMinutes - loggedMinutes),
    days_remaining: calcDaysRemaining(goal.end_time),
  };
}

/**
 * Lädt alle Keywords für ein bestimmtes Ziel aus der goal_keywords-Verknüpfungstabelle.
 */
async function fetchKeywordsForGoal(
  goalId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Keyword[]> {
  const { data } = await supabase
    .from("goal_keywords")
    .select("keywords(*)")
    .eq("goal_id", goalId);

  // Supabase gibt { keywords: {...} }[] zurück — wir extrahieren nur die Keyword-Objekte
  return (data || []).map((row: { keywords: Keyword }) => row.keywords);
}

/**
 * Berechnet die geleisteten Lernminuten für ein Ziel.
 *
 * Ablauf:
 * 1. Event-IDs mit passenden Keywords ermitteln (über event_keywords)
 * 2. Diese Events im Zielzeitraum laden
 * 3. Dauer aller Events summieren
 *
 * Zweistufige Abfrage statt JOIN — zuverlässiger mit dem Supabase JS-Client.
 */
async function calcLoggedMinutes(
  goal: Goal,
  keywordIds: string[],
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  if (keywordIds.length === 0) return 0;

  // Schritt 1: Event-IDs finden, die mindestens einem Ziel-Keyword zugeordnet sind
  const { data: ekRows } = await supabase
    .from("event_keywords")
    .select("event_id")
    .in("keyword_id", keywordIds);

  // Deduplizieren: Ein Event mit mehreren passenden Keywords würde sonst mehrfach auftauchen
  const eventIds = [...new Set((ekRows || []).map((r: { event_id: string }) => r.event_id))];
  if (eventIds.length === 0) return 0;

  // Schritt 2: Events des Users im Zielzeitraum laden
  let query = supabase
    .from("events")
    .select("start_time, end_time")
    .eq("user_id", userId)
    .in("id", eventIds);

  // Zeitbereich nur anwenden, wenn im Ziel gesetzt (beide Felder sind nullable)
  if (goal.start_time) query = query.gte("start_time", goal.start_time);
  if (goal.end_time) query = query.lte("start_time", goal.end_time);

  const { data: events } = await query;

  // Schritt 3: Dauer jedes Events in Minuten berechnen und summieren
  return (events || []).reduce((sum: number, e: { start_time: string; end_time: string }) => {
    const durationMs = new Date(e.end_time).getTime() - new Date(e.start_time).getTime();
    return sum + Math.floor(durationMs / 60000);
  }, 0);
}

/**
 * Lädt Keywords und berechnet den Fortschritt für ein einzelnes Ziel.
 * Wird von getGoals, createGoal und updateGoal nach DB-Operationen aufgerufen.
 */
async function enrichGoalWithProgress(
  goal: Goal,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<GoalWithProgress> {
  const keywords = await fetchKeywordsForGoal(goal.id, supabase);
  const targetMinutes = parseIntervalToMinutes(goal.target_study_time || "0:00:00");
  const keywordIds = keywords.map((k) => k.id);
  const loggedMinutes = await calcLoggedMinutes(goal, keywordIds, userId, supabase);
  return buildGoalWithProgress(goal, keywords, loggedMinutes, targetMinutes);
}

/**
 * Erstellt die Einträge in der goal_keywords-Verknüpfungstabelle.
 */
async function insertGoalKeywords(
  goalId: string,
  keywordIds: string[],
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  if (keywordIds.length === 0) return;
  await supabase
    .from("goal_keywords")
    .insert(keywordIds.map((kid) => ({ goal_id: goalId, keyword_id: kid })));
}

// ─── Service-Funktionen ───

/**
 * Gibt alle Ziele eines Users zurück, angereichert mit Fortschrittsdaten.
 */
export async function getGoals(userId: string) {
  const supabase = await createClient();

  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { code: "FETCH_FAILED", message: "Ziele konnten nicht geladen werden.", details: error.message },
    };
  }

  // Fortschritt für alle Ziele parallel berechnen (Performance)
  const enriched = await Promise.all(
    (goals || []).map((goal: Goal) => enrichGoalWithProgress(goal, userId, supabase))
  );

  return { data: enriched, error: null };
}

/**
 * Erstellt ein neues Ziel mit optionalen Keyword-Zuordnungen.
 */
export async function createGoal(data: {
  label?: string;
  description?: string;
  target_study_time?: string;
  start_time?: string;
  end_time?: string;
  keyword_ids?: string[];
  user_id: string;
}) {
  // Eingaben validieren bevor sie in die DB geschrieben werden
  const validation = validateGoal(data);
  if (!validation.valid) {
    return { data: null, error: { code: "VALIDATION_ERROR", message: validation.error! } };
  }

  const supabase = await createClient();

  const { data: newGoal, error } = await supabase
    .from("goals")
    .insert({
      label: data.label,
      description: data.description,
      target_study_time: data.target_study_time,
      start_time: data.start_time,
      end_time: data.end_time,
      user_id: data.user_id,
    })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { code: "CREATE_FAILED", message: "Ziel konnte nicht erstellt werden.", details: error.message },
    };
  }

  // Keywords verknüpfen
  await insertGoalKeywords(newGoal.id, data.keyword_ids || [], supabase);

  // Fortschritt berechnen und angereichertes Objekt zurückgeben
  const enriched = await enrichGoalWithProgress(newGoal, data.user_id, supabase);
  return { data: enriched, error: null };
}

/**
 * Aktualisiert ein bestehendes Ziel (Partial Update).
 * Keyword-Zuordnungen werden komplett neu gesetzt, wenn keyword_ids mitgegeben wird.
 */
export async function updateGoal(
  id: string,
  data: {
    label?: string;
    description?: string;
    target_study_time?: string;
    start_time?: string;
    end_time?: string;
    keyword_ids?: string[];
  }
) {
  const validation = validateGoal(data);
  if (!validation.valid) {
    return { data: null, error: { code: "VALIDATION_ERROR", message: validation.error! } };
  }

  const supabase = await createClient();

  // Nur gesetzte Felder werden überschrieben (Partial Update)
  const updateData: Partial<Goal> = {};
  if (data.label !== undefined) updateData.label = data.label;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.target_study_time !== undefined) updateData.target_study_time = data.target_study_time;
  if (data.start_time !== undefined) updateData.start_time = data.start_time;
  if (data.end_time !== undefined) updateData.end_time = data.end_time;

  const { data: updated, error } = await supabase
    .from("goals")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { code: "UPDATE_FAILED", message: "Ziel konnte nicht aktualisiert werden.", details: error.message },
    };
  }

  // Keyword-Zuordnungen neu setzen: alte löschen, neue einfügen
  if (data.keyword_ids !== undefined) {
    await supabase.from("goal_keywords").delete().eq("goal_id", id);
    await insertGoalKeywords(id, data.keyword_ids, supabase);
  }

  const enriched = await enrichGoalWithProgress(updated, updated.user_id, supabase);
  return { data: enriched, error: null };
}

/**
 * Löscht ein Ziel. ON DELETE CASCADE entfernt zugehörige goal_keywords automatisch.
 */
export async function deleteGoal(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("goals").delete().eq("id", id);

  if (error) {
    return {
      data: null,
      error: { code: "DELETE_FAILED", message: "Ziel konnte nicht gelöscht werden.", details: error.message },
    };
  }

  return { data: null, error: null };
}
