import { createClient } from "@/lib/supabase/server";
import { validateGoal } from "@/lib/validators/goal.validator";
import type { ApiError, ApiResponse, Goal, GoalWithProgress, Keyword } from "@/types";

type GoalMutationInput = {
  label?: string | null;
  description?: string | null;
  target_study_time?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  keyword_ids?: string[];
};

type GoalWritePayload = {
  label?: string | null;
  description?: string | null;
  target_study_time?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  user_id?: string;
};

type GoalKeywordJoinRow = {
  keywords: Keyword | Keyword[] | null;
};

type GoalServiceFailure = ApiError;

function createFailure(code: string, message: string, details?: string): GoalServiceFailure {
  return { code, message, details };
}

function toFailure(
  error: unknown,
  fallbackCode: string,
  fallbackMessage: string
): GoalServiceFailure {
  if (error && typeof error === "object" && "code" in error && "message" in error) {
    const failure = error as GoalServiceFailure;
    return {
      code: failure.code,
      message: failure.message,
      details: failure.details,
    };
  }

  return createFailure(
    fallbackCode,
    fallbackMessage,
    error instanceof Error ? error.message : undefined
  );
}

function normalizeOptionalText(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeKeywordIds(keywordIds?: string[]): string[] | undefined {
  if (keywordIds === undefined) return undefined;
  return [...new Set(keywordIds.filter(Boolean))];
}

function parseIntervalToMinutes(interval: string): number {
  const [hours = "0", minutes = "0"] = interval.split(":");
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
}

function calcDaysRemaining(endTime?: string | null): number {
  if (!endTime) return 0;

  const endDate = new Date(endTime);
  endDate.setUTCHours(23, 59, 59, 999);

  const diff = endDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function buildGoalWithProgress(
  goal: Goal,
  keywords: Keyword[],
  loggedMinutes: number,
  targetMinutes: number
): GoalWithProgress {
  const percentage =
    targetMinutes > 0 ? Math.round((loggedMinutes / targetMinutes) * 100) : 0;

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

async function fetchKeywordsForGoal(
  goalId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<Keyword[]> {
  const { data, error } = await supabase
    .from("goal_keywords")
    .select("keywords(*)")
    .eq("goal_id", goalId);

  if (error) {
    throw createFailure(
      "FETCH_FAILED",
      "Keywords des Ziels konnten nicht geladen werden.",
      error.message
    );
  }

  return ((data ?? []) as GoalKeywordJoinRow[]).flatMap((row) => {
    if (!row.keywords) return [];
    return Array.isArray(row.keywords) ? row.keywords : [row.keywords];
  });
}

async function ensureOwnedKeywords(
  keywordIds: string[] | undefined,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string[] | undefined> {
  if (keywordIds === undefined) return undefined;
  if (keywordIds.length === 0) return [];

  const { data, error } = await supabase
    .from("keywords")
    .select("id")
    .eq("user_id", userId)
    .in("id", keywordIds);

  if (error) {
    throw createFailure(
      "KEYWORD_VALIDATION_FAILED",
      "Keywords konnten nicht geprüft werden.",
      error.message
    );
  }

  if ((data ?? []).length !== keywordIds.length) {
    throw createFailure(
      "INVALID_KEYWORDS",
      "Mindestens ein ausgewähltes Keyword ist ungültig oder gehört dir nicht."
    );
  }

  return keywordIds;
}

async function calcLoggedMinutes(
  goal: Goal,
  keywordIds: string[],
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  if (keywordIds.length === 0) return 0;

  const { data: eventKeywordRows, error: eventKeywordError } = await supabase
    .from("event_keywords")
    .select("event_id")
    .in("keyword_id", keywordIds);

  if (eventKeywordError) {
    throw createFailure(
      "FETCH_FAILED",
      "Fortschrittsdaten konnten nicht geladen werden.",
      eventKeywordError.message
    );
  }

  const eventIds = [...new Set((eventKeywordRows ?? []).map((row) => row.event_id))];
  if (eventIds.length === 0) return 0;

  let query = supabase
    .from("events")
    .select("start_time, end_time")
    .eq("user_id", userId)
    .in("id", eventIds);

  if (goal.start_time) query = query.gt("end_time", goal.start_time);
  if (goal.end_time) query = query.lte("start_time", goal.end_time);

  const { data: events, error: eventsError } = await query;

  if (eventsError) {
    throw createFailure(
      "FETCH_FAILED",
      "Fortschrittsdaten konnten nicht geladen werden.",
      eventsError.message
    );
  }

  const lowerBound = goal.start_time ? new Date(goal.start_time).getTime() : null;
  const upperBound = goal.end_time ? new Date(goal.end_time).getTime() : null;

  return (events ?? []).reduce((sum, event) => {
    const eventStart = new Date(event.start_time).getTime();
    const eventEnd = new Date(event.end_time).getTime();
    const overlapStart = lowerBound === null ? eventStart : Math.max(eventStart, lowerBound);
    const overlapEnd = upperBound === null ? eventEnd : Math.min(eventEnd, upperBound);

    if (overlapEnd <= overlapStart) return sum;

    return sum + Math.floor((overlapEnd - overlapStart) / 60000);
  }, 0);
}

async function enrichGoalWithProgress(
  goal: Goal,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<GoalWithProgress> {
  const keywords = await fetchKeywordsForGoal(goal.id, supabase);
  const targetMinutes = parseIntervalToMinutes(goal.target_study_time ?? "0:00:00");
  const keywordIds = keywords.map((keyword) => keyword.id);
  const loggedMinutes = await calcLoggedMinutes(goal, keywordIds, userId, supabase);

  return buildGoalWithProgress(goal, keywords, loggedMinutes, targetMinutes);
}

async function enrichGoalWithProgressSafely(
  goal: Goal,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<GoalWithProgress> {
  const targetMinutes = parseIntervalToMinutes(goal.target_study_time ?? "0:00:00");

  try {
    const keywords = await fetchKeywordsForGoal(goal.id, supabase);

    try {
      const keywordIds = keywords.map((keyword) => keyword.id);
      const loggedMinutes = await calcLoggedMinutes(goal, keywordIds, userId, supabase);

      return buildGoalWithProgress(goal, keywords, loggedMinutes, targetMinutes);
    } catch {
      return buildGoalWithProgress(goal, keywords, 0, targetMinutes);
    }
  } catch {
    return buildGoalWithProgress(goal, [], 0, targetMinutes);
  }
}

async function insertGoalKeywords(
  goalId: string,
  keywordIds: string[],
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<void> {
  if (keywordIds.length === 0) return;

  const { error } = await supabase
    .from("goal_keywords")
    .insert(keywordIds.map((keywordId) => ({ goal_id: goalId, keyword_id: keywordId })));

  if (error) {
    throw createFailure(
      "CREATE_FAILED",
      "Die Keyword-Zuordnung für das Ziel konnte nicht gespeichert werden.",
      error.message
    );
  }
}

function buildCreatePayload(data: GoalMutationInput, userId: string): GoalWritePayload {
  return {
    label: normalizeOptionalText(data.label),
    description: normalizeOptionalText(data.description),
    target_study_time: data.target_study_time ?? null,
    start_time: data.start_time ?? null,
    end_time: data.end_time ?? null,
    user_id: userId,
  };
}

function buildUpdatePayload(data: GoalMutationInput): GoalWritePayload {
  const payload: GoalWritePayload = {};

  if (data.label !== undefined) payload.label = normalizeOptionalText(data.label);
  if (data.description !== undefined) {
    payload.description = normalizeOptionalText(data.description);
  }
  if (data.target_study_time !== undefined) {
    payload.target_study_time = data.target_study_time ?? null;
  }
  if (data.start_time !== undefined) payload.start_time = data.start_time ?? null;
  if (data.end_time !== undefined) payload.end_time = data.end_time ?? null;

  return payload;
}

export async function getGoals(
  userId: string
): Promise<ApiResponse<GoalWithProgress[]>> {
  const supabase = await createClient();

  try {
    const { data: goals, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return {
        data: null,
        error: createFailure("FETCH_FAILED", "Ziele konnten nicht geladen werden.", error.message),
      };
    }

    const enrichedGoals = await Promise.all(
      (goals ?? []).map((goal: Goal) =>
        enrichGoalWithProgressSafely(goal, userId, supabase)
      )
    );

    return { data: enrichedGoals, error: null };
  } catch (error) {
    return {
      data: null,
      error: toFailure(error, "FETCH_FAILED", "Ziele konnten nicht geladen werden."),
    };
  }
}

export async function createGoal(
  data: GoalMutationInput & { user_id: string }
): Promise<ApiResponse<GoalWithProgress>> {
  const validation = validateGoal(data, {
    requireLabel: true,
  });
  if (!validation.valid) {
    return {
      data: null,
      error: createFailure("VALIDATION_ERROR", validation.error ?? "Ungültige Zieldaten."),
    };
  }

  const supabase = await createClient();

  try {
    const keywordIds = await ensureOwnedKeywords(
      normalizeKeywordIds(data.keyword_ids),
      data.user_id,
      supabase
    );

    const { data: newGoal, error } = await supabase
      .from("goals")
      .insert(buildCreatePayload(data, data.user_id))
      .select("*")
      .single();

    if (error) {
      return {
        data: null,
        error: createFailure("CREATE_FAILED", "Ziel konnte nicht erstellt werden.", error.message),
      };
    }

    try {
      await insertGoalKeywords(newGoal.id, keywordIds ?? [], supabase);
    } catch (keywordError) {
      await supabase.from("goals").delete().eq("id", newGoal.id).eq("user_id", data.user_id);
      throw keywordError;
    }

    const enrichedGoal = await enrichGoalWithProgressSafely(newGoal, data.user_id, supabase);
    return { data: enrichedGoal, error: null };
  } catch (error) {
    return {
      data: null,
      error: toFailure(error, "CREATE_FAILED", "Ziel konnte nicht erstellt werden."),
    };
  }
}

export async function updateGoal(
  id: string,
  userId: string,
  data: GoalMutationInput
): Promise<ApiResponse<GoalWithProgress>> {
  const validation = validateGoal(data);
  if (!validation.valid) {
    return {
      data: null,
      error: createFailure("VALIDATION_ERROR", validation.error ?? "Ungültige Zieldaten."),
    };
  }

  const supabase = await createClient();

  try {
    const keywordIds = await ensureOwnedKeywords(
      normalizeKeywordIds(data.keyword_ids),
      userId,
      supabase
    );
    const updatePayload = buildUpdatePayload(data);
    const hasFieldUpdates = Object.keys(updatePayload).length > 0;

    const goalResponse = hasFieldUpdates
      ? await supabase
          .from("goals")
          .update(updatePayload)
          .eq("id", id)
          .eq("user_id", userId)
          .select("*")
          .maybeSingle()
      : await supabase
          .from("goals")
          .select("*")
          .eq("id", id)
          .eq("user_id", userId)
          .maybeSingle();

    const { data: updatedGoal, error } = goalResponse;

    if (error) {
      return {
        data: null,
        error: createFailure("UPDATE_FAILED", "Ziel konnte nicht aktualisiert werden.", error.message),
      };
    }

    if (!updatedGoal) {
      return {
        data: null,
        error: createFailure("NOT_FOUND", "Ziel wurde nicht gefunden."),
      };
    }

    if (keywordIds !== undefined) {
      const { error: deleteRelationsError } = await supabase
        .from("goal_keywords")
        .delete()
        .eq("goal_id", id);

      if (deleteRelationsError) {
        throw createFailure(
          "UPDATE_FAILED",
          "Keyword-Zuordnungen konnten nicht aktualisiert werden.",
          deleteRelationsError.message
        );
      }

      await insertGoalKeywords(id, keywordIds, supabase);
    }

    const enrichedGoal = await enrichGoalWithProgressSafely(updatedGoal, userId, supabase);
    return { data: enrichedGoal, error: null };
  } catch (error) {
    return {
      data: null,
      error: toFailure(error, "UPDATE_FAILED", "Ziel konnte nicht aktualisiert werden."),
    };
  }
}

export async function deleteGoal(
  id: string,
  userId: string
): Promise<ApiResponse<{ success: boolean }>> {
  const supabase = await createClient();

  const { data: deletedGoal, error } = await supabase
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: createFailure("DELETE_FAILED", "Ziel konnte nicht gelöscht werden.", error.message),
    };
  }

  if (!deletedGoal) {
    return {
      data: null,
      error: createFailure("NOT_FOUND", "Ziel wurde nicht gefunden."),
    };
  }

  return { data: { success: true }, error: null };
}
