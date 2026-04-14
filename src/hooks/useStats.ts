import { useCallback, useEffect, useState } from "react";
import type { AggregatedTime } from "@/types";
import type { ApiResponse } from "@/types";
import { fetchEvents } from "@/lib/services/event.service";

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
 * Rückgabewerte des useStats Hooks für die UI.
 *
 * - data → aggregierte Lernzeiten
 * - loading → Ladezustand
 * - error → Fehlermeldung (falls vorhanden)
 * - refetch → manuelles Neuladen der Daten
 */
type UseStatsResult = {
    data: AggregatedTime[];
    timelineData: { period: string; total_minutes: number }[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
};

/**
 * Custom Hook zum Laden von Statistikdaten.
 *
 * Kapselt die Datenlogik für die Statistiken und hält die UI frei von Fetch-Logik.
 *
 * Architektur:
 * UI → Hook → API → Service → Datenbank
 *
 * Verhalten:
 * - Lädt Daten von /api/events/aggregate basierend auf den Filtern
 * - Verwaltet Ladezustand und Fehler
 * - Gibt immer ein stabiles Datenformat an die UI zurück
 */
export function useStats({
    startDate,
    endDate,
    granularity = "week",
    keywordIds = [],
}: UseStatsParams): UseStatsResult {
    const [data, setData] = useState<AggregatedTime[]>([]);

    // State für die geladenen Statistikdaten
    const [timelineData, setTimelineData] = useState<
        { period: string; total_minutes: number }[]
    >([]);

    // State für Ladezustand (z. B. Spinner in UI)
    const [loading, setLoading] = useState(false);

    // State für Fehler (z. B. Anzeige im UI)
    const [error, setError] = useState<string | null>(null);

    // Stabilisiert das Dependency Array, da Arrays sonst bei jedem Render eine neue Referenz haben
    const keywordIdsKey = keywordIds.join(",");

    // ─── Timeline Builder Funktionen ───

    // Woche → Mo–So
    const buildWeekTimeline = (events: any[]) => {
        const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
        const grouped: Record<string, number> = {
            Mo: 0,
            Di: 0,
            Mi: 0,
            Do: 0,
            Fr: 0,
            Sa: 0,
            So: 0,
        };

        const map = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

        events.forEach((event) => {
            const date = new Date(event.start_time);
            const jsDay = date.getDay();
            const dayName = map[jsDay] ?? "Mo";

            grouped[dayName] += event.duration_minutes;
        });

        return days.map((d) => ({
            period: d,
            total_minutes: grouped[d],
        }));
    };

    // Monat → KWs (ALLE Wochen im Zeitraum anzeigen)
    const buildMonthTimeline = (events: any[]) => {

        const grouped: Record<string, number> = {};

        /**
         * Hilfsfunktion zur Berechnung der Kalenderwoche
         * (ISO-Standard → Woche beginnt Montag)
         */
        const getCalendarWeek = (d: Date) => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);

            date.setDate(date.getDate() + 4 - (date.getDay() || 7));

            const yearStart = new Date(date.getFullYear(), 0, 1);

            return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
        };

        /**
         * 1. Events auf Wochen aggregieren
         */
        events.forEach((event) => {
            const date = new Date(event.start_time);
            const week = getCalendarWeek(date);
            const key = `KW ${week}`;

            grouped[key] = (grouped[key] || 0) + event.duration_minutes;
        });

        /**
         * 2. Start- und Enddatum aus dem Filter verwenden
         */
        const start = new Date(startDate);
        const end = new Date(endDate);

        /**
         * 3. Erste und letzte KW bestimmen
         */
        const startWeek = getCalendarWeek(start);
        const endWeek = getCalendarWeek(end);

        /**
         * 4. ALLE Wochen im Bereich erzeugen
         */
        const fullTimeline = [];

        for (let w = startWeek; w <= endWeek; w++) {
            const key = `KW ${w}`;

            fullTimeline.push({
                period: key,
                total_minutes: grouped[key] || 0,
            });
        }

        return fullTimeline;
    };

    // Tag → Stunden
    const buildDayTimeline = (events: any[]) => {
        const grouped: Record<string, number> = {};

        events.forEach((event) => {
            const date = new Date(event.start_time);
            const key = `${date.getHours()}:00`;

            grouped[key] = (grouped[key] || 0) + event.duration_minutes;
        });

        return Object.entries(grouped).map(([period, total_minutes]) => ({
            period,
            total_minutes,
        }));
    };

    /**
    * Lädt die Statistikdaten vom Backend basierend auf den aktuellen Filtern.
    *
    * useCallback verhindert unnötige Neudefinitionen und reduziert Re-Renders.
    */
    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Query-Parameter für die API zusammenstellen
            const params = new URLSearchParams({
                start_date: startDate,
                end_date: endDate,
                granularity,
            });

            // Optional: mehrere Keywords hinzufügen
            keywordIds?.forEach((id) => {
                params.append("keyword_ids", id);
            });

            // API-Aufruf
            const response = await fetch(`/api/events/aggregate?${params.toString()}`);
            let result: ApiResponse<AggregatedTime[]>;

            try {
                result = await response.json();
            } catch {
                throw new Error("Ungültige Serverantwort.");
            }

            // Fehlerhandling (HTTP oder API-Fehler)
            if (!response.ok || result.error) {
                throw new Error(
                    result.error?.message || "Statistiken konnten nicht geladen werden."
                );
            }

            // Erfolgsfall: Daten im State speichern
            setData(result.data ?? []);

            // ─── Timeline Daten (fein granular) ───
            /**
            * Lädt Events für die Timeline (inkl. Keyword-Filter)
            */
            const paramsEvents = new URLSearchParams({
                start_date: startDate,
                end_date: endDate,
            });

            // Keyword-Filter hinzufügen (wie beim Aggregate-Endpunkt)
            keywordIds?.forEach((id) => {
                paramsEvents.append("keyword_ids", id);
            });

            const responseEvents = await fetch(
                `/api/events?${paramsEvents.toString()}`
            );

            const eventsResponse = await responseEvents.json();

            console.log("EVENTS:", eventsResponse.data);

            if (eventsResponse.data) {
                let timeline: { period: string; total_minutes: number }[] = [];

                if (granularity === "week") {
                    timeline = buildWeekTimeline(eventsResponse.data);
                } else if (granularity === "month") {
                    timeline = buildMonthTimeline(eventsResponse.data);
                } else {
                    timeline = buildDayTimeline(eventsResponse.data);
                }

                console.log("TIMELINE DATA:", timeline);

                setTimelineData(timeline);
            }
        } catch (err) {
            // Fehler sauber behandeln und UI stabil halten
            const message =
                err instanceof Error
                    ? err.message
                    : "Unbekannter Fehler beim Laden der Statistiken.";

            setError(message);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, granularity, keywordIdsKey]);

    /**
    * Lädt die Daten initial und bei Änderung der Filterparameter neu.
    */
    useEffect(() => {
        void fetchStats();
    }, [fetchStats]);

    // Rückgabe für die UI
    return {
        data,
        timelineData,
        loading,
        error,
        refetch: fetchStats,
    };
}