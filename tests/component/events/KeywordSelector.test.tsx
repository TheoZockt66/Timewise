import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { KeywordSelector } from "@/components/events/KeywordSelector";
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

    expect(screen.getByText("Tags werden geladen...")).toBeInTheDocument();
  });

  test("emits updated ids when a keyword is selected", () => {
    const onSelectionChange = vi.fn();

    render(
      <KeywordSelector
        keywords={[buildKeyword({ id: "keyword-1", label: "Mathe" })]}
        selectedIds={[]}
        onSelectionChange={onSelectionChange}
      />
    );

    fireEvent.click(screen.getByText("Mathe"));

    expect(onSelectionChange).toHaveBeenCalledWith(["keyword-1"]);
  });
});
