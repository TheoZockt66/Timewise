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

  test("blocks submit when the password is too short", () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByPlaceholderText("name@example.com"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mindestens 8 Zeichen"), {
      target: { value: "1234567" },
    });
    fireEvent.change(screen.getByPlaceholderText("Passwort wiederholen"), {
      target: { value: "1234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrieren" }));

    expect(
      screen.getByText("Das Passwort muss mindestens 8 Zeichen lang sein.")
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("toggles both password fields independently", () => {
    render(<RegisterPage />);

    const passwordInput = screen.getByPlaceholderText(
      "Mindestens 8 Zeichen"
    ) as HTMLInputElement;
    const confirmInput = screen.getByPlaceholderText(
      "Passwort wiederholen"
    ) as HTMLInputElement;

    expect(passwordInput.type).toBe("password");
    expect(confirmInput.type).toBe("password");

    const showButtons = screen.getAllByLabelText("Passwort anzeigen");
    fireEvent.click(showButtons[0]);
    fireEvent.click(showButtons[1]);

    expect(passwordInput.type).toBe("text");
    expect(confirmInput.type).toBe("text");

    const hideButtons = screen.getAllByLabelText("Passwort verbergen");
    fireEvent.click(hideButtons[0]);
    fireEvent.click(hideButtons[1]);

    expect(passwordInput.type).toBe("password");
    expect(confirmInput.type).toBe("password");
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

  test("shows the server error message when registration fails", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        data: null,
        error: {
          message: "E-Mail ist bereits vergeben.",
        },
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
      expect(screen.getByText("E-Mail ist bereits vergeben.")).toBeInTheDocument();
    });
  });

  test("falls back to the generic server message when no API error message exists", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        data: null,
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
      expect(
        screen.getByText("Registrierung fehlgeschlagen. Bitte versuche es erneut.")
      ).toBeInTheDocument();
    });
  });

  test("shows the network fallback when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));

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
      expect(
        screen.getByText(
          "Verbindung zum Server fehlgeschlagen. Bitte prüfe deine Internetverbindung."
        )
      ).toBeInTheDocument();
    });
  });
});
