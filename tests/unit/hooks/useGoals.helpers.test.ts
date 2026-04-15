import { describe, expect, test } from "vitest";
import {
  createEmptyGoalFormValues,
  goalToFormValues,
} from "@/hooks/useGoals";
import { buildGoalWithProgress } from "../../factories/goals";
import { buildKeyword } from "../../factories/keywords";

describe("useGoals helpers", () => {
  test("creates an empty goal form state", () => {
    expect(createEmptyGoalFormValues()).toEqual({
      label: "",
      description: "",
      targetHours: "",
      startDate: "",
      endDate: "",
      keywordIds: [],
    });
  });

  test("maps a goal response into editable form values", () => {
    const goal = buildGoalWithProgress({
      target_study_time: "12:00:00",
      start_time: "2026-04-01T00:00:00.000Z",
      end_time: "2026-04-30T23:59:59.999Z",
      keywords: [buildKeyword({ id: "keyword-2" })],
    });

    expect(goalToFormValues(goal)).toEqual({
      label: goal.label,
      description: goal.description,
      targetHours: "12",
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      keywordIds: ["keyword-2"],
    });
  });
});
