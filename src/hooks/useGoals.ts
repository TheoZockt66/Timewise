"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse, GoalWithProgress, Keyword } from "@/types";

export type GoalFormValues = {
  label: string;
  description: string;
  targetHours: string;
  startDate: string;
  endDate: string;
  keywordIds: string[];
};

type UseGoalsResult = {
  goals: GoalWithProgress[];
  availableKeywords: Keyword[];
  loading: boolean;
  saving: boolean;
  deletingId: string | null;
  error: string | null;
  refetch: () => Promise<void>;
  createGoalEntry: (values: GoalFormValues) => Promise<ApiResponse<GoalWithProgress>>;
  updateGoalEntry: (
    id: string,
    values: GoalFormValues
  ) => Promise<ApiResponse<GoalWithProgress>>;
  deleteGoalEntry: (id: string) => Promise<ApiResponse<{ success: boolean }>>;
};

export function createEmptyGoalFormValues(): GoalFormValues {
  return {
    label: "",
    description: "",
    targetHours: "",
    startDate: "",
    endDate: "",
    keywordIds: [],
  };
}

function parseIntervalToHours(interval?: string | null): string {
  if (!interval) return "";
  return String(Math.max(1, parseInt(interval.split(":")[0] || "1", 10)));
}

function isoToDateInput(iso?: string | null): string {
  return iso ? iso.substring(0, 10) : "";
}

function dateInputToGoalBoundary(
  value: string,
  boundary: "start" | "end"
): string | null {
  if (!value) return null;

  return boundary === "start"
    ? `${value}T00:00:00.000Z`
    : `${value}T23:59:59.999Z`;
}

function buildGoalPayload(values: GoalFormValues) {
  const trimmedTargetHours = values.targetHours.trim();

  return {
    label: values.label,
    description: values.description,
    target_study_time:
      trimmedTargetHours.length > 0 ? `${trimmedTargetHours}:00:00` : null,
    start_time: dateInputToGoalBoundary(values.startDate, "start"),
    end_time: dateInputToGoalBoundary(values.endDate, "end"),
    keyword_ids: values.keywordIds,
  };
}

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      data: null,
      error: {
        code: "INVALID_RESPONSE",
        message: "Der Server hat keine gültige Antwort geliefert.",
      },
    };
  }
}

export function goalToFormValues(goal: GoalWithProgress): GoalFormValues {
  return {
    label: goal.label ?? "",
    description: goal.description ?? "",
    targetHours: parseIntervalToHours(goal.target_study_time),
    startDate: isoToDateInput(goal.start_time),
    endDate: isoToDateInput(goal.end_time),
    keywordIds: goal.keywords.map((keyword) => keyword.id),
  };
}

export function useGoals(): UseGoalsResult {
  const [goals, setGoals] = useState<GoalWithProgress[]>([]);
  const [availableKeywords, setAvailableKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [goalsResponse, keywordsResponse] = await Promise.all([
        fetch("/api/goals"),
        fetch("/api/keywords"),
      ]);

      const [goalsResult, keywordsResult] = await Promise.all([
        readApiResponse<GoalWithProgress[]>(goalsResponse),
        readApiResponse<Keyword[]>(keywordsResponse),
      ]);

      const goalsError =
        !goalsResponse.ok || goalsResult.error
          ? goalsResult.error?.message || "Ziele konnten nicht geladen werden."
          : null;

      const keywordsError =
        !keywordsResponse.ok || keywordsResult.error
          ? keywordsResult.error?.message || "Keywords konnten nicht geladen werden."
          : null;

      if (!goalsError) {
        setGoals(goalsResult.data ?? []);
      } else {
        setGoals([]);
      }

      if (!keywordsError) {
        setAvailableKeywords(keywordsResult.data ?? []);
      }

      if (goalsError || keywordsError) {
        throw new Error([goalsError, keywordsError].filter(Boolean).join(" "));
      }
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Ziele konnten nicht geladen werden."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createGoalEntry = useCallback(
    async (values: GoalFormValues): Promise<ApiResponse<GoalWithProgress>> => {
      setSaving(true);

      try {
        const response = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildGoalPayload(values)),
        });

        const result = await readApiResponse<GoalWithProgress>(response);

        if (!response.ok || result.error || !result.data) {
          return {
            data: null,
            error: result.error ?? {
              code: "CREATE_FAILED",
              message: "Ziel konnte nicht erstellt werden.",
            },
          };
        }

        setGoals((prevGoals) => [result.data!, ...prevGoals]);
        return result;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const updateGoalEntry = useCallback(
    async (
      id: string,
      values: GoalFormValues
    ): Promise<ApiResponse<GoalWithProgress>> => {
      setSaving(true);

      try {
        const response = await fetch(`/api/goals/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildGoalPayload(values)),
        });

        const result = await readApiResponse<GoalWithProgress>(response);

        if (!response.ok || result.error || !result.data) {
          return {
            data: null,
            error: result.error ?? {
              code: "UPDATE_FAILED",
              message: "Ziel konnte nicht aktualisiert werden.",
            },
          };
        }

        setGoals((prevGoals) =>
          prevGoals.map((goal) => (goal.id === id ? result.data! : goal))
        );

        return result;
      } finally {
        setSaving(false);
      }
    },
    []
  );

  const deleteGoalEntry = useCallback(
    async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
      setDeletingId(id);

      try {
        const response = await fetch(`/api/goals/${id}`, { method: "DELETE" });
        const result = await readApiResponse<{ success: boolean }>(response);

        if (!response.ok || result.error || !result.data) {
          return {
            data: null,
            error: result.error ?? {
              code: "DELETE_FAILED",
              message: "Ziel konnte nicht gelöscht werden.",
            },
          };
        }

        setGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== id));
        return result;
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

  return {
    goals,
    availableKeywords,
    loading,
    saving,
    deletingId,
    error,
    refetch,
    createGoalEntry,
    updateGoalEntry,
    deleteGoalEntry,
  };
}
