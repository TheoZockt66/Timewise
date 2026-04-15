import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import KeywordBarChart from "@/components/stats/KeywordBarChart";

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
  Cell: ({ fill }: { fill: string }) => <span data-testid="cell">{fill}</span>,
  XAxis: ({ label }: { label: { value: string } }) => (
    <span data-testid="x-axis">{label.value}</span>
  ),
  YAxis: ({ label }: { label: { value: string } }) => (
    <span data-testid="y-axis">{label.value}</span>
  ),
  Tooltip: () => <span data-testid="tooltip">tooltip</span>,
}));

describe("KeywordBarChart", () => {
  test("renders one colored cell per keyword and chart labels", () => {
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
    expect(screen.getAllByTestId("cell")).toHaveLength(2);
    expect(screen.getByText("#7700F4")).toBeInTheDocument();
    expect(screen.getByText("#00957F")).toBeInTheDocument();
  });
});
