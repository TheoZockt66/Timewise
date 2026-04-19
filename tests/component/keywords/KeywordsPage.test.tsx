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

function jsonResponse(payload: unknown, ok = true) {
  return {
    ok,
    json: async () => payload,
  };
}

describe("KeywordsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("loads the current keyword list on mount", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ data: [buildKeyword()], error: null })
    );

    render(<KeywordsPage />);

    await waitFor(() => {
      expect(screen.getByText("Mathe")).toBeInTheDocument();
    });
  });

  test("creates a new keyword and refreshes the list", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [], error: null }))
      .mockResolvedValueOnce(jsonResponse({ error: null }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: [buildKeyword({ label: "Physik", color: "#00957F" })],
          error: null,
        })
      );

    render(<KeywordsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Noch keine Keywords/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Neues Keyword"), {
      target: { value: "Physik" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Hinzuf/i }));

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
      color: "#000000",
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Erfolg" })
    );
    expect(screen.getByPlaceholderText("Neues Keyword")).toHaveValue("");
  });

  test("shows create length and color warnings and clears them again", async () => {
    const fiftyChars = "A".repeat(50);
    const fiftyOneChars = "B".repeat(51);

    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [], error: null }));

    const { container } = render(<KeywordsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Noch keine Keywords/i)).toBeInTheDocument();
    });

    const labelInput = screen.getByPlaceholderText("Neues Keyword");
    const colorInput = container.querySelector(
      'input[type="color"]'
    ) as HTMLInputElement;

    fireEvent.change(labelInput, {
      target: { value: fiftyChars },
    });

    expect(screen.getByText(/Maximale L/i)).toBeInTheDocument();
    expect(labelInput).toHaveValue(fiftyChars);

    fireEvent.change(labelInput, {
      target: { value: fiftyOneChars },
    });

    expect(labelInput).toHaveValue(fiftyChars);

    fireEvent.change(labelInput, {
      target: { value: "Chemie" },
    });

    expect(screen.queryByText(/Maximale L/i)).not.toBeInTheDocument();

    fireEvent.change(colorInput, {
      target: { value: "#ffffff" },
    });

    expect(screen.getByText(/Farbe zu hell/i)).toBeInTheDocument();

    fireEvent.change(colorInput, {
      target: { value: "#000000" },
    });

    expect(screen.queryByText(/Farbe zu hell/i)).not.toBeInTheDocument();
  });

  test("surfaces backend create errors inside the form", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [], error: null }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: { message: "Keyword existiert bereits." },
          },
          false
        )
      );

    render(<KeywordsPage />);

    await waitFor(() => {
      expect(screen.getByText(/Noch keine Keywords/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Neues Keyword"), {
      target: { value: "Mathe" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Hinzuf/i }));

    await waitFor(() => {
      expect(screen.getByText("Keyword existiert bereits.")).toBeInTheDocument();
    });

    expect(toastMock).not.toHaveBeenCalled();
  });

  test("updates and deletes an existing keyword", async () => {
    const keyword = buildKeyword();

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [keyword], error: null }))
      .mockResolvedValueOnce(jsonResponse({ error: null }))
      .mockResolvedValueOnce(jsonResponse({ error: null }));

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

    fireEvent.click(screen.getByRole("button", { name: /L.schen/i }));

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

  test("shows edit warnings, falls back to a generic save error and can cancel editing", async () => {
    const keyword = buildKeyword();
    const fiftyChars = "C".repeat(50);

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [keyword], error: null }))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: null,
          },
          false
        )
      );

    const { container } = render(<KeywordsPage />);

    await waitFor(() => {
      expect(screen.getByText("Mathe")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten" }));

    const editInput = screen.getByDisplayValue("Mathe");
    fireEvent.change(editInput, {
      target: { value: fiftyChars },
    });

    expect(screen.getByText(/Maximale L/i)).toBeInTheDocument();

    fireEvent.change(editInput, {
      target: { value: "Physik" },
    });

    expect(screen.queryByText(/Maximale L/i)).not.toBeInTheDocument();

    const colorInputs = container.querySelectorAll('input[type="color"]');
    fireEvent.change(colorInputs[1] as HTMLInputElement, {
      target: { value: "#ffffff" },
    });

    expect(screen.getByText(/Farbe zu hell/i)).toBeInTheDocument();

    fireEvent.change(colorInputs[1] as HTMLInputElement, {
      target: { value: "#00957f" },
    });

    expect(screen.queryByText(/Farbe zu hell/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(
        screen.getByText("Keyword konnte nicht gespeichert werden.")
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `/api/keywords/${keyword.id}`,
      expect.objectContaining({
        method: "PUT",
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));

    await waitFor(() => {
      expect(screen.queryByDisplayValue("Physik")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Mathe")).toBeInTheDocument();
  });

  test("shows an error toast when deleting a keyword fails", async () => {
    const keyword = buildKeyword();

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ data: [keyword], error: null }))
      .mockResolvedValueOnce(
        jsonResponse({
          error: { message: "Delete kaputt" },
        })
      );

    render(<KeywordsPage />);

    await waitFor(() => {
      expect(screen.getByText("Mathe")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /L.schen/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Fehler",
          description: "Keyword konnte nicht gelöscht werden",
        })
      );
    });

    expect(screen.getByText("Mathe")).toBeInTheDocument();
  });
});
