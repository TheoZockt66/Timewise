import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

vi.mock("@radix-ui/react-toast", async () => {
  const ReactModule = await import("react");

  function createPrimitive<T extends keyof JSX.IntrinsicElements>(
    tag: T,
    displayName: string
  ) {
    const Primitive = ReactModule.forwardRef<
      HTMLElement,
      JSX.IntrinsicElements[T]
    >(({ children, ...props }, ref) =>
      ReactModule.createElement(tag, {
        ...props,
        ref,
        "data-radix": displayName,
        children,
      })
    );

    Primitive.displayName = displayName;
    return Primitive;
  }

  return {
    Provider: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="toast-provider">{children}</div>
    ),
    Viewport: createPrimitive("div", "Viewport"),
    Root: createPrimitive("div", "Root"),
    Action: createPrimitive("button", "Action"),
    Close: createPrimitive("button", "Close"),
    Title: createPrimitive("h3", "Title"),
    Description: createPrimitive("p", "Description"),
  };
});

describe("toast ui primitives", () => {
  test("renders the wrapped radix primitives with merged classes", () => {
    render(
      <ToastProvider>
        <ToastViewport
          className="custom-viewport"
          data-testid="toast-viewport"
        />
        <Toast
          variant="destructive"
          className="custom-toast"
          data-testid="toast-root"
        >
          <div>
            <ToastTitle>Warning</ToastTitle>
            <ToastDescription>Save failed</ToastDescription>
          </div>
          <ToastAction data-testid="toast-action" altText="Retry">
            Retry
          </ToastAction>
          <ToastClose aria-label="close toast" />
        </Toast>
      </ToastProvider>
    );

    expect(screen.getByTestId("toast-provider")).toBeInTheDocument();
    expect(screen.getByTestId("toast-viewport")).toHaveClass(
      "fixed",
      "custom-viewport"
    );
    expect(screen.getByTestId("toast-root")).toHaveClass(
      "destructive",
      "custom-toast"
    );
    expect(screen.getByText("Warning")).toBeInTheDocument();
    expect(screen.getByText("Save failed")).toBeInTheDocument();
    expect(screen.getByTestId("toast-action")).toHaveClass("inline-flex");
    expect(screen.getByLabelText("close toast")).toHaveAttribute(
      "toast-close",
      ""
    );
  });
});
