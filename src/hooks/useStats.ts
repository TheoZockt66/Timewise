import { useCallback, useEffect, useState } from "react";
import type { AggregatedTime, ApiResponse } from "@/types";

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
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};

/**
 * Sammelt alle Keyword-Labels aus den Events.
 *
 * Die Labels werden alphabetisch sortiert, damit die Reihenfolge stabil bleibt.
 */
function getKeywordLabels(events: any[]) {
    return Array.from(
        new Set(
            events.flatMap((event) =>
                (event.keywords ?? []).map((kw: any) => kw.label)
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
 * Fügt ein Event zu einem Timeline-Punkt hinzu.
 */
function addEventToTimelinePoint(point: TimelinePoint, event: any) {
    const minutes = Number(event.duration_minutes) || 0;

    point.total += minutes;

    (event.keywords ?? []).forEach((kw: any) => {
        const label = kw.label;

        if (typeof point[label] !== "number") {
            point[label] = 0;
        }

        point[label] = (point[label] as number) + minutes;
    });
}

/**
 * Hilfsfunktion zur Berechnung der Kalenderwoche
 * (ISO-Standard → Woche beginnt Montag)
 */
function getCalendarWeek(dateInput: Date) {
    const date = new Date(dateInput);
    date.setHours(0, 0, 0, 0);

    date.setDate(date.getDate() + 4 - (date.getDay() || 7));

    const yearStart = new Date(date.getFullYear(), 0, 1);

    return Math.ceil(
        (((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7
    );
}

/**
 * Liefert den Montag der jeweiligen Woche.
 */
function getWeekStartDate(dateInput: Date) {
    const date = new Date(dateInput);
    date.setHours(0, 0, 0, 0);

    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    date.setDate(date.getDate() + diffToMonday);

    return date;
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Stabilisiert das Dependency Array, da Arrays sonst bei jedem Render eine neue Referenz haben
    const keywordIdsKey = keywordIds.join(",");

    // Woche → Mo–So
    const buildWeekTimeline = (events: any[]) => {
        const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
        const keywordLabels = getKeywordLabels(events);

        // Struktur: pro Tag → Gesamt + Keywords
        const grouped: Record<string, TimelinePoint> = {};

        days.forEach((day) => {
            grouped[day] = createTimelinePoint(day, keywordLabels);
        });

        const map = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

        events.forEach((event) => {
            const date = new Date(event.start_time);
            const jsDay = date.getDay();
            const dayName = map[jsDay] ?? "Mo";

            addEventToTimelinePoint(grouped[dayName], event);
        });

        return days.map((day) => grouped[day]);
    };

    // Monat → Kalenderwochen mit Gesamt + Keywords
    const buildMonthTimeline = (events: any[]) => {
        const keywordLabels = getKeywordLabels(events);
        const grouped: Record<string, TimelinePoint> = {};

        /**
         * 1. Events auf Wochen aggregieren (Gesamt + Keywords)
         */
        events.forEach((event) => {
            const date = new Date(event.start_time);
            const week = getCalendarWeek(date);
            const key = `KW ${week}`;

            if (!grouped[key]) {
                grouped[key] = createTimelinePoint(key, keywordLabels);
            }

            addEventToTimelinePoint(grouped[key], event);
        });

        /**
         * 2. Start- und Enddatum aus dem Filter verwenden
         */
        const startWeekStart = getWeekStartDate(new Date(startDate));
        const endWeekStart = getWeekStartDate(new Date(endDate));

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
    const buildDayTimeline = (events: any[]) => {
        const keywordLabels = getKeywordLabels(events);

        // Struktur: pro Stunde → Gesamt + Keywords
        const grouped: Record<string, TimelinePoint> = {};

        events.forEach((event) => {
            const date = new Date(event.start_time);
            const key = `${date.getHours()}:00`;

            if (!grouped[key]) {
                grouped[key] = createTimelinePoint(key, keywordLabels);
            }

            addEventToTimelinePoint(grouped[key], event);
        });

        return Object.values(grouped).sort((a, b) => {
            const hourA = Number.parseInt(a.period, 10);
            const hourB = Number.parseInt(b.period, 10);

            return hourA - hourB;
        });
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
                end_date: endDate,
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
                end_date: endDate,
            });

            keywordIds?.forEach((id) => {
                paramsEvents.append("keyword_ids", id);
            });

            const responseEvents = await fetch(`/api/events?${paramsEvents.toString()}`);
            const eventsResponse = await responseEvents.json();

            const events = eventsResponse.data ?? [];
            let timeline: TimelinePoint[] = [];

            if (granularity === "week") {
                timeline = buildWeekTimeline(events);
            } else if (granularity === "month") {
                timeline = buildMonthTimeline(events);
            } else {
                timeline = buildDayTimeline(events);
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
        loading,
        error,
        refetch: fetchStats,
    };
}