import type { EventWithKeywords } from "@/types";

export type StatsGranularity = "day" | "week" | "month";

export type TimeRange = {
  start?: Date;
  end?: Date;
};

export type EventSlice = {
  event: EventWithKeywords;
  start: Date;
  end: Date;
  minutes: number;
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] as const;

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function getMinutesBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

function parseRangeBoundary(value: string, boundary: "start" | "end") {
  const date = parseDateInput(value);

  if (!isValidDate(date)) {
    return date;
  }

  if (DATE_ONLY_PATTERN.test(value)) {
    if (boundary === "start") {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }
  }

  return date;
}

function splitSlice(
  slice: EventSlice,
  getNextBoundary: (date: Date) => Date
) {
  const segments: EventSlice[] = [];
  let cursor = new Date(slice.start);

  while (cursor < slice.end) {
    const nextBoundary = getNextBoundary(cursor);

    if (nextBoundary <= cursor) {
      break;
    }

    const segmentEnd =
      nextBoundary < slice.end ? new Date(nextBoundary) : new Date(slice.end);
    const minutes = getMinutesBetween(cursor, segmentEnd);

    if (minutes > 0) {
      segments.push({
        event: slice.event,
        start: new Date(cursor),
        end: segmentEnd,
        minutes,
      });
    }

    cursor = segmentEnd;
  }

  return segments;
}

export function parseDateInput(value: string) {
  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(value);
}

export function buildTimeRange(startInput?: string, endInput?: string): TimeRange {
  const range: TimeRange = {};

  if (startInput) {
    const start = parseRangeBoundary(startInput, "start");

    if (isValidDate(start)) {
      range.start = start;
    }
  }

  if (endInput) {
    const end = parseRangeBoundary(endInput, "end");

    if (isValidDate(end)) {
      range.end = end;
    }
  }

  return range;
}

export function clampEventToRange(
  event: EventWithKeywords,
  range: TimeRange = {}
): EventSlice | null {
  const eventStart = parseDateInput(event.start_time);
  const eventEnd = parseDateInput(event.end_time);

  if (
    !isValidDate(eventStart) ||
    !isValidDate(eventEnd) ||
    eventEnd <= eventStart
  ) {
    return null;
  }

  const clampedStart =
    range.start && range.start > eventStart ? range.start : eventStart;
  const clampedEnd = range.end && range.end < eventEnd ? range.end : eventEnd;

  if (clampedEnd <= clampedStart) {
    return null;
  }

  return {
    event,
    start: new Date(clampedStart),
    end: new Date(clampedEnd),
    minutes: getMinutesBetween(clampedStart, clampedEnd),
  };
}

export function splitEventByDay(
  event: EventWithKeywords,
  range: TimeRange = {}
) {
  const clampedEvent = clampEventToRange(event, range);

  if (!clampedEvent) {
    return [];
  }

  return splitSlice(clampedEvent, (date) => {
    const nextBoundary = new Date(date);
    nextBoundary.setHours(24, 0, 0, 0);

    return nextBoundary;
  });
}

export function splitEventByHour(
  event: EventWithKeywords,
  range: TimeRange = {}
) {
  const clampedEvent = clampEventToRange(event, range);

  if (!clampedEvent) {
    return [];
  }

  return splitSlice(clampedEvent, (date) => {
    const nextBoundary = new Date(date);
    nextBoundary.setMinutes(60, 0, 0);

    return nextBoundary;
  });
}

export function getWeekdayLabel(date: Date) {
  return WEEKDAY_LABELS[date.getDay()] ?? "Mo";
}

export function getCalendarWeek(dateInput: Date) {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);

  date.setDate(date.getDate() + 4 - (date.getDay() || 7));

  const yearStart = new Date(date.getFullYear(), 0, 1);

  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function getWeekStartDate(dateInput: Date) {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);

  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + diffToMonday);

  return date;
}

export function formatDayPeriod(date: Date) {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatWeekPeriod(date: Date) {
  const startOfWeek = getWeekStartDate(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return `${formatDayPeriod(startOfWeek)} - ${formatDayPeriod(endOfWeek)}`;
}

export function formatMonthPeriod(date: Date) {
  return date.toLocaleDateString("de-DE", {
    month: "2-digit",
    year: "numeric",
  });
}

export function getAggregatePeriodLabel(
  date: Date,
  granularity: StatsGranularity
) {
  if (granularity === "day") {
    return formatDayPeriod(date);
  }

  if (granularity === "month") {
    return formatMonthPeriod(date);
  }

  return formatWeekPeriod(date);
}
