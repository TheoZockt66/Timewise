import { describe, expect, test } from "vitest";
import {
  calculateDurationMinutes,
  validateEvent,
  validateNoOverlap,
  validateTimeRange,
} from "@/lib/validators/event.validator";
import { buildEvent } from "../../factories/events";

describe("event.validator", () => {
  test("accepts a valid event with at least one keyword", () => {
    const result = validateEvent({
      startTime: "2026-04-10T09:00:00.000Z",
      endTime: "2026-04-10T10:00:00.000Z",
      keywordIds: ["keyword-1"],
      existingEvents: [],
    });

    expect(result).toEqual({
      isValid: true,
      errors: [],
    });
  });

  test("rejects invalid timestamps before running later checks", () => {
    expect(validateTimeRange("ungueltig", "2026-04-10T10:00:00.000Z")).toEqual({
      field: "time_range",
      message: "Ungueltiges Zeitformat.",
      code: "INVALID_TIME_RANGE",
    });
  });

  test("detects overlaps but ignores the currently edited event", () => {
    const existingEvent = buildEvent({
      id: "event-1",
      start_time: "2026-04-10T09:30:00.000Z",
      end_time: "2026-04-10T10:30:00.000Z",
    });

    expect(
      validateNoOverlap(
        "2026-04-10T09:45:00.000Z",
        "2026-04-10T10:15:00.000Z",
        [existingEvent]
      )
    ).toMatchObject({
      code: "OVERLAP",
    });

    expect(
      validateNoOverlap(
        "2026-04-10T09:45:00.000Z",
        "2026-04-10T10:15:00.000Z",
        [existingEvent],
        "event-1"
      )
    ).toBeNull();
  });

  test("calculates durations in minutes and rejects invalid ranges", () => {
    expect(
      calculateDurationMinutes(
        "2026-04-10T09:00:00.000Z",
        "2026-04-10T10:45:00.000Z"
      )
    ).toBe(105);
    expect(calculateDurationMinutes("ungueltig", "2026-04-10T10:45:00.000Z")).toBeNull();
    expect(
      calculateDurationMinutes(
        "2026-04-10T10:45:00.000Z",
        "2026-04-10T09:00:00.000Z"
      )
    ).toBeNull();
  });
});
