import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EventForm } from "@/components/events/EventForm";
import {
  createEvent,
  fetchEvents,
  updateEvent,
} from "@/lib/services/event.service";
import { buildEventWithKeywords } from "../../factories/events";
import { buildKeyword } from "../../factories/keywords";

const toastMock = vi.fn();
const fetchMock = vi.fn();

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
    isLoading,
  }: {
    selectedIds: string[];
    onSelectionChange: (value: string[]) => void;
    error?: string;
    isLoading?: boolean;
  }) => (
    <div>
      <div data-testid="keyword-loading">{String(Boolean(isLoading))}</div>
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
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({
      json: async () => ({
        data: [buildKeyword()],
        error: null,
      }),
    });
    mockedFetchEvents.mockResolvedValue({
      data: [],
      error: null,
    });
    mockedCreateEvent.mockResolvedValue({
      data: null,
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

  test("shows a destructive toast when keyword loading returns an error payload", async () => {
    fetchMock.mockResolvedValue({
      json: async () => ({
        data: null,
        error: { message: "kaputt" },
      }),
    });

    render(<EventForm />);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Fehler",
          description: "Tags konnten nicht geladen werden.",
          variant: "destructive",
        })
      );
    });
    expect(screen.getByTestId("keyword-loading")).toHaveTextContent("false");
  });

  test("shows a destructive toast when keyword loading throws", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    render(<EventForm />);

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Fehler",
          description: "Tags konnten nicht geladen werden.",
          variant: "destructive",
        })
      );
    });
  });

  test("syncs a selected range that arrives after the initial render", async () => {
    const { rerender } = render(<EventForm />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Speichern" })).toBeEnabled()
    );

    rerender(
      <EventForm
        selectedRange={{
          start: "2026-04-11T09:00:00.000Z",
          end: "2026-04-11T10:00:00.000Z",
        }}
      />
    );

    expect(screen.getByLabelText("Startzeit")).toHaveValue(
      "2026-04-11T09:00:00.000Z"
    );
    expect(screen.getByLabelText("Endzeit")).toHaveValue(
      "2026-04-11T10:00:00.000Z"
    );
  });

  test("submits a new event and triggers onSuccess when validation passes", async () => {
    const onSuccess = vi.fn();

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
        description: "Lernzeit erfasst.",
      })
    );
  });

  test("updates an existing event in edit mode", async () => {
    const onSuccess = vi.fn();
    const initialEvent = buildEventWithKeywords({
      id: "event-1",
      label: "Alt",
      description: "",
      start_time: "2026-04-10T09:00:00.000Z",
      end_time: "2026-04-10T10:00:00.000Z",
      keywords: [buildKeyword()],
    });

    render(<EventForm initialEvent={initialEvent} onSuccess={onSuccess} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Aktualisieren" })).toBeEnabled()
    );

    fireEvent.change(screen.getByLabelText("Titel (optional)"), {
      target: { value: "Neu" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aktualisieren" }));

    await waitFor(() => {
      expect(mockedUpdateEvent).toHaveBeenCalledWith("event-1", {
        start_time: "2026-04-10T09:00:00.000Z",
        end_time: "2026-04-10T10:00:00.000Z",
        keyword_ids: ["keyword-1"],
        label: "Neu",
        description: undefined,
      });
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Erfolg",
        description: "Lernzeit aktualisiert.",
      })
    );
  });

  test("shows a destructive toast when save returns an application error", async () => {
    mockedCreateEvent.mockResolvedValue({
      data: null,
      error: {
        code: "CREATE_FAILED",
        message: "Speichern fehlgeschlagen.",
      },
    });

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

    fireEvent.click(screen.getByRole("button", { name: "Keywords toggeln" }));
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Speicherfehler",
          description: "Speichern fehlgeschlagen.",
          variant: "destructive",
        })
      );
    });
  });

  test("shows a destructive toast when save throws unexpectedly", async () => {
    mockedCreateEvent.mockRejectedValue(new Error("boom"));

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

    fireEvent.click(screen.getByRole("button", { name: "Keywords toggeln" }));
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Fehler",
          description: "Ein unerwarteter Fehler ist aufgetreten.",
          variant: "destructive",
        })
      );
    });
  });

  test("renders and triggers the optional cancel action", async () => {
    const onCancel = vi.fn();

    render(<EventForm onCancel={onCancel} />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Abbrechen" })).toBeEnabled()
    );

    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
