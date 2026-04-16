"use client";

type Event = {
  start_time: string;
  duration_minutes: number;
  keywords?: { label: string; color: string }[];
};

/**
 * DayTimeline
 *
 * Ziel:
 * - professionelle Tagesansicht (wie Kalender)
 * - zeigt Events als Blöcke statt Linien
 */
export default function DayTimeline({ events }: { events: Event[] }) {
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
      {events.map((event, idx) => {
        const start = new Date(event.start_time);

        const minutesFromStart =
          start.getHours() * 60 + start.getMinutes();

        const top = (minutesFromStart / (24 * 60)) * 100;
        const height =
          (event.duration_minutes / (24 * 60)) * 100;

        return (
          <div
            key={idx}
            className="absolute left-16 right-2 rounded text-white text-xs p-1 shadow"
            style={{
              top: `${top}%`,
              height: `${height}%`,
              backgroundColor:
                event.keywords?.[0]?.color || "#7700F4",
            }}
          >
            {event.keywords?.[0]?.label}
          </div>
        );
      })}
    </div>
  );
}