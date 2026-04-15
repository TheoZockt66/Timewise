import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";

const fetchMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/auth/AuthLogo", () => ({
  AuthLogo: () => <div>AuthLogo</div>,
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("switches to the confirmation state after a successful submit", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
    });

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Link senden" }));

    await waitFor(() => {
      expect(screen.getByText("E-Mail gesendet")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "versuche es erneut" }));
    expect(
      screen.getByText("Passwort vergessen?")
    ).toBeInTheDocument();
  });

  test("shows an error when the request fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
    });

    render(<ResetPasswordPage />);

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Link senden" }));

    await waitFor(() => {
      expect(
        screen.getByText("Anfrage fehlgeschlagen. Bitte versuche es erneut.")
      ).toBeInTheDocument();
    });
  });
});
