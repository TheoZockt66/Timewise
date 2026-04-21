import React, { useEffect, useState } from "react";
import { describe, expect, test, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import StartPage from "@/app/page";
import CalendarPage from "@/app/(dashboard)/calendar/page";
import { useCalendar } from "@/hooks/useCalendar";
import calendarEventFixture from "../fixtures/calendar/calendar-event.json";

vi.mock("@/hooks/useCalendar", () => ({
  useCalendar: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (href: string) => {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
  }) => (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        event.preventDefault();
        window.history.pushState({}, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
    >
      {children}
    </a>
  ),
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
  default: ({ events }: { events: Array<{ title: string }> }) => (
    <div data-testid="calendar-shell">
      {events.map((event) => (
        <span key={event.title}>{event.title}</span>
      ))}
    </div>
  ),
}));

vi.mock("@fullcalendar/daygrid", () => ({ default: {} }));
vi.mock("@fullcalendar/timegrid", () => ({ default: {} }));
vi.mock("@fullcalendar/interaction", () => ({ default: {} }));

const mockedUseCalendar = vi.mocked(useCalendar);

function RouteHarness() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handleNavigation);
    return () => window.removeEventListener("popstate", handleNavigation);
  }, []);

  if (pathname === "/calendar") {
    return <CalendarPage />;
  }

  return <StartPage />;
}

describe("dashboard navigation smoke", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    mockedUseCalendar.mockReturnValue({
      events: [calendarEventFixture],
      isLoading: false,
      error: null,
      fetchEvents: vi.fn(),
    });
  });

  test("navigates from the protected start page to the calendar page and back", async () => {
    render(<RouteHarness />);

    expect(screen.getByText("Dein Arbeitsbereich")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Timewise Logo" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /Kalender/i }));

    await waitFor(() => {
      expect(screen.getByText("Mein Lernkalender")).toBeInTheDocument();
    });

    expect(screen.getByTestId("calendar-shell")).toBeInTheDocument();
    expect(screen.getByText(calendarEventFixture.label)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Timewise Logo" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /Zurück/i }));

    await waitFor(() => {
      expect(screen.getByText("Dein Arbeitsbereich")).toBeInTheDocument();
    });
  });
});
