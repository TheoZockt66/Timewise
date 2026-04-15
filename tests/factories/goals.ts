import type { Goal, GoalWithProgress, Keyword } from "@/types";
import { buildKeyword } from "./keywords";

export function buildGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    user_id: "user-1",
    label: "Klausurvorbereitung",
    description: "Lineare Algebra",
    start_time: "2026-04-01T00:00:00.000Z",
    end_time: "2026-04-30T23:59:59.999Z",
    target_study_time: "10:00:00",
    created_at: "2026-04-01T09:00:00.000Z",
    ...overrides,
  };
}

export function buildGoalWithProgress(
  overrides: Partial<GoalWithProgress> = {}
): GoalWithProgress {
  const { keywords, ...goalOverrides } = overrides;
  const goal = buildGoal(goalOverrides);

  return {
    ...goal,
    keywords: keywords ?? [buildKeyword()],
    logged_minutes: overrides.logged_minutes ?? 120,
    target_minutes: overrides.target_minutes ?? 600,
    percentage: overrides.percentage ?? 20,
    is_achieved: overrides.is_achieved ?? false,
    remaining_minutes: overrides.remaining_minutes ?? 480,
    days_remaining: overrides.days_remaining ?? 10,
  };
}

export function buildGoalKeywordJoinRows(keywords: Keyword[] = [buildKeyword()]) {
  return keywords.map((keyword) => ({
    keywords: keyword,
  }));
}
