import { useCallback, useEffect, useState } from "react";
import type { AggregatedTime, ApiResponse, EventWithKeywords } from "@/types";
import {
    buildTimeRange,
    getCalendarWeek,
    getWeekStartDate,
    getWeekdayLabel,
    splitEventByDay,
    splitEventByHour,
} from "@/lib/stats";

/**
 * Parameter für den useStats Hook.
 *
 * Definiert alle Filter, die an die API übergeben werden:
 * - startDate / endDate → Zeitraum
 * - granularity → Gruppierung der Daten
 * - keywordIds → optionaler Filter nach Keywords
 */
type UseStatsParams = {
    startDate: string;
    endDate: string;
    granularity?: "day" | "week" | "month";
    keywordIds?: string[];
};

/**
 * Eine Zeitreihen-Zeile für das Liniendiagramm.
 *
 * Struktur:
 * - period → Beschriftung auf der X-Achse
 * - total → Gesamtlernzeit
 * - weitere Keys → Minuten pro Keyword
 */
type TimelinePoint = {
    period: string;
    total: number;
    [key: string]: string | number;
};

/**
 * Rückgabewerte des useStats Hooks für die UI.
 *
 * - data → aggregierte Lernzeiten
 * - timelineData → Zeitverlauf für das Liniendiagramm
 * - loading → Ladezustand
 * - error → Fehlermeldung (falls vorhanden)
 * - refetch → manuelles Neuladen der Daten
 */
