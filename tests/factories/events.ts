import type { Event, EventWithKeywords, Keyword } from "@/types";
import { buildKeyword } from "./keywords";

export function buildEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-1",
    user_id: "user-1",
    label: "Lerneinheit",
    description: "Kapitel 1",
    start_time: "2026-04-10T09:00:00.000Z",
    end_time: "2026-04-10T10:00:00.000Z",
    created_at: "2026-04-10T10:00:00.000Z",
    ...overrides,
  };
}

export function buildEventWithKeywords(
  overrides: Partial<EventWithKeywords> = {}
): EventWithKeywords {
  const { keywords, duration_minutes, ...eventOverrides } = overrides;
  const event = buildEvent(eventOverrides);

  return {
    ...event,
    keywords: keywords ?? [buildKeyword()],
    duration_minutes: duration_minutes ?? 60,
  };
}

export function buildEventKeywordJoin(keywords: Keyword[] = [buildKeyword()]) {
  return keywords.map((keyword) => ({
    keyword_id: keyword.id,
    keywords: keyword,
  }));
}
