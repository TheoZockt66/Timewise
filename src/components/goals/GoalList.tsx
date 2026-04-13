import { GoalCard } from "@/components/goals/GoalCard";
import type { GoalFormValues } from "@/hooks/useGoals";
import type { GoalWithProgress, Keyword } from "@/types";

type GoalListProps = {
  goals: GoalWithProgress[];
  availableKeywords: Keyword[];
  editingId: string | null;
  editValues: GoalFormValues;
  disabled?: boolean;
  onEditValuesChange: (values: GoalFormValues) => void;
  onStartEdit: (goal: GoalWithProgress) => void;
  onCancelEdit: () => void;
  onSave: (id: string) => void;
  onDelete: (id: string) => void;
};

export function GoalList({
  goals,
  availableKeywords,
  editingId,
  editValues,
  disabled = false,
  onEditValuesChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: GoalListProps) {
  if (goals.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Ziele vorhanden.</p>;
  }

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          availableKeywords={availableKeywords}
          isEditing={editingId === goal.id}
          editValues={editValues}
          disabled={disabled}
          onEditValuesChange={onEditValuesChange}
          onStartEdit={() => onStartEdit(goal)}
          onCancelEdit={onCancelEdit}
          onSave={() => onSave(goal.id)}
          onDelete={() => onDelete(goal.id)}
        />
      ))}
    </div>
  );
}
