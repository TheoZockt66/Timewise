import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CalendarView from "@/app/(dashboard)/calendar/CalendarView";
import { useCalendar } from "@/hooks/useCalendar";
import calendarEventFixture from "../../fixtures/calendar/calendar-event.json";

vi.mock("@/hooks/useCalendar", () => ({
  useCalendar: vi.fn(),
}));

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

vi.mock("@fullcalendar/react", () => ({
  default: (props: {
    events: Array<{ id: string; title: string }>;
    select: (value: {
      startStr: string;
      endStr: string;
      view: { calendar: { unselect: () => void } };
    }) => void;
    eventClick: (value: { event: { id: string } }) => void;
  }) => (
    <div>
      <div data-testid="calendar-event-count">{props.events.length}</div>
      {props.events.map((event) => (
        <span key={event.id}>{event.title}</span>
      ))}
      <button
        type="button"
        onClick={() =>
          props.select({
            startStr: "2026-04-20T09:00:00.000Z",
            endStr: "2026-04-20T10:00:00.000Z",
            view: {
              calendar: {
                unselect: vi.fn(),
              },
            },
          })
        }
      >
        Zeitraum auswählen
      </button>
      <button
        type="button"
        onClick={() =>
          props.eventClick({
            event: {
              id: props.events[0]?.id ?? "missing-event",
            },
          })
        }
      >
        Termin öffnen
      </button>
    </div>
  ),
}));

vi.mock("@/components/events/EventForm", () => ({
  EventForm: ({
    selectedRange,
  }: {
    selectedRange?: { start: string; end: string };
  }) => (
    <div data-testid="event-form">
      {selectedRange
        ? `${selectedRange.start}__${selectedRange.end}`
        : "event-form"}
    </div>
  ),
}));

vi.mock("@/components/calendar/EventDetails", () => ({
  EventDetails: ({
    event,
  }: {
    event: { id: string };
  }) => <div data-testid="event-details">{event.id}</div>,
}));

const mockedUseCalendar = vi.mocked(useCalendar);
const mockFetchEvents = vi.fn();

describe("CalendarView", () => {
  beforeEach(() => {
    mockFetchEvents.mockReset();
    mockedUseCalendar.mockReturnValue({
      events: [calendarEventFixture],
      isLoading: false,
      error: null,
      fetchEvents: mockFetchEvents,
    });
  });

  test("loads the current month and opens the create modal for a selected range", async () => {
    const now = new Date();
    const expectedStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();
    const expectedEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).toISOString();

    render(<CalendarView />);

    await waitFor(() => expect(mockFetchEvents).toHaveBeenCalledTimes(1));
    expect(mockFetchEvents).toHaveBeenCalledWith(expectedStart, expectedEnd);
    expect(screen.getByText("Physikblock")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zeitraum auswählen" }));

    expect(screen.getByTestId("event-form")).toHaveTextContent(
      "2026-04-20T09:00:00.000Z__2026-04-20T10:00:00.000Z"
    );
    expect(screen.getByText("Neuer Termin")).toBeInTheDocument();
  });

  test("opens the details modal for an existing event", () => {
    render(<CalendarView />);

    fireEvent.click(screen.getByRole("button", { name: "Termin öffnen" }));

    expect(screen.getByTestId("event-details")).toHaveTextContent(
      calendarEventFixture.id
    );
  });
});
