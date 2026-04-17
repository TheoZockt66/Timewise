import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import {
  BarTooltip,
  LineTooltip,
} from "@/components/stats/CustomTooltip";

describe("BarTooltip", () => {
  test("renders nothing when the tooltip is inactive", () => {
    const { container } = render(<BarTooltip active={false} payload={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  test("renders the current label and minutes when active", () => {
    render(
      <BarTooltip
        active
        label="KW 15"
        payload={[{ value: 90, name: "Mathe" }]}
      />
    );

    expect(screen.getByText("KW 15")).toBeInTheDocument();
    expect(screen.getByText("90 Minuten")).toBeInTheDocument();
  });
});

describe("LineTooltip", () => {
  test("renders formatted labels and keyword rows for active tooltips", () => {
    render(
      <LineTooltip
        active
        label="Mo"
        payload={[
          { name: "total", value: 120, color: "#7700F4" },
          { name: "Mathe", value: 45, color: "#00957F" },
        ]}
      />
    );

    expect(screen.getByText("Montag")).toBeInTheDocument();
    expect(screen.getByText("Gesamtlernzeit")).toBeInTheDocument();
    expect(screen.getByText("Mathe")).toBeInTheDocument();
    expect(screen.getByText("120 Minuten")).toBeInTheDocument();
    expect(screen.getByText("45 Minuten")).toBeInTheDocument();
  });
});
