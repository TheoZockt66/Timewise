import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Keyword } from "@/types";
import type { GoalFormValues } from "@/hooks/useGoals";

type GoalFormProps = {
  values: GoalFormValues;
  availableKeywords: Keyword[];
  submitLabel: string;
  disabled?: boolean;
  onChange: (nextValues: GoalFormValues) => void;
  onSubmit: () => void;
  onCancel?: () => void;
};

function toggleKeyword(values: GoalFormValues, keywordId: string): GoalFormValues {
  const keywordIds = values.keywordIds.includes(keywordId)
    ? values.keywordIds.filter((id) => id !== keywordId)
    : [...values.keywordIds, keywordId];

  return { ...values, keywordIds };
}

export function GoalForm({
  values,
  availableKeywords,
  submitLabel,
  disabled = false,
  onChange,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const isLabelMissing = values.label.trim().length === 0;
  const submitDisabled = disabled || isLabelMissing;

  function handleTargetHoursChange(value: string) {
    if (value === "") {
      onChange({ ...values, targetHours: "" });
      return;
    }

    const parsedValue = parseInt(value, 10);

    onChange({
      ...values,
      targetHours:
        Number.isNaN(parsedValue) || parsedValue < 1 ? "1" : String(parsedValue),
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex flex-col gap-1 md:flex-1">
          <label className="text-xs text-muted-foreground">Bezeichnung *</label>
          <Input
            value={values.label}
            onChange={(event) => onChange({ ...values, label: event.target.value })}
            placeholder="Bezeichnung"
            aria-required="true"
            disabled={disabled}
          />
          {isLabelMissing ? (
            <p className="text-xs text-destructive">Bezeichnung ist erforderlich.</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 md:w-48">
          <label className="text-xs text-muted-foreground">Zielzeit (optional)</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={values.targetHours}
              onChange={(event) => handleTargetHoursChange(event.target.value)}
              className="w-full"
              placeholder="Keine"
              disabled={disabled}
            />
            <span className="whitespace-nowrap text-sm text-muted-foreground">Stunden</span>
          </div>
        </div>
      </div>

      <Input
        value={values.description}
        onChange={(event) => onChange({ ...values, description: event.target.value })}
        placeholder="Beschreibung (optional)"
        disabled={disabled}
      />

      <div className="flex flex-col gap-3 md:flex-row">
        <div className="flex flex-col gap-1 md:flex-1">
          <label className="text-xs text-muted-foreground">Startdatum (optional)</label>
          <Input
            type="date"
            value={values.startDate}
            onChange={(event) => onChange({ ...values, startDate: event.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1 md:flex-1">
          <label className="text-xs text-muted-foreground">Enddatum (optional)</label>
          <Input
            type="date"
            value={values.endDate}
            onChange={(event) => onChange({ ...values, endDate: event.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      {availableKeywords.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Keywords (optional)</span>
          <div className="flex flex-wrap gap-2">
            {availableKeywords.map((keyword) => {
              const isSelected = values.keywordIds.includes(keyword.id);

              return (
                <button
                  key={keyword.id}
                  type="button"
                  onClick={() => onChange(toggleKeyword(values, keyword.id))}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors ${
                    isSelected
                      ? "border-transparent text-white"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                  style={isSelected ? { backgroundColor: keyword.color } : {}}
                  disabled={disabled}
                >
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: isSelected ? "white" : keyword.color }}
                  />
                  {keyword.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSubmit} className="min-h-11" disabled={submitDisabled}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="min-h-11"
            disabled={disabled}
          >
            Abbrechen
          </Button>
        ) : null}
      </div>
    </div>
  );
}
