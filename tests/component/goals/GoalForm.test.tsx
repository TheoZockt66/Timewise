import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { GoalForm } from "@/components/goals/GoalForm";
import { buildKeyword } from "../../factories/keywords";

const baseValues = {
  label: "",
  description: "",
  targetHours: "",
  startDate: "",
  endDate: "",
  keywordIds: [],
};

describe("GoalForm", () => {
  test("shows validation feedback and disables submit without a label", () => {
    render(
      <GoalForm
        values={baseValues}
        availableKeywords={[]}
        submitLabel="Hinzufügen"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Bezeichnung ist erforderlich.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hinzufügen" })
    ).toBeDisabled();
  });

  test("normalizes target hours and toggles selected keywords", () => {
    const onChange = vi.fn();
    const keyword = buildKeyword();
    const { container } = render(
      <GoalForm
        values={{ ...baseValues, label: "Klausur" }}
        availableKeywords={[keyword]}
        submitLabel="Hinzufügen"
        onChange={onChange}
        onSubmit={vi.fn()}
      />
    );

    const targetHoursInput = container.querySelector(
      'input[type="number"]'
    ) as HTMLInputElement;

    fireEvent.change(targetHoursInput, { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: keyword.label }));

    expect(onChange).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        targetHours: "1",
      })
    );
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        keywordIds: [keyword.id],
      })
    );
  });

  test("submits valid values and supports cancellation", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(
      <GoalForm
        values={{ ...baseValues, label: "Klausur" }}
        availableKeywords={[]}
        submitLabel="Speichern"
        onChange={vi.fn()}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
