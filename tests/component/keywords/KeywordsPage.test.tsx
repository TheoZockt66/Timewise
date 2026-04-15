import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import KeywordsPage from "@/app/(dashboard)/keywords/page";
import { buildKeyword } from "../../factories/keywords";

const toastMock = vi.fn();
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

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

describe("KeywordsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("loads the current keyword list on mount", async () => {
    fetchMock.mockResolvedValueOnce({
      json: async () => ({ data: [buildKeyword()], error: null }),
    });

    render(<KeywordsPage />);

    await waitFor(() => {
      expect(screen.getByText("Mathe")).toBeInTheDocument();
    });
  });

  test("creates a new keyword and refreshes the list", async () => {
    fetchMock
      .mockResolvedValueOnce({
        json: async () => ({ data: [], error: null }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ error: null }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: [buildKeyword({ label: "Physik", color: "#00957F" })],
          error: null,
        }),
      });

    render(<KeywordsPage />);

    await waitFor(() => {
      expect(screen.getByText("Noch keine Keywords vorhanden")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Neues Keyword"), {
      target: { value: "Physik" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hinzufügen" }));

    await waitFor(() => {
      expect(screen.getByText("Physik")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/keywords",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[1][1].body as string)).toMatchObject({
      label: "Physik",
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Erfolg" })
    );
    expect(screen.getByPlaceholderText("Neues Keyword")).toHaveValue("");
  });

  test("updates and deletes an existing keyword", async () => {
    const keyword = buildKeyword();

    fetchMock
      .mockResolvedValueOnce({
        json: async () => ({ data: [keyword], error: null }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ error: null }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ error: null }),
      });

    render(<KeywordsPage />);

    await waitFor(() => {
      expect(screen.getByText("Mathe")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten" }));
    fireEvent.change(screen.getByDisplayValue("Mathe"), {
      target: { value: "Physik" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(screen.getByText("Physik")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `/api/keywords/${keyword.id}`,
      expect.objectContaining({
        method: "PUT",
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Löschen" }));

    await waitFor(() => {
      expect(screen.queryByText("Physik")).not.toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      `/api/keywords/${keyword.id}`,
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });
});
