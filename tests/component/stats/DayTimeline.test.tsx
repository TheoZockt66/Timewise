import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import DayTimeline from "@/components/stats/DayTimeline";
import { buildEventWithKeywords } from "../../factories/events";
import { buildKeyword } from "../../factories/keywords";

describe("DayTimeline", () => {
  test("renders all 24 hourly markers", () => {
    render(<DayTimeline events={[]} />);

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
            keywords: [
              buildKeyword({
                label: "Physik",
                color: "#00957F",
              }),
            ],
          }),
        ]}
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
            start_time: "2026-04-10T00:30:00",
            duration_minutes: 30,
          },
        ]}
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
});
