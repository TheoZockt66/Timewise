import { describe, expect, test } from "vitest";
import {
  formatDate,
  getKeywordBadgeStyles,
  getSelectedKeywordDotStyles,
  isLightHexColor,
} from "@/lib/utils";

describe("lib/utils", () => {
  test("formats dates in local YYYY-MM-DD notation", () => {
    expect(formatDate(new Date(2026, 3, 15))).toBe("2026-04-15");
  });

  test("detects light hex colors including short notation", () => {
    expect(isLightHexColor("#FFFFFF")).toBe(true);
    expect(isLightHexColor("#fff")).toBe(true);
    expect(isLightHexColor("#111111")).toBe(false);
    expect(isLightHexColor("invalid")).toBe(false);
  });

  test("builds accessible keyword styles for very light colors", () => {
    expect(getKeywordBadgeStyles("#FAFAFA")).toMatchObject({
      backgroundColor: "rgba(119, 0, 244, 0.08)",
      color: "#1A1A2E",
    });
    expect(getSelectedKeywordDotStyles("#FAFAFA")).toMatchObject({
      backgroundColor: "#FFFFFF",
    });
  });
});
