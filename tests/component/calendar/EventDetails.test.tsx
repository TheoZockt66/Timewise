import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EventDetails } from "@/components/calendar/EventDetails";
import { deleteEvent } from "@/lib/services/event.service";
import { useCalendar } from "@/hooks/useCalendar";
import { buildEventWithKeywords } from "../../factories/events";
import { buildKeyword } from "../../factories/keywords";

const toastMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("@/hooks/useCalendar", () => ({
  useCalendar: vi.fn(),
}));

vi.mock("@/lib/services/event.service", () => ({
  deleteEvent: vi.fn(),
}));

vi.mock("@/components/events/EventForm", () => ({
  EventForm: ({
    onSuccess,
    onCancel,
  }: {
    onSuccess?: () => void;
    onCancel?: () => void;
  }) => (
    <div>
      <button type="button" onClick={onSuccess}>
        Form speichern
      </button>
      <button type="button" onClick={onCancel}>
        Form abbrechen
      </button>
    </div>
  ),
}));

const mockedDeleteEvent = vi.mocked(deleteEvent);
const mockedUseCalendar = vi.mocked(useCalendar);

describe("EventDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("confirm", vi.fn(() => true));
    mockedUseCalendar.mockReturnValue({
      events: [],
      isLoading: false,
      error: null,
      fetchEvents: vi.fn(),
    });
  });

  test("renders the selected event details with duration and keywords", () => {
    render(
      <EventDetails
        event={buildEventWithKeywords({
          label: "Physikblock",
          description: "Kapitel 4",
          start_time: "2026-04-10T09:00:00",
          end_time: "2026-04-10T10:30:00",
          keywords: [
            buildKeyword(),
            buildKeyword({
              id: "keyword-2",
              label: "Physik",
              color: "#00957F",
            }),
          ],
        })}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText("Physikblock")).toBeInTheDocument();
    expect(screen.getByText("Kapitel 4")).toBeInTheDocument();
    expect(screen.getByText("1 Stunde 30 Minuten")).toBeInTheDocument();
    expect(screen.getByText("Mathe")).toBeInTheDocument();
    expect(screen.getByText("Physik")).toBeInTheDocument();
  });

  test("switches into edit mode and wires the success callback back to the parent", () => {
    const onUpdate = vi.fn();

    render(
      <EventDetails
        event={buildEventWithKeywords()}
        onClose={vi.fn()}
        onUpdate={onUpdate}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten" }));
    fireEvent.click(screen.getByRole("button", { name: "Form speichern" }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
  });

  test("deletes the event and closes the modal after a confirmed success", async () => {
    const onClose = vi.fn();
    const onUpdate = vi.fn();
    mockedDeleteEvent.mockResolvedValue({
      data: null,
      error: null,
    });

    render(
      <EventDetails
        event={buildEventWithKeywords({ id: "event-1" })}
        onClose={onClose}
        onUpdate={onUpdate}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /L.schen/i }));

    await waitFor(() => {
      expect(mockedDeleteEvent).toHaveBeenCalledWith("event-1");
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Erfolgreich",
      })
    );
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
