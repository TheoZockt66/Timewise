"use client";

import type { EventWithKeywords } from "@/types";
import {
  buildTimeRange,
  clampEventToRange,
  type EventSlice,
} from "@/lib/stats";

type Props = {
  events: EventWithKeywords[];
  startDate: string;
  endDate: string;
};

/**
 * DayTimeline
 *
 * Ziel:
 * - professionelle Tagesansicht (wie Kalender)
 * - zeigt Events als Blöcke statt Linien
 */
export default function DayTimeline({ events, startDate, endDate }: Props) {
  const dayRange = buildTimeRange(startDate, endDate);
  const visibleEvents = events
    .map((event) => clampEventToRange(event, dayRange))
    .filter((event): event is EventSlice => event !== null);

  return (
    <div className="relative h-[600px] border rounded bg-white overflow-hidden">
      {/* Stundenlinien */}
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t text-xs text-gray-400 pl-2"
          style={{ top: `${(i / 24) * 100}%` }}
        >
          {String(i).padStart(2, "0")}:00
        </div>
      ))}

      {/* Events */}
      {visibleEvents.map((eventSlice, idx) => {
        const start = eventSlice.start;

        const minutesFromStart =
          start.getHours() * 60 + start.getMinutes();

        const top = (minutesFromStart / (24 * 60)) * 100;
        const height =
          (eventSlice.minutes / (24 * 60)) * 100;

        return (
          <div
            key={`${eventSlice.event.id}-${idx}`}
            className="absolute left-16 right-2 rounded text-white text-xs p-1 shadow"
            style={{
              top: `${top}%`,
              height: `${height}%`,
              backgroundColor:
                eventSlice.event.keywords?.[0]?.color || "#7700F4",
            }}
          >
            {eventSlice.event.keywords?.[0]?.label}
          </div>
        );
      })}
    </div>
  );
}
