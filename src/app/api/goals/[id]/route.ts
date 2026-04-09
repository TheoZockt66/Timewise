import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateGoal, deleteGoal } from "@/lib/services/goal.service";

// ─── API-Endpunkte für einzelne Ziele ───

/**
 * Aktualisiert ein bestehendes Ziel (PUT /api/goals/:id).
 *
 * Body: Alle Felder optional (Partial Update)
 *
 * Ablauf:
 * 1. Auth-Check
 * 2. Body und ID auslesen
 * 3. Ziel über Service aktualisieren
 */
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;
  const body = await request.json();

  // Leere Strings bei optionalen Datumsfeldern als undefined behandeln
  const result = await updateGoal(id, {
    ...body,
    start_time: body.start_time || undefined,
    end_time: body.end_time || undefined,
  });

  return NextResponse.json(result);
}

/**
 * Löscht ein Ziel (DELETE /api/goals/:id).
 *
 * Ablauf:
 * 1. Auth-Check
 * 2. ID aus der URL extrahieren
 * 3. Ziel über Service löschen
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;
  const result = await deleteGoal(id);
  return NextResponse.json(result);
}
