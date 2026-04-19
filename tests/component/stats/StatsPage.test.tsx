import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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
  default: ({
    data,
    selectedKeywords,
  }: {
    data: unknown[];
    selectedKeywords: string[];
  }) => (
    <div data-testid="timeline-chart">
      {data.length}:{selectedKeywords.join(",")}
    </div>
  ),
}));

vi.mock("@/components/stats/DayTimeline", () => ({
  default: ({ events }: { events?: unknown[] }) => (
    <div data-testid="day-timeline">{events?.length ?? 0}</div>
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
    keywordIds,
    onChange,
  }: {
    keywordIds: string[];
    onChange: (values: {
      startDate: string;
      endDate: string;
      granularity: "day" | "week" | "month";
      keywordIds: string[];
    }) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onChange({
            startDate: "2026-04-15",
            endDate: "2026-04-15",
            granularity: "day",
            keywordIds,
          })
        }
      >
        Tag setzen
      </button>
      <button
        type="button"
        onClick={() =>
          onChange({
            startDate: "2026-04-15",
            endDate: "2026-04-15",
            granularity: "week",
            keywordIds,
          })
        }
      >
        Woche setzen
      </button>
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
        Zurueck
      </button>
      <button type="button" onClick={onNext}>
        Weiter
      </button>
    </div>
  ),
}));

const mockedUseStats = vi.mocked(useStats);

function buildStatsState() {
  return {
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
    timelineData: [{ period: "KW 15", total: 120 }],
    events: [],
    loading: false,
    error: null,
    refetch: async () => undefined,
  };
}

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

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

  test("renders aggregated statistics, loads keywords and updates filters through the controls", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        data: [
          buildKeyword(),
          buildKeyword({
            id: "keyword-2",
            label: "Physik",
            color: "#00957F",
          }),
        ],
        error: null,
      }),
    });

    mockedUseStats.mockImplementation(() => buildStatsState());

    render(<StatsPage />);

    await flushEffects();

    expect(fetchMock).toHaveBeenCalledWith("/api/keywords");
    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      startDate: "2026-04-13",
      endDate: "2026-04-15",
      granularity: "week",
      keywordIds: [],
    });

    expect(screen.getByText("Statistiken")).toBeInTheDocument();
    expect(screen.getByText("Mathe")).toBeInTheDocument();
    expect(screen.getByText("Alle Keywords ausgewählt")).toBeInTheDocument();
    expect(screen.getByTestId("keyword-bar-chart")).toHaveTextContent("1");
    expect(screen.getByTestId("timeline-chart")).toHaveTextContent("1:");

    fireEvent.click(screen.getByRole("button", { name: "Keyword anwenden" }));

    await flushEffects();

    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      keywordIds: ["keyword-2"],
    });
    expect(screen.getByText("Physik")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-chart")).toHaveTextContent("1:Physik");

    fireEvent.click(screen.getByRole("button", { name: "Tag setzen" }));

    await flushEffects();

    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      startDate: "2026-04-15",
      endDate: "2026-04-15",
      granularity: "day",
    });
    expect(screen.getByTestId("day-timeline")).toHaveTextContent("0");

    fireEvent.click(screen.getByRole("button", { name: "Zurueck" }));

    await flushEffects();

    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      startDate: "2026-04-14",
      endDate: "2026-04-14",
      granularity: "day",
    });

    fireEvent.click(screen.getByRole("button", { name: "Woche setzen" }));

    await flushEffects();

    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      startDate: "2026-04-13",
      endDate: "2026-04-19",
      granularity: "week",
    });

    fireEvent.click(screen.getByRole("button", { name: "Weiter" }));

    await flushEffects();

    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      startDate: "2026-04-20",
      endDate: "2026-04-26",
      granularity: "week",
    });

    fireEvent.click(screen.getByRole("button", { name: "Monat setzen" }));

    await flushEffects();

    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      granularity: "month",
    });

    fireEvent.click(screen.getByRole("button", { name: "Zurueck" }));

    await flushEffects();

    expect(mockedUseStats.mock.lastCall?.[0]).toMatchObject({
      startDate: "2026-03-01",
      endDate: "2026-03-31",
      granularity: "month",
    });
  });

  test("shows the loading state from useStats", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: [], error: null }),
    });
    mockedUseStats.mockReturnValue({
      data: [],
      timelineData: [],
      events: [],
      loading: true,
      error: null,
      refetch: async () => undefined,
    });

    render(<StatsPage />);

    await flushEffects();

    expect(screen.getByText("Lade Daten...")).toBeInTheDocument();
  });

  test("shows the empty state when no statistic data is available", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: [], error: null }),
    });
    mockedUseStats.mockReturnValue({
      data: [],
      timelineData: [],
      events: [],
      loading: false,
      error: null,
      refetch: async () => undefined,
    });

    render(<StatsPage />);

    await flushEffects();

    expect(screen.getByText("Keine Daten vorhanden")).toBeInTheDocument();
  });

  test("falls back to an empty keyword list when the keyword request has no data payload", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: null, error: null }),
    });
    mockedUseStats.mockReturnValue(buildStatsState());

    render(<StatsPage />);

    await flushEffects();

    fireEvent.click(screen.getByRole("button", { name: "Keyword anwenden" }));

    await flushEffects();

    expect(screen.queryByText("Physik")).not.toBeInTheDocument();
    expect(screen.getByTestId("timeline-chart")).toHaveTextContent("1:");
  });

  test("shows the error state from useStats", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({ data: [], error: null }),
    });
    mockedUseStats.mockReturnValue({
      data: [],
      timelineData: [],
      events: [],
      loading: false,
      error: "Statistiken konnten nicht geladen werden.",
      refetch: async () => undefined,
    });

    render(<StatsPage />);

    await flushEffects();

    expect(
      screen.getByText("Statistiken konnten nicht geladen werden.")
    ).toBeInTheDocument();
  });
});
