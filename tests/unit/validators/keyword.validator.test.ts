import { describe, expect, test } from "vitest";
import { validateKeyword } from "@/lib/validators/keyword.validator";

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

  // ── Äquivalenzklassen (EQ) ──────────────────────────────────────────────────

  test("accepts a color with mixed uppercase and lowercase hex letters (EQ_KW_07)", () => {
    expect(validateKeyword({ label: "Test", color: "#aAbBcC" })).toEqual({
      valid: true,
      error: null,
    });
  });

  // ── Grenzwertanalyse (BV) ───────────────────────────────────────────────────

  test("accepts a label with exactly one character as the minimum (BV_KW_01)", () => {
    expect(validateKeyword({ label: "A", color: "#123456" })).toEqual({
      valid: true,
      error: null,
    });
  });

  test("accepts a label with exactly 50 characters at the upper boundary (BV_KW_02)", () => {
    expect(validateKeyword({ label: "M".repeat(50), color: "#123456" })).toEqual({
      valid: true,
      error: null,
    });
  });

  test("rejects a color with only 5 hex digits, one below the required 6 (BV_KW_05)", () => {
    expect(validateKeyword({ label: "Test", color: "#12345" })).toEqual({
      valid: false,
      error: "Farbe muss ein gültiger Hex-Code sein (#RRGGBB)",
    });
  });

  test("rejects a color with 7 hex digits, one above the required 6 (BV_KW_06)", () => {
    expect(validateKeyword({ label: "Test", color: "#1234567" })).toEqual({
      valid: false,
      error: "Farbe muss ein gültiger Hex-Code sein (#RRGGBB)",
    });
  });
});
