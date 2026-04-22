import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import DayTimeline from "@/components/stats/DayTimeline";
import { buildEventWithKeywords } from "../../factories/events";
import { buildKeyword } from "../../factories/keywords";

describe("DayTimeline", () => {
  test("renders all 24 hourly markers", () => {
    render(
      <DayTimeline
        events={[]}
        startDate="2026-04-10"
        endDate="2026-04-10"
      />
    );

    expect(screen.getByText("00:00")).toBeInTheDocument();
    expect(screen.getByText("23:00")).toBeInTheDocument();
    expect(screen.getAllByText(/:00$/)).toHaveLength(24);
  });

  test("positions event blocks based on the start time and duration", () => {
    render(
      <DayTimeline
        events={[
          buildEventWithKeywords({
            start_time: "2026-04-10T09:00:00",
            duration_minutes: 90,
            end_time: "2026-04-10T10:30:00",
            keywords: [
              buildKeyword({
                label: "Physik",
                color: "#00957F",
              }),
            ],
          }),
        ]}
        startDate="2026-04-10"
        endDate="2026-04-10"
      />
    );

    const block = screen.getByText("Physik");

    expect(block).toHaveStyle({
      top: "37.5%",
      height: "6.25%",
      backgroundColor: "rgb(0, 149, 127)",
    });
  });

  test("falls back to the default accent color when an event has no keyword", () => {
    const { container } = render(
      <DayTimeline
        events={[
          {
            id: "event-1",
            user_id: "user-1",
            start_time: "2026-04-10T00:30:00",
            end_time: "2026-04-10T01:00:00",
            created_at: "2026-04-10T01:00:00",
            duration_minutes: 30,
            keywords: [],
          },
        ]}
        startDate="2026-04-10"
        endDate="2026-04-10"
      />
    );

    const blocks = container.querySelectorAll(".left-16");

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toHaveStyle({
      top: "2.083333333333333%",
      height: "2.083333333333333%",
      backgroundColor: "rgb(119, 0, 244)",
    });
    expect(blocks[0]).toHaveTextContent("");
  });

  test("clips a multi-day event to the selected day", () => {
    const { container } = render(
      <DayTimeline
        events={[
          buildEventWithKeywords({
            start_time: "2026-04-09T23:00:00",
            end_time: "2026-04-10T01:30:00",
            duration_minutes: 150,
            keywords: [
              buildKeyword({
                label: "Mathe",
                color: "#7700F4",
              }),
            ],
          }),
        ]}
        startDate="2026-04-10"
        endDate="2026-04-10"
      />
    );

    const blocks = container.querySelectorAll(".left-16");

    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toHaveStyle({
      top: "0%",
      height: "6.25%",
    });
    expect(blocks[0]).toHaveTextContent("Mathe");
  });
});
