import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import TimelineLineChart from "@/components/stats/TimelineLineChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({
    dataKey,
    stroke,
  }: {
    dataKey: string;
    stroke?: string;
  }) => (
    <span data-testid={`line-${dataKey}`} data-stroke={stroke}>
      {dataKey}
    </span>
  ),
  XAxis: ({ label }: { label: { value: string } }) => (
    <span data-testid="x-axis">{label.value}</span>
  ),
  YAxis: ({ label }: { label: { value: string } }) => (
    <span data-testid="y-axis">{label.value}</span>
  ),
  Tooltip: () => <span data-testid="tooltip">tooltip</span>,
}));

describe("TimelineLineChart", () => {
  test("uses the calendar-week label for KW series", () => {
    render(
      <TimelineLineChart
        data={[{ period: "KW 15", total: 120 }]}
        keywordColors={{}}
        selectedKeywords={[]}
      />
    );

    expect(screen.getByTestId("x-axis")).toHaveTextContent("Kalenderwoche");
    expect(screen.getByTestId("y-axis")).toHaveTextContent("Minuten");
  });

  test("uses the clock label for hourly series", () => {
    render(
      <TimelineLineChart
        data={[{ period: "9:00", total: 60 }]}
        keywordColors={{}}
        selectedKeywords={[]}
      />
    );

    expect(screen.getByTestId("x-axis")).toHaveTextContent("Uhrzeit");
  });

  test("falls back to weekday labels for other periods", () => {
    render(
      <TimelineLineChart
        data={[{ period: "Mo", total: 45 }]}
        keywordColors={{}}
        selectedKeywords={[]}
      />
    );

    expect(screen.getByTestId("x-axis")).toHaveTextContent("Wochentag");
  });

  test("renders keyword lines only for selected keywords and uses their colors", () => {
    render(
      <TimelineLineChart
        data={[
          {
            period: "KW 15",
            total: 120,
            Mathe: 120,
            Physik: 30,
          },
        ]}
        keywordColors={{ Mathe: "#00957F" }}
        selectedKeywords={["Mathe"]}
      />
    );

    expect(screen.getByTestId("line-total")).toHaveAttribute(
      "data-stroke",
      "#7700F4"
    );
    expect(screen.getByTestId("line-Mathe")).toHaveAttribute(
      "data-stroke",
      "#00957F"
    );
    expect(screen.queryByTestId("line-Physik")).not.toBeInTheDocument();
  });
});
