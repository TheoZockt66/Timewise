import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

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

vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    id,
  }: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    id?: string;
  }) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("toggles password visibility and logs the user in on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          user: {
            id: "user-1",
            email: "test@example.com",
            created_at: "2026-04-15T10:00:00.000Z",
          },
          session: {
            access_token: "access",
            refresh_token: "refresh",
            expires_at: 123,
          },
        },
        error: null,
      }),
    });

    render(<LoginPage />);

    const passwordInput = screen.getByPlaceholderText("Dein Passwort");
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(
      screen.getByRole("button", { name: "Passwort anzeigen" })
    );
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(passwordInput, {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  test("shows the server error message for invalid credentials", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        data: null,
        error: {
          message: "E-Mail oder Passwort ist falsch. Bitte versuche es erneut.",
        },
      }),
    });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Dein Passwort"), {
      target: { value: "falsch" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(
        screen.getByText("E-Mail oder Passwort ist falsch. Bitte versuche es erneut.")
      ).toBeInTheDocument();
    });
  });
});
