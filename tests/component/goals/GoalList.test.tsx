import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GoalList } from "@/components/goals/GoalList";
import { buildGoalWithProgress } from "../../factories/goals";
import { buildKeyword } from "../../factories/keywords";

vi.mock("@/components/goals/GoalCard", () => ({
  GoalCard: ({
    goal,
    isEditing,
    onStartEdit,
    onSave,
    onDelete,
  }: {
    goal: { id: string; label?: string | null };
    isEditing: boolean;
    onStartEdit: () => void;
    onSave: () => void;
    onDelete: () => void;
  }) => (
    <div>
      <span>{goal.label}</span>
      <span>{isEditing ? "editing" : "view"}</span>
      <button type="button" onClick={onStartEdit}>
        Bearbeitung starten
      </button>
      <button type="button" onClick={onSave}>
        Speichern
      </button>
      <button type="button" onClick={onDelete}>
        Löschen
      </button>
    </div>
  ),
}));

describe("GoalList", () => {
  test("renders an empty state when no goals exist", () => {
    render(
      <GoalList
        goals={[]}
        availableKeywords={[]}
        editingId={null}
        editValues={{
          label: "",
          description: "",
          targetHours: "",
          startDate: "",
          endDate: "",
          keywordIds: [],
        }}
        onEditValuesChange={vi.fn()}
        onStartEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onSave={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Noch keine Ziele vorhanden.")).toBeInTheDocument();
  });

  test("wires card interactions back to the page handlers", () => {
    const goal = buildGoalWithProgress({ id: "goal-1", label: "Physik" });
    const onStartEdit = vi.fn();
    const onSave = vi.fn();
    const onDelete = vi.fn();

    render(
      <GoalList
        goals={[goal]}
        availableKeywords={[buildKeyword()]}
        editingId="goal-1"
        editValues={{
          label: goal.label ?? "",
          description: "",
          targetHours: "",
          startDate: "",
          endDate: "",
          keywordIds: [],
        }}
        onEditValuesChange={vi.fn()}
        onStartEdit={onStartEdit}
        onCancelEdit={vi.fn()}
        onSave={onSave}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("editing")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Bearbeitung starten" }));
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));

    expect(onStartEdit).toHaveBeenCalledWith(goal);
    expect(onSave).toHaveBeenCalledWith(goal.id);
    expect(onDelete).toHaveBeenCalledWith(goal.id);
  });
});
