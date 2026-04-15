import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthLayout from "@/app/(auth)/layout";

vi.mock("@/components/auth/AuthIllustration", () => ({
  AuthIllustration: () => <div>Illustration</div>,
}));

describe("AuthLayout", () => {
  test("renders the form area and the illustration shell", () => {
    render(
      <AuthLayout>
        <div>LoginForm</div>
      </AuthLayout>
    );

    expect(screen.getByText("LoginForm")).toBeInTheDocument();
    expect(screen.getByText("Illustration")).toBeInTheDocument();
  });
});
