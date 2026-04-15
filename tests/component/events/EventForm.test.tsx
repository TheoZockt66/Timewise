import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EventForm } from "@/components/events/EventForm";
import {
  createEvent,
  fetchEvents,
  updateEvent,
} from "@/lib/services/event.service";
import { buildKeyword } from "../../factories/keywords";

const toastMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

vi.mock("@/lib/services/event.service", () => ({
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
  fetchEvents: vi.fn(),
}));

vi.mock("@/components/events/TimeRangePicker", () => ({
  TimeRangePicker: ({
    startTime,
    endTime,
    onStartChange,
    onEndChange,
    error,
  }: {
    startTime: string;
    endTime: string;
    onStartChange: (value: string) => void;
    onEndChange: (value: string) => void;
    error?: string;
  }) => (
    <div>
      <input
        aria-label="Startzeit"
        value={startTime}
        onChange={(event) => onStartChange(event.target.value)}
      />
      <input
        aria-label="Endzeit"
        value={endTime}
        onChange={(event) => onEndChange(event.target.value)}
      />
      <div data-testid="time-error">{error ?? ""}</div>
    </div>
  ),
}));

vi.mock("@/components/events/KeywordSelector", () => ({
  KeywordSelector: ({
    selectedIds,
    onSelectionChange,
    error,
  }: {
    selectedIds: string[];
    onSelectionChange: (value: string[]) => void;
    error?: string;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onSelectionChange(selectedIds.length > 0 ? [] : ["keyword-1"])
        }
      >
        Keywords toggeln
      </button>
      <div data-testid="keyword-error">{error ?? ""}</div>
    </div>
  ),
}));

const mockedCreateEvent = vi.mocked(createEvent);
const mockedFetchEvents = vi.mocked(fetchEvents);
const mockedUpdateEvent = vi.mocked(updateEvent);

describe("EventForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: [buildKeyword()],
          error: null,
        }),
      })
    );
    mockedFetchEvents.mockResolvedValue({
      data: [],
      error: null,
    });
    mockedUpdateEvent.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  test("shows validation feedback and blocks submit without keywords", async () => {
    render(
      <EventForm
        selectedRange={{
          start: "2026-04-10T09:00:00.000Z",
          end: "2026-04-10T10:00:00.000Z",
        }}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Speichern" })).toBeEnabled()
    );

    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(screen.getByTestId("keyword-error")).toHaveTextContent(
        "mindestens ein Keyword"
      );
    });
    expect(mockedCreateEvent).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Validierungsfehler",
      })
    );
  });

  test("submits a new event and triggers onSuccess when validation passes", async () => {
    const onSuccess = vi.fn();

    mockedCreateEvent.mockResolvedValue({
      data: null,
      error: null,
    });

    render(
      <EventForm
        selectedRange={{
          start: "2026-04-10T09:00:00.000Z",
          end: "2026-04-10T10:00:00.000Z",
        }}
        onSuccess={onSuccess}
      />
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Speichern" })).toBeEnabled()
    );

    fireEvent.change(screen.getByLabelText("Titel (optional)"), {
      target: { value: "Matheblock" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Keywords toggeln" }));
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(mockedCreateEvent).toHaveBeenCalledWith({
        start_time: "2026-04-10T09:00:00.000Z",
        end_time: "2026-04-10T10:00:00.000Z",
        keyword_ids: ["keyword-1"],
        label: "Matheblock",
        description: undefined,
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Erfolg",
      })
    );
  });
});
