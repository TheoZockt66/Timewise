import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GoalCard } from "@/components/goals/GoalCard";
import { buildGoalWithProgress } from "../../factories/goals";
import { buildKeyword } from "../../factories/keywords";

vi.mock("@/components/goals/GoalForm", () => ({
  GoalForm: ({
    submitLabel,
    onSubmit,
    onCancel,
  }: {
    submitLabel: string;
    onSubmit: () => void;
    onCancel?: () => void;
  }) => (
    <div>
      <span>{submitLabel}</span>
      <button type="button" onClick={onSubmit}>
        Ziel speichern
      </button>
      <button type="button" onClick={onCancel}>
        Bearbeitung abbrechen
      </button>
    </div>
  ),
}));

vi.mock("@/components/goals/GoalProgressBar", () => ({
  GoalProgressBar: ({
    percentage,
  }: {
    percentage: number;
  }) => <div>Fortschritt: {percentage}%</div>,
}));

describe("GoalCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders the goal summary and forwards edit/delete interactions", () => {
    const onStartEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <GoalCard
        goal={buildGoalWithProgress({
          label: "Klausurvorbereitung",
          percentage: 75,
          keywords: [buildKeyword()],
        })}
        availableKeywords={[buildKeyword()]}
        isEditing={false}
        editValues={{
          label: "",
          description: "",
          targetHours: "",
          startDate: "",
          endDate: "",
          keywordIds: [],
        }}
        onEditValuesChange={vi.fn()}
        onStartEdit={onStartEdit}
        onCancelEdit={vi.fn()}
        onSave={vi.fn()}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Klausurvorbereitung")).toBeInTheDocument();
    expect(screen.getByText("Fortschritt: 75%")).toBeInTheDocument();
    expect(screen.getByText("Mathe")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten" }));
    fireEvent.click(screen.getByRole("button", { name: /L.schen/i }));

    expect(onStartEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test("renders the inline edit form when the card is in edit mode", () => {
    const onSave = vi.fn();
    const onCancelEdit = vi.fn();

    render(
      <GoalCard
        goal={buildGoalWithProgress()}
        availableKeywords={[buildKeyword()]}
        isEditing
        editValues={{
          label: "Klausur",
          description: "Algebra",
          targetHours: "10",
          startDate: "2026-04-01",
          endDate: "2026-04-30",
          keywordIds: ["keyword-1"],
        }}
        onEditValuesChange={vi.fn()}
        onStartEdit={vi.fn()}
        onCancelEdit={onCancelEdit}
        onSave={onSave}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Speichern")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ziel speichern" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Bearbeitung abbrechen" })
    );

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });
});
