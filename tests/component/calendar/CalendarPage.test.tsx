import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import CalendarPage from "@/app/(dashboard)/calendar/page";

vi.mock("@/app/(dashboard)/calendar/CalendarView", () => ({
  default: () => <div>CalendarView</div>,
}));

describe("CalendarPage", () => {
  test("renders the calendar view inside the page shell", () => {
    render(<CalendarPage />);

    expect(screen.getByText("CalendarView")).toBeInTheDocument();
  });
});
