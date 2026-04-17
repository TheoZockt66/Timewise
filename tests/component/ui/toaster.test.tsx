import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

vi.mock("@/hooks/use-toast", () => ({
  useToast: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="toast-provider">{children}</div>
  ),
  ToastViewport: () => <div data-testid="toast-viewport" />,
  Toast: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
  }) => (
    <div data-testid="toast-item" data-open={String(Boolean(open))}>
      {children}
    </div>
  ),
  ToastTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  ToastDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  ToastClose: () => (
    <button type="button" data-testid="toast-close">
      close
    </button>
  ),
}));

const mockedUseToast = vi.mocked(useToast);

describe("Toaster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders all toast entries with their optional content", () => {
    mockedUseToast.mockReturnValue({
      toasts: [
        {
          id: "toast-1",
          title: "Saved",
          description: "All changes were stored.",
          action: <button type="button">Undo</button>,
          open: true,
        },
        {
          id: "toast-2",
          open: false,
        },
      ],
      toast: vi.fn(),
      dismiss: vi.fn(),
    } as never);

    render(<Toaster />);

    expect(screen.getByTestId("toast-provider")).toBeInTheDocument();
    expect(screen.getByTestId("toast-viewport")).toBeInTheDocument();
    expect(screen.getAllByTestId("toast-item")).toHaveLength(2);
    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("All changes were stored.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getAllByTestId("toast-close")).toHaveLength(2);
  });
});
