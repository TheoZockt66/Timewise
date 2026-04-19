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

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    fireEvent.click(screen.getByRole("button", { name: /bernehmen/i }));

    expect(onChange).toHaveBeenCalledWith(["keyword-2"]);
  });

  test("restores the original selection when the dropdown is canceled", () => {
    const onChange = vi.fn();

    render(
      <KeywordSelect
        keywords={[
          buildKeyword({ id: "keyword-1", label: "Mathe" }),
          buildKeyword({ id: "keyword-2", label: "Physik", color: "#00957F" }),
        ]}
        selectedIds={["keyword-1"]}
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText("Keyword suchen...");

    fireEvent.focus(input);

    let checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();

    fireEvent.click(checkboxes[2]);
    fireEvent.click(screen.getByRole("button", { name: /abbrechen/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: /abbrechen/i })
    ).not.toBeInTheDocument();

    fireEvent.focus(input);

    checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).not.toBeChecked();
  });

  test("selects only the filtered keywords and closes the dropdown on outside clicks", () => {
    const onChange = vi.fn();

    render(
      <KeywordSelect
        keywords={[
          buildKeyword({ id: "keyword-1", label: "Mathe" }),
          buildKeyword({ id: "keyword-2", label: "Physik", color: "#00957F" }),
          buildKeyword({ id: "keyword-3", label: "Physik LK", color: "#22C55E" }),
        ]}
        selectedIds={[]}
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText("Keyword suchen...");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "phy" } });

    let checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.mouseDown(document.body);

    expect(
      screen.queryByRole("button", { name: /abbrechen/i })
    ).not.toBeInTheDocument();

    fireEvent.focus(input);

    checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).not.toBeChecked();

    fireEvent.click(checkboxes[0]);
    fireEvent.click(screen.getByRole("button", { name: /bernehmen/i }));

    expect(onChange).toHaveBeenCalledWith(["keyword-2", "keyword-3"]);
  });

  test("can deselect a single keyword before confirming", () => {
    const onChange = vi.fn();

    render(
      <KeywordSelect
        keywords={[
          buildKeyword({ id: "keyword-1", label: "Mathe" }),
          buildKeyword({ id: "keyword-2", label: "Physik", color: "#00957F" }),
        ]}
        selectedIds={["keyword-1", "keyword-2"]}
        onChange={onChange}
      />
    );

    fireEvent.focus(screen.getByPlaceholderText("Keyword suchen..."));

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[2]).toBeChecked();

    fireEvent.click(checkboxes[2]);
    fireEvent.click(screen.getByRole("button", { name: /bernehmen/i }));

    expect(onChange).toHaveBeenCalledWith(["keyword-1"]);
  });

  test("can clear the filtered selection through the select-all checkbox", () => {
    const onChange = vi.fn();

    render(
      <KeywordSelect
        keywords={[
          buildKeyword({ id: "keyword-1", label: "Mathe" }),
          buildKeyword({ id: "keyword-2", label: "Physik", color: "#00957F" }),
        ]}
        selectedIds={["keyword-2"]}
        onChange={onChange}
      />
    );

    const input = screen.getByPlaceholderText("Keyword suchen...");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "phy" } });

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeChecked();

    fireEvent.click(checkboxes[0]);
    fireEvent.click(screen.getByRole("button", { name: /bernehmen/i }));

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
