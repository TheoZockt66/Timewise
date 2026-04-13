import { describe, expect, test } from "vitest";
import { validateKeyword } from "./keyword.validator";

describe("validateKeyword", () => {
  test("returns valid for a keyword with label and hex color", () => {
    expect(
      validateKeyword({
        label: "Mathe",
        color: "#FF0000",
      })
    ).toEqual({
      valid: true,
      error: null,
    });
  });

  test("rejects an empty label", () => {
    expect(
      validateKeyword({
        label: "",
        color: "#FF0000",
      })
    ).toEqual({
      valid: false,
      error: "Label darf nicht leer sein",
    });
  });

  test("rejects a label with only whitespace", () => {
    expect(
      validateKeyword({
        label: "   ",
        color: "#FF0000",
      })
    ).toEqual({
      valid: false,
      error: "Label darf nicht leer sein",
    });
  });

  test("rejects a label longer than 50 characters", () => {
    expect(
      validateKeyword({
        label: "M".repeat(51),
        color: "#FF0000",
      })
    ).toEqual({
      valid: false,
      error: "Label darf maximal 50 Zeichen lang sein",
    });
  });

  test("rejects a missing color", () => {
    expect(
      validateKeyword({
        label: "Mathe",
        color: undefined,
      })
    ).toEqual({
      valid: false,
      error: "Farbe muss ein gültiger Hex-Code sein (#RRGGBB)",
    });
  });

  test("rejects a color without leading hash", () => {
    expect(
      validateKeyword({
        label: "Mathe",
        color: "FF0000",
      })
    ).toEqual({
      valid: false,
      error: "Farbe muss ein gültiger Hex-Code sein (#RRGGBB)",
    });
  });

  test("rejects a color with invalid hex characters", () => {
    expect(
      validateKeyword({
        label: "Mathe",
        color: "#GG0000",
      })
    ).toEqual({
      valid: false,
      error: "Farbe muss ein gültiger Hex-Code sein (#RRGGBB)",
    });
  });

  test("accepts lowercase hex colors", () => {
    expect(
      validateKeyword({
        label: "Mathe",
        color: "#abc123",
      })
    ).toEqual({
      valid: true,
      error: null,
    });
  });
});
