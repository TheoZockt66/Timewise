import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RegisterPage from "@/app/(auth)/register/page";

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

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("blocks submit when both passwords do not match", async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mindestens 8 Zeichen"), {
      target: { value: "12345678" },
    });
    fireEvent.change(screen.getByPlaceholderText("Passwort wiederholen"), {
      target: { value: "12345679" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrieren" }));

    expect(
      screen.getByText("Die Passwörter stimmen nicht überein.")
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("registers a new user and redirects to the dashboard", async () => {
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

    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mindestens 8 Zeichen"), {
      target: { value: "12345678" },
    });
    fireEvent.change(screen.getByPlaceholderText("Passwort wiederholen"), {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrieren" }));

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });
});
