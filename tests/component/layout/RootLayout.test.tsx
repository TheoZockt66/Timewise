import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => <div>Toaster</div>,
}));

describe("RootLayout", () => {
  test("wraps children with the global html shell and toaster", () => {
    render(
      <RootLayout>
        <div>Inhalt</div>
      </RootLayout>
    );

    expect(screen.getByText("Inhalt")).toBeInTheDocument();
    expect(screen.getByText("Toaster")).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("lang", "de");
  });
});
