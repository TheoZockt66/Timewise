import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TimeRangePicker } from "@/components/events/TimeRangePicker";

describe("TimeRangePicker", () => {
  test("shows the calculated duration and normalizes datetime-local values to ISO seconds", () => {
    const onStartChange = vi.fn();
    const onEndChange = vi.fn();

    render(
      <TimeRangePicker
        startTime="2026-04-10T09:00:00"
        endTime="2026-04-10T10:30:00"
        onStartChange={onStartChange}
        onEndChange={onEndChange}
      />
    );

    expect(screen.getByText("90 Minuten")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Startzeit"), {
      target: { value: "2026-04-10T08:15" },
    });
    fireEvent.change(screen.getByLabelText("Endzeit"), {
      target: { value: "2026-04-10T09:45" },
    });

    expect(onStartChange).toHaveBeenCalledWith("2026-04-10T08:15:00");
    expect(onEndChange).toHaveBeenCalledWith("2026-04-10T09:45:00");
  });

  test("renders validation feedback as an alert", () => {
    render(
      <TimeRangePicker
        startTime="2026-04-10T09:00:00"
        endTime="2026-04-10T08:30:00"
        onStartChange={vi.fn()}
        onEndChange={vi.fn()}
        error="Die Endzeit muss nach der Startzeit liegen."
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Die Endzeit muss nach der Startzeit liegen."
    );
  });
});
