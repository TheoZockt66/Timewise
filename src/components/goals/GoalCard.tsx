import { Button } from "@/components/ui/button";
import { KeywordBadges } from "@/components/ui/KeywordBadges";
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

function formatLoggedMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} Minute${minutes === 1 ? "" : "n"}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} Stunde${hours === 1 ? "" : "n"}`;
  }

  return `${hours} Stunde${hours === 1 ? "" : "n"} ${remainingMinutes} Minute${remainingMinutes === 1 ? "" : "n"}`;
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

        <KeywordBadges keywords={goal.keywords} />

        {goal.target_minutes > 0 ? (
          <GoalProgressBar
            loggedMinutes={goal.logged_minutes}
            targetMinutes={goal.target_minutes}
            percentage={goal.percentage}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Bisher aufgewendete Zeit: {formatLoggedMinutes(goal.logged_minutes)}
          </p>
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
