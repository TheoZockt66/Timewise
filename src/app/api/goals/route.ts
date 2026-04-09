import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGoal, getGoals } from "@/lib/services/goal.service";

// ─── API-Endpunkte für Ziele (Goals) ───

/**
 * Gibt alle Ziele des aktuellen Benutzers zurück (GET /api/goals).
 *
 * Ablauf:
 * 1. Aktuellen Benutzer über Supabase Auth ermitteln
 * 2. Alle Ziele mit Fortschrittsdaten laden
 * 3. Ergebnis zurückgeben
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Kein User → keine Daten, aber kein Fehler (UI soll nicht crashen)
  if (!user) {
    return NextResponse.json({ data: [], error: null });
  }

  const result = await getGoals(user.id);
  return NextResponse.json(result);
}

/**
 * Erstellt ein neues Ziel (POST /api/goals).
 *
 * Body: { target_study_time, start_time?, end_time?, label?, description?, keyword_ids? }
 *
 * Ablauf:
 * 1. Aktuellen Benutzer über Supabase Auth ermitteln
 * 2. Ziel über den Service erstellen
 * 3. Angereichertes GoalWithProgress zurückgeben
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      data: null,
      error: { code: "UNAUTHORIZED", message: "Nicht eingeloggt" },
    });
  }

  const body = await request.json();

  // user_id wird serverseitig gesetzt — das Frontend darf sie nicht selbst bestimmen
  const result = await createGoal({ ...body, user_id: user.id });
  return NextResponse.json(result);
}
