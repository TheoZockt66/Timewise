import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DateNavigation from "@/components/ui/DateNavigation";

describe("DateNavigation", () => {
  test("forwards previous and next clicks", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();

    render(<DateNavigation onPrev={onPrev} onNext={onNext} />);

    fireEvent.click(screen.getByRole("button", { name: "Vorheriger Zeitraum" }));
    fireEvent.click(screen.getByRole("button", { name: "Nächster Zeitraum" }));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
