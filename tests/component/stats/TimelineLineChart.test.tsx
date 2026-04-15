import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TimelineLineChart from "@/components/stats/TimelineLineChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <span data-testid="line">line</span>,
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
      <TimelineLineChart data={[{ period: "KW 15", total_minutes: 120 }]} />
    );

    expect(screen.getByTestId("x-axis")).toHaveTextContent("Kalenderwoche");
    expect(screen.getByTestId("y-axis")).toHaveTextContent("Minuten");
  });

  test("uses the clock label for hourly series", () => {
    render(
      <TimelineLineChart data={[{ period: "9:00", total_minutes: 60 }]} />
    );

    expect(screen.getByTestId("x-axis")).toHaveTextContent("Uhrzeit");
  });

  test("falls back to weekday labels for other periods", () => {
    render(
      <TimelineLineChart data={[{ period: "Mo", total_minutes: 45 }]} />
    );

    expect(screen.getByTestId("x-axis")).toHaveTextContent("Wochentag");
  });
});
