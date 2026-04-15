import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import StatsPage from "@/app/(dashboard)/stats/page";
import { useStats } from "@/hooks/useStats";
import { buildKeyword } from "../../factories/keywords";

const fetchMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: ({
    priority: _priority,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => (
    <img {...props} />
  ),
}));

vi.mock("@/hooks/useStats", () => ({
  useStats: vi.fn(),
}));

vi.mock("@/components/stats/KeywordBarChart", () => ({
  default: ({ data }: { data: unknown[] }) => (
    <div data-testid="keyword-bar-chart">{data.length}</div>
  ),
}));

vi.mock("@/components/stats/TimelineLineChart", () => ({
  default: ({ data }: { data: unknown[] }) => (
    <div data-testid="timeline-chart">{data.length}</div>
  ),
}));

vi.mock("@/components/stats/KeywordSelect", () => ({
  default: ({
    onChange,
  }: {
    onChange: (ids: string[]) => void;
  }) => (
    <button type="button" onClick={() => onChange(["keyword-2"])}>
      Keyword anwenden
    </button>
  ),
}));

vi.mock("@/components/stats/StatsFilterBar", () => ({
  default: ({
    granularity,
    keywordIds,
    onChange,
  }: {
    granularity: string;
    keywordIds: string[];
    onChange: (values: {
      startDate: string;
      endDate: string;
      granularity: "day" | "week" | "month";
      keywordIds: string[];
    }) => void;
  }) => (
    <div>
      <span data-testid="current-granularity">{granularity}</span>
      <button
        type="button"
        onClick={() =>
          onChange({
            startDate: "2026-04-15",
            endDate: "2026-04-15",
            granularity: "month",
            keywordIds,
          })
        }
      >
        Monat setzen
      </button>
    </div>
  ),
}));

vi.mock("@/components/ui/DateNavigation", () => ({
  default: ({
    onPrev,
    onNext,
  }: {
    onPrev: () => void;
    onNext: () => void;
  }) => (
    <div>
      <button type="button" onClick={onPrev}>
        Zurück
      </button>
      <button type="button" onClick={onNext}>
        Weiter
      </button>
    </div>
  ),
}));

const mockedUseStats = vi.mocked(useStats);

describe("StatsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T10:00:00.000Z"));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test("renders aggregated statistics and updates filters through the controls", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: [buildKeyword()], error: null }),
    });

    mockedUseStats.mockImplementation((filters) => ({
      data: [
        {
          period: "14.04.2026 - 20.04.2026",
          total_minutes: 120,
          by_keyword: [
            {
              keyword_id: "keyword-1",
              keyword_label: "Mathe",
              keyword_color: "#7700F4",
              minutes: 120,
            },
          ],
        },
      ],
      timelineData: [{ period: "KW 15", total_minutes: 120 }],
      loading: false,
      error: null,
      refetch: async () => undefined,
    }));

    render(<StatsPage />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText("Statistiken")).toBeInTheDocument();
    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      startDate: "2026-04-13",
      endDate: "2026-04-15",
      granularity: "week",
      keywordIds: [],
    });
    expect(screen.getByText("Mathe")).toBeInTheDocument();
    expect(screen.getByTestId("keyword-bar-chart")).toHaveTextContent("1");
    expect(screen.getByTestId("timeline-chart")).toHaveTextContent("1");

    fireEvent.click(screen.getByRole("button", { name: "Keyword anwenden" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      keywordIds: ["keyword-2"],
    });

    fireEvent.click(screen.getByRole("button", { name: "Monat setzen" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      granularity: "month",
    });

    fireEvent.click(screen.getByRole("button", { name: "Zurück" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      granularity: "month",
    });
  });

  test("shows the error state from useStats", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: [], error: null }),
    });
    mockedUseStats.mockReturnValue({
      data: [],
      timelineData: [],
      loading: false,
      error: "Statistiken konnten nicht geladen werden.",
      refetch: async () => undefined,
    });

    render(<StatsPage />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(
      screen.getByText("Statistiken konnten nicht geladen werden.")
    ).toBeInTheDocument();
  });
});
