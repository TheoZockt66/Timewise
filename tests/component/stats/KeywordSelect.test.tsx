import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import KeywordSelect from "@/components/stats/KeywordSelect";
import { buildKeyword } from "../../factories/keywords";

describe("stats/KeywordSelect", () => {
  test("filters keywords and only applies the temporary selection on confirm", () => {
    const onChange = vi.fn();

    render(
      <KeywordSelect
        keywords={[
          buildKeyword({ id: "keyword-1", label: "Mathe" }),
          buildKeyword({ id: "keyword-2", label: "Physik", color: "#00957F" }),
        ]}
        selectedIds={[]}
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText("Keyword suchen...");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "phy" } });

    expect(screen.getByText("Physik")).toBeInTheDocument();
    expect(screen.queryByText("Mathe")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Übernehmen" }));

    expect(onChange).toHaveBeenCalledWith(["keyword-2"]);
  });
});
