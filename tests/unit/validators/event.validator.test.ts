import { describe, expect, test, vi } from "vitest";
import {
  calculateDurationMinutes,
  validateEvent,
  validateNoOverlap,
  validateNotInFuture,
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
    expect(validateTimeRange("ungültig", "2026-04-10T10:00:00.000Z")).toEqual({
      field: "time_range",
      message: "Ungültiges Zeitformat.",
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
    expect(calculateDurationMinutes("ungültig", "2026-04-10T10:45:00.000Z")).toBeNull();
    expect(
      calculateDurationMinutes(
        "2026-04-10T10:45:00.000Z",
        "2026-04-10T09:00:00.000Z"
      )
    ).toBeNull();
  });

  // ── Äquivalenzklassen (EQ) ──────────────────────────────────────────────────

  test("rejects a time range where start is after end (EQ_02)", () => {
    expect(
      validateTimeRange(
        "2026-04-10T15:00:00.000Z",
        "2026-04-10T10:00:00.000Z"
      )
    ).toMatchObject({ code: "INVALID_TIME_RANGE" });
  });

  test("rejects a time range where start equals end, resulting in zero duration (EQ_03)", () => {
    expect(
      validateTimeRange(
        "2026-04-10T12:00:00.000Z",
        "2026-04-10T12:00:00.000Z"
      )
    ).toMatchObject({ code: "INVALID_TIME_RANGE" });
  });

  test("rejects an end time that lies in the future beyond the tolerance (EQ_04)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T10:00:00.000Z"));
    try {
      expect(
        validateNotInFuture("2026-04-10T11:00:00.000Z")
      ).toMatchObject({ code: "FUTURE_NOT_ALLOWED" });
    } finally {
      vi.useRealTimers();
    }
  });

  test("rejects an event that overlaps with an existing entry (EQ_05)", () => {
    const existing = buildEvent({
      id: "event-1",
      start_time: "2026-04-10T10:00:00.000Z",
      end_time: "2026-04-10T11:00:00.000Z",
    });

    expect(
      validateNoOverlap(
        "2026-04-10T10:30:00.000Z",
        "2026-04-10T11:30:00.000Z",
        [existing]
      )
    ).toMatchObject({ code: "OVERLAP" });
  });

  test("accepts a valid event with no keywords since keywords are optional (EQ_06)", () => {
    const result = validateEvent({
      startTime: "2026-04-10T09:00:00.000Z",
      endTime: "2026-04-10T10:00:00.000Z",
      keywordIds: [],
      existingEvents: [],
    });

    expect(result).toEqual({ isValid: true, errors: [] });
  });

  // ── Grenzwertanalyse (BV) ───────────────────────────────────────────────────

  test("accepts an event with exactly one minute of duration as the minimum (BV_01)", () => {
    expect(
      calculateDurationMinutes(
        "2026-04-10T10:00:00.000Z",
        "2026-04-10T10:01:00.000Z"
      )
    ).toBe(1);
  });

  test("accepts an end time exactly at the 60-second future tolerance boundary (BV_02)", () => {
    const now = new Date("2026-04-10T10:00:00.000Z").getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      const endTime = new Date(now + 60_000).toISOString();
      expect(validateNotInFuture(endTime)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  test("rejects an end time 61 seconds in the future, one second over tolerance (BV_03)", () => {
    const now = new Date("2026-04-10T10:00:00.000Z").getTime();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    try {
      const endTime = new Date(now + 61_000).toISOString();
      expect(validateNotInFuture(endTime)).toMatchObject({
        code: "FUTURE_NOT_ALLOWED",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  test("allows a seamlessly adjacent event where end of T1 equals start of T2 (BV_04)", () => {
    const existing = buildEvent({
      id: "event-1",
      start_time: "2026-04-10T09:00:00.000Z",
      end_time: "2026-04-10T10:00:00.000Z",
    });

    expect(
      validateNoOverlap(
        "2026-04-10T10:00:00.000Z",
        "2026-04-10T11:00:00.000Z",
        [existing]
      )
    ).toBeNull();
  });

  test("detects a minimal one-minute overlap when T2 starts one minute before T1 ends (BV_05)", () => {
    const existing = buildEvent({
      id: "event-1",
      start_time: "2026-04-10T09:00:00.000Z",
      end_time: "2026-04-10T10:00:00.000Z",
    });

    expect(
      validateNoOverlap(
        "2026-04-10T09:59:00.000Z",
        "2026-04-10T11:00:00.000Z",
        [existing]
      )
    ).toMatchObject({ code: "OVERLAP" });
  });
});
