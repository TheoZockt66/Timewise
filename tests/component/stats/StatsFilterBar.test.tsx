import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import StatsFilterBar from "@/components/stats/StatsFilterBar";

describe("StatsFilterBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("updates date inputs while preserving the remaining filters", () => {
    const onChange = vi.fn();
    const { container } = render(
      <StatsFilterBar
        startDate="2026-04-13"
        endDate="2026-04-19"
        granularity="week"
        keywordIds={["keyword-1"]}
        onChange={onChange}
      />
    );

    const inputs = container.querySelectorAll('input[type="date"]');

    fireEvent.change(inputs[0], { target: { value: "2026-04-10" } });
    fireEvent.change(inputs[1], { target: { value: "2026-04-20" } });

    expect(onChange).toHaveBeenNthCalledWith(1, {
      startDate: "2026-04-10",
      endDate: "2026-04-19",
      granularity: "week",
      keywordIds: ["keyword-1"],
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      startDate: "2026-04-13",
      endDate: "2026-04-20",
      granularity: "week",
      keywordIds: ["keyword-1"],
    });
  });

  test("builds preset ranges for day, week and month", () => {
    const onChange = vi.fn();

    render(
      <StatsFilterBar
        startDate="2026-04-13"
        endDate="2026-04-19"
        granularity="week"
        keywordIds={[]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Tag" }));
    fireEvent.click(screen.getByRole("button", { name: "Woche" }));
    fireEvent.click(screen.getByRole("button", { name: "Monat" }));

    expect(onChange).toHaveBeenNthCalledWith(1, {
      startDate: "2026-04-15",
      endDate: "2026-04-15",
      granularity: "day",
      keywordIds: [],
    });
    expect(onChange).toHaveBeenNthCalledWith(2, {
      startDate: "2026-04-13",
      endDate: "2026-04-15",
      granularity: "week",
      keywordIds: [],
    });
    expect(onChange).toHaveBeenNthCalledWith(3, {
      startDate: "2026-04-01",
      endDate: "2026-04-15",
      granularity: "month",
      keywordIds: [],
    });
  });
});
