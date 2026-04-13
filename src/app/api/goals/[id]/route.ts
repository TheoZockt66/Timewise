import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteGoal, updateGoal } from "@/lib/services/goal.service";
import type { ApiResponse, GoalWithProgress } from "@/types";

function getStatusCode(errorCode?: string, successStatus = 200): number {
  if (!errorCode) return successStatus;

  switch (errorCode) {
    case "UNAUTHORIZED":
      return 401;
    case "VALIDATION_ERROR":
    case "INVALID_KEYWORDS":
    case "KEYWORD_VALIDATION_FAILED":
      return 400;
    case "NOT_FOUND":
      return 404;
    default:
      return 500;
  }
}

function buildUnauthorizedResponse<T>() {
  return NextResponse.json(
    {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Nicht eingeloggt. Bitte melde dich an und versuche es erneut.",
      },
    },
    { status: 401 }
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<GoalWithProgress>>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildUnauthorizedResponse<GoalWithProgress>();
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const result = await updateGoal(id, user.id, body);

    return NextResponse.json(result, { status: getStatusCode(result.error?.code) });
  } catch {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INVALID_REQUEST",
          message: "Die Anfrage konnte nicht gelesen werden. Bitte prüfe deine Eingaben.",
        },
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildUnauthorizedResponse<{ success: boolean }>();
  }

  const { id } = await context.params;
  const result = await deleteGoal(id, user.id);

  return NextResponse.json(result, { status: getStatusCode(result.error?.code) });
}
