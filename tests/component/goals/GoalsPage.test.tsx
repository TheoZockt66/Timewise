import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import GoalsPage from "@/app/(dashboard)/goals/page";
import { useGoals } from "@/hooks/useGoals";
import { buildGoalWithProgress } from "../../factories/goals";
import { buildKeyword } from "../../factories/keywords";

const toastMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("@/hooks/useGoals", async () => {
  const actual = await vi.importActual<typeof import("@/hooks/useGoals")>(
    "@/hooks/useGoals"
  );

  return {
    ...actual,
    useGoals: vi.fn(),
  };
});

vi.mock("@/components/goals/GoalForm", () => ({
  GoalForm: ({
    submitLabel,
    values,
    onChange,
    onSubmit,
  }: {
    submitLabel: string;
    values: { label: string };
    onChange: (values: { label: string }) => void;
    onSubmit: () => void;
  }) => (
    <div data-testid={`goal-form-${submitLabel}`}>
      <span>{values.label}</span>
      <button
        type="button"
        onClick={() =>
          onChange({
            ...values,
            label: /Hinzuf/i.test(submitLabel) ? "Neues Ziel" : "Bearbeitetes Ziel",
          })
        }
      >
        Wert setzen {submitLabel}
      </button>
      <button type="button" onClick={onSubmit}>
        {submitLabel}
      </button>
    </div>
  ),
}));

vi.mock("@/components/goals/GoalList", () => ({
  GoalList: ({
    goals,
    editingId,
    editValues,
    onStartEdit,
    onEditValuesChange,
    onSave,
    onDelete,
    onCancelEdit,
  }: {
    goals: Array<{ id: string; label?: string | null }>;
    editingId: string | null;
    editValues: { label: string };
    onStartEdit: (goal: { id: string; label?: string | null }) => void;
    onEditValuesChange: (values: { label: string }) => void;
    onSave: (id: string) => void;
    onDelete: (id: string) => void;
    onCancelEdit: () => void;
  }) => (
    <div>
      <span data-testid="editing-id">{editingId ?? "none"}</span>
      <span data-testid="edit-value">{editValues.label}</span>
      <button type="button" onClick={() => onStartEdit(goals[0])}>
        Bearbeitung starten
      </button>
      <button
        type="button"
        onClick={() =>
          onEditValuesChange({
            ...editValues,
            label: "Bearbeitetes Ziel",
          })
        }
      >
        Editwert setzen
      </button>
      <button type="button" onClick={() => onSave(goals[0].id)}>
        Speichern
      </button>
      <button type="button" onClick={() => onDelete(goals[0].id)}>
        Löschen
      </button>
      <button type="button" onClick={onCancelEdit}>
        Bearbeitung abbrechen
      </button>
    </div>
  ),
}));

const mockedUseGoals = vi.mocked(useGoals);

