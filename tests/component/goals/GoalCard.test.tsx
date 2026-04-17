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

const baseEditValues = {
  label: "",
  description: "",
  targetHours: "",
  startDate: "",
  endDate: "",
  keywordIds: [],
};

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
        editValues={baseEditValues}
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

  test("formats short logged durations without a goal target", () => {
    render(
      <GoalCard
        goal={buildGoalWithProgress({
          target_minutes: 0,
          logged_minutes: 1,
          label: null,
          description: null,
          keywords: [],
          days_remaining: 0,
        })}
        availableKeywords={[]}
        isEditing={false}
        editValues={baseEditValues}
        onEditValuesChange={vi.fn()}
        onStartEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Unbenanntes Ziel")).toBeInTheDocument();
    expect(
      screen.getByText("Bisher aufgewendete Zeit: 1 Minute")
    ).toBeInTheDocument();
    expect(screen.queryByText("Mathe")).not.toBeInTheDocument();
  });

  test("formats plural minutes and full hours without a goal target", () => {
    const { rerender } = render(
      <GoalCard
        goal={buildGoalWithProgress({
          target_minutes: 0,
          logged_minutes: 45,
          keywords: [],
        })}
        availableKeywords={[]}
        isEditing={false}
        editValues={baseEditValues}
        onEditValuesChange={vi.fn()}
        onStartEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(
      screen.getByText("Bisher aufgewendete Zeit: 45 Minuten")
    ).toBeInTheDocument();

    rerender(
      <GoalCard
        goal={buildGoalWithProgress({
          target_minutes: 0,
          logged_minutes: 120,
          keywords: [],
        })}
        availableKeywords={[]}
        isEditing={false}
        editValues={baseEditValues}
        onEditValuesChange={vi.fn()}
        onStartEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(
      screen.getByText("Bisher aufgewendete Zeit: 2 Stunden")
    ).toBeInTheDocument();
  });

  test("formats mixed hours and minutes, shows dates, remaining days and the achieved badge", () => {
    render(
      <GoalCard
        goal={buildGoalWithProgress({
          target_minutes: 0,
          logged_minutes: 90,
          is_achieved: true,
          start_time: "2026-04-01T12:00:00.000Z",
          end_time: "2026-04-30T12:00:00.000Z",
          days_remaining: 5,
          keywords: [buildKeyword()],
        })}
        availableKeywords={[buildKeyword()]}
        isEditing={false}
        editValues={baseEditValues}
        onEditValuesChange={vi.fn()}
        onStartEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(
      screen.getByText("Bisher aufgewendete Zeit: 1 Stunde 30 Minuten")
    ).toBeInTheDocument();
    expect(screen.getByText("Ziel erreicht")).toBeInTheDocument();
    expect(screen.getByText("ab 1.4.2026")).toBeInTheDocument();
    expect(screen.getByText("bis 30.4.2026")).toBeInTheDocument();
    expect(screen.queryByText("5 Tage verbleibend")).not.toBeInTheDocument();
  });

  test("shows remaining days when the goal is still active", () => {
    render(
      <GoalCard
        goal={buildGoalWithProgress({
          target_minutes: 0,
          logged_minutes: 30,
          is_achieved: false,
          days_remaining: 7,
          keywords: [],
        })}
        availableKeywords={[]}
        isEditing={false}
        editValues={baseEditValues}
        onEditValuesChange={vi.fn()}
        onStartEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("7 Tage verbleibend")).toBeInTheDocument();
  });
});
