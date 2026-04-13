import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createGoal, getGoals } from "@/lib/services/goal.service";
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

export async function GET(): Promise<NextResponse<ApiResponse<GoalWithProgress[]>>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  
  if (!user) {
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

  const result = await getGoals(user.id);
  return NextResponse.json(result, { status: getStatusCode(result.error?.code) });
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<GoalWithProgress>>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  try {
    const body = await request.json();
    const result = await createGoal({ ...body, user_id: user.id });

    return NextResponse.json(result, {
      status: getStatusCode(result.error?.code, 201),
    });
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