type UseStatsResult = {
    data: AggregatedTime[];
    timelineData: TimelinePoint[];
    events: EventWithKeywords[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};

/**
 * Sammelt alle Keyword-Labels aus den Events.
 *
 * Die Labels werden alphabetisch sortiert, damit die Reihenfolge stabil bleibt.
 */
function getKeywordLabels(events: EventWithKeywords[]) {
    return Array.from(
        new Set(
            events.flatMap((event) =>
                (event.keywords ?? []).map((kw) => kw.label)
            )
        )
    ).sort((a, b) => a.localeCompare(b, "de"));
}

/**
 * Erzeugt einen leeren Timeline-Punkt mit allen Keyword-Feldern auf 0.
 */
function createTimelinePoint(
    period: string,
    keywordLabels: string[]
): TimelinePoint {
    const point: TimelinePoint = {
        period,
        total: 0,
    };

    keywordLabels.forEach((label) => {
        point[label] = 0;
    });

    return point;
}

/**
 * Fügt Minuten und Keywords zu einem Timeline-Punkt hinzu.
 */
function addMinutesToTimelinePoint(
    point: TimelinePoint,
    minutes: number,
    event: Pick<EventWithKeywords, "keywords">
) {
    point.total += minutes;

    (event.keywords ?? []).forEach((kw) => {
        const label = kw.label;

        if (typeof point[label] !== "number") {
            point[label] = 0;
        }

        point[label] = (point[label] as number) + minutes;
    });
}

function buildInclusiveEndDateParam(dateValue: string) {
    return `${dateValue}T23:59:59.999`;
}

/**
 * Custom Hook zum Laden von Statistikdaten.
 *
 * Kapselt die Datenlogik für die Statistiken und hält die UI frei von Fetch-Logik.
 *
 * Architektur:
 * UI → Hook → API → Service → Datenbank
 */
export function useStats({
    startDate,
    endDate,
    granularity = "week",
    keywordIds = [],
}: UseStatsParams): UseStatsResult {
    const [data, setData] = useState<AggregatedTime[]>([]);
    const [timelineData, setTimelineData] = useState<TimelinePoint[]>([]);
    const [events, setEvents] = useState<EventWithKeywords[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stabilisiert das Dependency Array, da Arrays sonst bei jedem Render eine neue Referenz haben
    const keywordIdsKey = keywordIds.join(",");

    // Woche → Mo–So
    const buildWeekTimeline = (loadedEvents: EventWithKeywords[]) => {
        const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
        const keywordLabels = getKeywordLabels(loadedEvents);
        const range = buildTimeRange(startDate, endDate);

        // Struktur: pro Tag → Gesamt + Keywords
        const grouped: Record<string, TimelinePoint> = {};

        days.forEach((day) => {
            grouped[day] = createTimelinePoint(day, keywordLabels);
        });

        loadedEvents
            .flatMap((event) => splitEventByDay(event, range))
            .forEach((segment) => {
                const dayName = getWeekdayLabel(segment.start);

                if (!grouped[dayName]) {
                    return;
                }

                addMinutesToTimelinePoint(
                    grouped[dayName],
                    segment.minutes,
                    segment.event
                );
            });

        return days.map((day) => grouped[day]);
    };

    // Monat → Kalenderwochen mit Gesamt + Keywords
    const buildMonthTimeline = (loadedEvents: EventWithKeywords[]) => {
        const keywordLabels = getKeywordLabels(loadedEvents);
        const range = buildTimeRange(startDate, endDate);
        const grouped: Record<string, TimelinePoint> = {};

        /**
         * 1. Events auf Wochen aggregieren (Gesamt + Keywords)
         */
        loadedEvents
            .flatMap((event) => splitEventByDay(event, range))
            .forEach((segment) => {
                const key = `KW ${getCalendarWeek(segment.start)}`;

                if (!grouped[key]) {
                    grouped[key] = createTimelinePoint(key, keywordLabels);
                }

                addMinutesToTimelinePoint(
                    grouped[key],
                    segment.minutes,
                    segment.event
                );
            });

        /**
         * 2. Start- und Enddatum aus dem Filter verwenden
         */
        const startWeekStart = getWeekStartDate(range.start ?? new Date(startDate));
        const endWeekStart = getWeekStartDate(range.end ?? new Date(endDate));

        /**
         * 3. Vollständige Timeline erzeugen (inkl. leerer Wochen)
         */
        const fullTimeline: TimelinePoint[] = [];
        const cursor = new Date(startWeekStart);

        while (cursor <= endWeekStart) {
            const key = `KW ${getCalendarWeek(cursor)}`;

            fullTimeline.push(
                grouped[key] ?? createTimelinePoint(key, keywordLabels)
            );

            cursor.setDate(cursor.getDate() + 7);
        }

        return fullTimeline;
    };

    // Tag → Stunden mit Gesamt + Keywords
    const buildDayTimeline = (loadedEvents: EventWithKeywords[]) => {
        const keywordLabels = getKeywordLabels(loadedEvents);
        const range = buildTimeRange(startDate, endDate);

        // Alle Stunden von 0–23 vorbereiten
        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const grouped: Record<string, TimelinePoint> = {};

        // Jede Stunde initialisieren (auch wenn keine Daten vorhanden sind)
        hours.forEach((hour) => {
            grouped[hour] = createTimelinePoint(hour, keywordLabels);
        });

        loadedEvents
            .flatMap((event) => splitEventByHour(event, range))
            .forEach((segment) => {
                const key = `${segment.start.getHours()}:00`;
                addMinutesToTimelinePoint(grouped[key], segment.minutes, segment.event);
            });

        // Reihenfolge bleibt stabil (0 → 23)
        return hours.map((hour) => grouped[hour]);
    };

    /**
     * Lädt die Statistikdaten vom Backend basierend auf den aktuellen Filtern.
     */
    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: buildInclusiveEndDateParam(endDate),
                granularity,
            });

            keywordIds?.forEach((id) => {
                params.append("keyword_ids", id);
            });

            const response = await fetch(
                `/api/events/aggregate?${params.toString()}`
            );

            let result: ApiResponse<AggregatedTime[]>;

            try {
                result = await response.json();
            } catch {
                throw new Error("Ungültige Serverantwort.");
            }

            if (!response.ok || result.error) {
                throw new Error(
                    result.error?.message || "Statistiken konnten nicht geladen werden."
                );
            }

            setData(result.data ?? []);

            const paramsEvents = new URLSearchParams({
                start_date: startDate,
                end_date: buildInclusiveEndDateParam(endDate),
            });

            keywordIds?.forEach((id) => {
                paramsEvents.append("keyword_ids", id);
            });

            const responseEvents = await fetch(`/api/events?${paramsEvents.toString()}`);
            let eventsResult: ApiResponse<EventWithKeywords[]>;

            try {
                eventsResult = await responseEvents.json();
            } catch {
                throw new Error("Ungültige Serverantwort.");
            }

            if (!responseEvents.ok || eventsResult.error) {
                throw new Error(
                    eventsResult.error?.message || "Events konnten nicht geladen werden."
                );
            }

            const loadedEvents = eventsResult.data ?? [];
            setEvents(loadedEvents);
            let timeline: TimelinePoint[] = [];

            if (granularity === "week") {
                timeline = buildWeekTimeline(loadedEvents);
            } else if (granularity === "month") {
                timeline = buildMonthTimeline(loadedEvents);
            } else {
                // Für Tagesansicht wird die Timeline nicht benötigt,
                // da DayTimeline direkt mit Events arbeitet
                timeline = buildDayTimeline(loadedEvents);
            }

            setTimelineData(timeline);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Unbekannter Fehler beim Laden der Statistiken.";

            setError(message);
            setData([]);
            setTimelineData([]);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, granularity, keywordIdsKey]);

    useEffect(() => {
        void fetchStats();
    }, [fetchStats]);

    return {
        data,
        timelineData,
        events,
        loading,
        error,
        refetch: fetchStats,
    };
}
