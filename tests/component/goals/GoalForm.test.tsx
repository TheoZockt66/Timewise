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
        submitLabel="Hinzufuegen"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Bezeichnung ist erforderlich.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hinzufuegen" })
    ).toBeDisabled();
  });

  test("normalizes empty and too-small target hour inputs", () => {
    const onChange = vi.fn();
    const { container } = render(
      <GoalForm
        values={{ ...baseValues, label: "Klausur", targetHours: "2" }}
        availableKeywords={[]}
        submitLabel="Speichern"
        onChange={onChange}
        onSubmit={vi.fn()}
      />
    );

    const targetHoursInput = container.querySelector(
      'input[type="number"]'
    ) as HTMLInputElement;

    fireEvent.change(targetHoursInput, { target: { value: "" } });
    fireEvent.change(targetHoursInput, { target: { value: "0" } });
    fireEvent.change(targetHoursInput, { target: { value: "0.5" } });

    expect(onChange).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        targetHours: "",
      })
    );
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        targetHours: "1",
      })
    );
    expect(onChange).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        targetHours: "1",
      })
    );
  });

  test("updates description and date fields through onChange", () => {
    const onChange = vi.fn();
    const { container } = render(
      <GoalForm
        values={{ ...baseValues, label: "Klausur" }}
        availableKeywords={[]}
        submitLabel="Speichern"
        onChange={onChange}
        onSubmit={vi.fn()}
      />
    );

    const dateInputs = container.querySelectorAll('input[type="date"]');

    fireEvent.change(screen.getByPlaceholderText("Beschreibung (optional)"), {
      target: { value: "Kapitel 1-4" },
    });
    fireEvent.change(dateInputs[0] as HTMLInputElement, {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(dateInputs[1] as HTMLInputElement, {
      target: { value: "2026-04-30" },
    });

    expect(onChange).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        description: "Kapitel 1-4",
      })
    );
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        startDate: "2026-04-01",
      })
    );
    expect(onChange).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        endDate: "2026-04-30",
      })
    );
  });

  test("renders no keyword picker when no keywords are available", () => {
    render(
      <GoalForm
        values={{ ...baseValues, label: "Klausur" }}
        availableKeywords={[]}
        submitLabel="Speichern"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.queryByText("Keywords (optional)")).not.toBeInTheDocument();
  });

  test("renders selected and unselected keyword styles and toggles selection", () => {
    const onChange = vi.fn();
    const selectedKeyword = buildKeyword();
    const unselectedKeyword = buildKeyword({
      id: "keyword-2",
      label: "Physik",
      color: "#00957F",
    });

    render(
      <GoalForm
        values={{
          ...baseValues,
          label: "Klausur",
          keywordIds: [selectedKeyword.id],
        }}
        availableKeywords={[selectedKeyword, unselectedKeyword]}
        submitLabel="Speichern"
        onChange={onChange}
        onSubmit={vi.fn()}
      />
    );

    const selectedButton = screen.getByRole("button", {
      name: selectedKeyword.label,
    });
    const unselectedButton = screen.getByRole("button", {
      name: unselectedKeyword.label,
    });

    expect(selectedButton).toHaveStyle({
      backgroundColor: "#7700F4",
      color: "#FFFFFF",
    });
    expect(unselectedButton.className).toContain("border-border");

    fireEvent.click(selectedButton);
    fireEvent.click(unselectedButton);

    expect(onChange).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        keywordIds: [],
      })
    );
    expect(onChange).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        keywordIds: [selectedKeyword.id, unselectedKeyword.id],
      })
    );
  });

  test("submits valid values and supports optional cancellation", () => {
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

  test("does not render a cancel button when onCancel is omitted", () => {
    render(
      <GoalForm
        values={{ ...baseValues, label: "Klausur" }}
        availableKeywords={[]}
        submitLabel="Speichern"
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: "Abbrechen" })).not.toBeInTheDocument();
  });
});