describe("GoalsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("starts collapsed and can expand the create-goal form", () => {
    mockedUseGoals.mockReturnValue({
      goals: [],
      availableKeywords: [buildKeyword()],
      loading: false,
      saving: false,
      deletingId: null,
      error: null,
      refetch: vi.fn(),
      createGoalEntry: vi.fn(),
      updateGoalEntry: vi.fn(),
      deleteGoalEntry: vi.fn(),
    });

    render(<GoalsPage />);

    expect(screen.queryByTestId(/goal-form-/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /formular ausklappen/i })
    ).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(screen.getByRole("button", { name: /formular ausklappen/i }));

    expect(screen.getByTestId(/goal-form-/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /formular einklappen/i }));

    expect(screen.queryByTestId(/goal-form-/)).not.toBeInTheDocument();
  });

  test("creates, edits and deletes goals through the page callbacks", async () => {
    const goal = buildGoalWithProgress({ id: "goal-1", label: "Matheplan" });
    const createGoalEntry = vi.fn().mockResolvedValue({ data: goal, error: null });
    const updateGoalEntry = vi.fn().mockResolvedValue({ data: goal, error: null });
    const deleteGoalEntry = vi.fn().mockResolvedValue({
      data: { success: true },
      error: null,
    });

    mockedUseGoals.mockReturnValue({
      goals: [goal],
      availableKeywords: [buildKeyword()],
      loading: false,
      saving: false,
      deletingId: null,
      error: null,
      refetch: vi.fn(),
      createGoalEntry,
      updateGoalEntry,
      deleteGoalEntry,
    });

    render(<GoalsPage />);

    fireEvent.click(screen.getByRole("button", { name: /formular ausklappen/i }));
    fireEvent.click(screen.getByRole("button", { name: /wert setzen hinzuf/i }));
    fireEvent.click(screen.getByRole("button", { name: /^hinzuf/i }));

    await waitFor(() => {
      expect(createGoalEntry).toHaveBeenCalledWith(
        expect.objectContaining({ label: "Neues Ziel" })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Bearbeitung starten" }));

    await waitFor(() => {
      expect(screen.getByTestId("editing-id")).toHaveTextContent("goal-1");
      expect(screen.getByTestId("edit-value")).toHaveTextContent("Matheplan");
    });

    fireEvent.click(screen.getByRole("button", { name: "Editwert setzen" }));
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));
    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));

    await waitFor(() => {
      expect(updateGoalEntry).toHaveBeenCalledWith(
        "goal-1",
        expect.objectContaining({ label: "Bearbeitetes Ziel" })
      );
      expect(deleteGoalEntry).toHaveBeenCalledWith("goal-1");
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Erfolg" })
    );
  });

  test("renders the error state and supports refetching", () => {
    const refetch = vi.fn();

    mockedUseGoals.mockReturnValue({
      goals: [],
      availableKeywords: [],
      loading: false,
      saving: false,
      deletingId: null,
      error: "Ziele konnten nicht geladen werden.",
      refetch,
      createGoalEntry: vi.fn(),
      updateGoalEntry: vi.fn(),
      deleteGoalEntry: vi.fn(),
    });

    render(<GoalsPage />);

    expect(
      screen.getByText("Ziele konnten nicht geladen werden.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Erneut laden" }));

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  test("shows the loading state while goals are fetched", () => {
    mockedUseGoals.mockReturnValue({
      goals: [],
      availableKeywords: [],
      loading: true,
      saving: false,
      deletingId: null,
      error: null,
      refetch: vi.fn(),
      createGoalEntry: vi.fn(),
      updateGoalEntry: vi.fn(),
      deleteGoalEntry: vi.fn(),
    });

    render(<GoalsPage />);

    expect(screen.getByText(/Ziele werden geladen/i)).toBeInTheDocument();
  });

  test("shows destructive toasts when create, update and delete fail", async () => {
    const goal = buildGoalWithProgress({ id: "goal-1", label: "Matheplan" });
    const createGoalEntry = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Create kaputt" },
    });
    const updateGoalEntry = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Update kaputt" },
    });
    const deleteGoalEntry = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Delete kaputt" },
    });

    mockedUseGoals.mockReturnValue({
      goals: [goal],
      availableKeywords: [buildKeyword()],
      loading: false,
      saving: false,
      deletingId: null,
      error: null,
      refetch: vi.fn(),
      createGoalEntry,
      updateGoalEntry,
      deleteGoalEntry,
    });

    render(<GoalsPage />);

    fireEvent.click(screen.getByRole("button", { name: /formular ausklappen/i }));
    fireEvent.click(
      within(screen.getByTestId("goal-form-Hinzufügen")).getByRole("button", {
        name: /^Hinzufügen$/,
      })
    );

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Fehler",
          description: "Create kaputt",
          variant: "destructive",
        })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Bearbeitung starten" }));
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Fehler",
          description: "Update kaputt",
          variant: "destructive",
        })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /L.schen/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Fehler",
          description: "Delete kaputt",
          variant: "destructive",
        })
      );
    });
  });
});
