import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import CustomTooltip from "@/components/stats/CustomTooltip";

describe("CustomTooltip", () => {
  test("renders nothing when the tooltip is inactive", () => {
    const { container } = render(<CustomTooltip active={false} payload={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  test("renders the current label and minutes when active", () => {
    render(
      <CustomTooltip
        active
        label="KW 15"
        payload={[{ value: 90 }]}
      />
    );

    expect(screen.getByText("KW 15")).toBeInTheDocument();
    expect(screen.getByText("90 Minuten")).toBeInTheDocument();
  });
});
