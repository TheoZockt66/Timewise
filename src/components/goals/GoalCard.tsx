import { Button } from "@/components/ui/button";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalProgressBar } from "@/components/goals/GoalProgressBar";
import type { GoalFormValues } from "@/hooks/useGoals";
import type { GoalWithProgress, Keyword } from "@/types";

type GoalCardProps = {
  goal: GoalWithProgress;
  availableKeywords: Keyword[];
  isEditing: boolean;
  disabled?: boolean;
  editValues: GoalFormValues;
  onEditValuesChange: (values: GoalFormValues) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
};

function formatGoalDate(iso?: string | null): string | null {
  return iso ? new Date(iso).toLocaleDateString("de-DE") : null;
}

export function GoalCard({
  goal,
  availableKeywords,
  isEditing,
  disabled = false,
  editValues,
  onEditValuesChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: GoalCardProps) {
  if (isEditing) {
    return (
      <div className="rounded-lg border bg-background p-4">
        <GoalForm
          values={editValues}
          availableKeywords={availableKeywords}
          submitLabel="Speichern"
          disabled={disabled}
          onChange={onEditValuesChange}
          onSubmit={onSave}
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {goal.keywords.length > 0 ? (
              <span
                className="h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: goal.keywords[0].color }}
              />
            ) : null}
            <span className="truncate text-base font-semibold">
              {goal.label || "Unbenanntes Ziel"}
            </span>
          </div>

          {goal.is_achieved ? (
            <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Ziel erreicht
            </span>
          ) : null}
        </div>

        {goal.description ? (
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        ) : null}

        {goal.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {goal.keywords.map((keyword) => (
              <span
                key={keyword.id}
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: keyword.color }}
              >
                {keyword.label}
              </span>
            ))}
          </div>
        ) : null}

        {goal.target_minutes > 0 ? (
          <GoalProgressBar
            loggedMinutes={goal.logged_minutes}
            targetMinutes={goal.target_minutes}
            percentage={goal.percentage}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Keine Zielzeit definiert.</p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {formatGoalDate(goal.start_time) ? <span>ab {formatGoalDate(goal.start_time)}</span> : null}
          {formatGoalDate(goal.end_time) ? <span>bis {formatGoalDate(goal.end_time)}</span> : null}
          {goal.days_remaining > 0 && !goal.is_achieved ? (
            <span>{goal.days_remaining} Tage verbleibend</span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onStartEdit}
            className="min-h-11"
            disabled={disabled}
          >
            Bearbeiten
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            className="min-h-11"
            disabled={disabled}
          >
            Löschen
          </Button>
        </div>
      </div>
    </div>
  );
}
