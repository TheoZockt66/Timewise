import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { KeywordSelector } from "@/components/ui/KeywordSelector";
import { buildKeyword } from "../../factories/keywords";

describe("KeywordSelector", () => {
  test("shows a loading state", () => {
    render(
      <KeywordSelector
        keywords={[]}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        isLoading
      />
    );

    expect(screen.getByText(/Keywords werden geladen/i)).toBeInTheDocument();
  });

  test("shows an empty state when no keywords are available", () => {
    render(
      <KeywordSelector
        keywords={[]}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Keine Keywords verf/i)).toBeInTheDocument();
    expect(screen.getByText(/Erstelle zuerst/i)).toBeInTheDocument();
  });

  test("emits updated ids when a keyword is selected and deselected", () => {
    const onSelectionChange = vi.fn();
    const keyword = buildKeyword({ id: "keyword-1", label: "Mathe" });

    const { rerender } = render(
      <KeywordSelector
        keywords={[keyword]}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Mathe" }));

    expect(onSelectionChange).toHaveBeenCalledWith(["keyword-1"]);

    rerender(
      <KeywordSelector
        keywords={[keyword]}
        selectedIds={["keyword-1"]}
        onSelectionChange={onSelectionChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Mathe" }));

    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  test("renders selected keyword badges and ignores unknown selected ids", () => {
    render(
      <KeywordSelector
        keywords={[buildKeyword({ id: "keyword-1", label: "Mathe" })]}
        selectedIds={["keyword-1", "missing-keyword"]}
        onSelectionChange={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Mathe" })).toBeInTheDocument();
    expect(screen.queryByText("missing-keyword")).not.toBeInTheDocument();
  });

  test("renders the error alert when a validation error exists", () => {
    render(
      <KeywordSelector
        keywords={[buildKeyword()]}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        error="Bitte waehle mindestens ein Keyword."
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Bitte waehle mindestens ein Keyword."
    );
  });
});
