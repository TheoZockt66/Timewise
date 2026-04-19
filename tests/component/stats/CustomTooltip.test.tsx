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

  test("falls back to the payload data key and a default value", () => {
    render(
      <BarTooltip
        active
        payload={[{ dataKey: "duration" }]}
      />
    );

    expect(screen.getByText("duration")).toBeInTheDocument();
    expect(screen.getByText("0 Minuten")).toBeInTheDocument();
  });
});

describe("LineTooltip", () => {
  test("renders nothing when the tooltip is inactive", () => {
    const { container } = render(<LineTooltip active={false} payload={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  test("renders formatted weekday labels and keyword rows for active tooltips", () => {
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

  test("falls back to plain labels, data keys and a visible border for very light colors", () => {
    const { container } = render(
      <LineTooltip
        active
        label="KW 15"
        payload={[
          { dataKey: "Biologie", color: "#ffffff" },
          {},
        ]}
      />
    );

    expect(screen.getByText("KW 15")).toBeInTheDocument();
    expect(screen.getByText("Biologie")).toBeInTheDocument();
    expect(screen.getByText("Wert")).toBeInTheDocument();
    expect(screen.getAllByText("0 Minuten")).toHaveLength(2);

    const dots = Array.from(
      container.querySelectorAll("span.h-3.w-3.rounded-full")
    );

    expect(dots[0]).toHaveStyle({
      backgroundColor: "#ffffff",
      borderColor: "#cfcfcf",
    });
    expect(dots[1]).toHaveStyle({ backgroundColor: "#7700F4" });
  });
});
