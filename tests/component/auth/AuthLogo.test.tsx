import React from "react";
import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthLogo } from "@/components/auth/AuthLogo";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

describe("AuthLogo", () => {
  test("renders the official logo image", () => {
    render(<AuthLogo />);

    const image = screen.getByAltText("Timewise Logo");
    expect(image).toHaveAttribute("src", "/timewise-logo.svg");
  });
});
