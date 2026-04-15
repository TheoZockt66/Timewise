import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthIllustration } from "@/components/auth/AuthIllustration";

describe("AuthIllustration", () => {
  test("renders the headline and descriptive copy", () => {
    render(<AuthIllustration />);

    expect(
      screen.getByText("Behalte deine Lernzeit im Blick")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Erfasse deine Lernzeiten, visualisiere deinen Fortschritt/i)
    ).toBeInTheDocument();
  });
});
