import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KeywordBarChart from "@/components/stats/KeywordBarChart";

const tickFormatterResults: string[] = [];

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive">{children}</div>
  ),
  BarChart: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data: unknown[];
  }) => <div data-testid="bar-chart">{data.length}{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar">{children}</div>
  ),
  Cell: ({
    fill,
    stroke,
    strokeWidth,
  }: {
    fill: string;
    stroke?: string;
    strokeWidth?: number;
  }) => (
    <span
      data-testid="cell"
      data-fill={fill}
      data-stroke={stroke}
      data-stroke-width={strokeWidth}
    >
      {fill}
    </span>
  ),
  XAxis: ({
    label,
    tickFormatter,
  }: {
    label: { value: string };
    tickFormatter: (value: string) => string;
  }) => {
    tickFormatterResults.push(tickFormatter("ABCDEFGHIJKLMNOPQRST"));
    tickFormatterResults.push(tickFormatter("Kurz"));
    return <span data-testid="x-axis">{label.value}</span>;
  },
  YAxis: ({ label }: { label: { value: string } }) => (
    <span data-testid="y-axis">{label.value}</span>
  ),
  Tooltip: () => <span data-testid="tooltip">tooltip</span>,
}));

describe("KeywordBarChart", () => {
  test("renders one colored cell per keyword and chart labels", () => {
    tickFormatterResults.length = 0;

    render(
      <KeywordBarChart
        data={[
          {
            keyword_id: "keyword-1",
            keyword_label: "Mathe",
            keyword_color: "#7700F4",
            minutes: 60,
          },
          {
            keyword_id: "keyword-2",
            keyword_label: "Physik",
            keyword_color: "#00957F",
            minutes: 30,
          },
        ]}
      />
    );

    expect(screen.getByTestId("x-axis")).toHaveTextContent("Keyword");
    expect(screen.getByTestId("y-axis")).toHaveTextContent("Minuten");
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    expect(screen.getAllByTestId("cell")).toHaveLength(2);
    expect(screen.getByText("#7700F4")).toBeInTheDocument();
    expect(screen.getByText("#00957F")).toBeInTheDocument();
    expect(tickFormatterResults[0]).toContain("ABCDEFGHIJKLMNOP");
    expect(tickFormatterResults[0]).not.toBe("ABCDEFGHIJKLMNOPQRST");
    expect(tickFormatterResults[1]).toBe("Kurz");
  });

  test("adds a visible stroke for very light keyword colors", () => {
    render(
      <KeywordBarChart
        data={[
          {
            keyword_id: "keyword-1",
            keyword_label: "Deutsch",
            keyword_color: "#FFFFFF",
            minutes: 15,
          },
          {
            keyword_id: "keyword-2",
            keyword_label: "Mathe",
            keyword_color: "#7700F4",
            minutes: 60,
          },
        ]}
      />
    );

    const cells = screen.getAllByTestId("cell");

    expect(cells[0]).toHaveAttribute("data-stroke", "#cfcfcf");
    expect(cells[0]).toHaveAttribute("data-stroke-width", "1");
    expect(cells[1]).toHaveAttribute("data-stroke", "none");
    expect(cells[1]).toHaveAttribute("data-stroke-width", "0");
  });
});
