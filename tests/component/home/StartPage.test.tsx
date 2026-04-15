import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import StartPage from "@/app/page";

const pushMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
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

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

describe("StartPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders all navigation tiles and logs out successfully", async () => {
    fetchMock.mockResolvedValue({});

    render(<StartPage />);

    expect(screen.getByText("Kalender")).toBeInTheDocument();
    expect(screen.getByText("Keywords")).toBeInTheDocument();
    expect(screen.getByText("Statistiken")).toBeInTheDocument();
    expect(screen.getByText("Ziele")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
  });

  test("resets the logout button when the request fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));

    render(<StartPage />);

    fireEvent.click(screen.getByRole("button", { name: "Abmelden" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Abmelden" })).toBeEnabled();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });
});
