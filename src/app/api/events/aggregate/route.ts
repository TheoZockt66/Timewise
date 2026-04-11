import { NextResponse } from "next/server";
import { fetchEventsServer } from "@/lib/services/event.service";

/**
 * GET /api/events/aggregate
 *
 * Ziel:
 * Liefert aggregierte Lernzeiten basierend auf vorhandenen Events.
 *
 * Hinweis:
 * Aggregation erfolgt aktuell nach Zeitraum (day / week / month),
 * Keyword-Aufteilung folgt im nächsten Schritt. 
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const start_date = searchParams.get("start_date") || undefined;
    const end_date = searchParams.get("end_date") || undefined;

    // Events aus Service laden (WICHTIG: keine direkte DB-Abfrage hier!)
    const keyword_ids = searchParams.getAll("keyword_ids");

    const result = await fetchEventsServer({
        start_date,
        end_date,
        keyword_ids,
    });

    if (result.error) {
        console.error("AGGREGATE ERROR:", result.error);

        return NextResponse.json({
            data: null,
            error: result.error,
        }, { status: 500 });
    }

    const events = result.data || [];

    // Bestimmt die Gruppierung der Daten (day / week / month)
    const granularity = searchParams.get("granularity") || "week";

    // Speichert aggregierte Minuten pro Zeitraum (z. B. Woche oder Tag)
    const grouped: Record<string, number> = {};

    // Durchläuft alle Events und ordnet sie einem Zeitraum zu
    events.forEach((event) => {
        const date = new Date(event.start_time);

        let key = "";

        // Gruppierung nach einzelnen Tagen
        if (granularity === "day") {
            key = date.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        }

        // Gruppierung nach Woche → berechnet Start- und Enddatum der Woche
        if (granularity === "week") {
            const day = date.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;

            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() + diffToMonday);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const formatDate = (d: Date) =>
                d.toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                });

            key = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
        }

        // Gruppierung nach Monat
        if (granularity === "month") {
            key = date.toLocaleDateString("de-DE", {
                month: "2-digit",
                year: "numeric",
            });
        }

        if (!grouped[key]) {
            grouped[key] = 0;
        }

        grouped[key] += event.duration_minutes;
    });

    // Umwandlung in das API-Format (AggregatedTime[])
    const response = Object.entries(grouped).map(([period, total_minutes]) => {
        // Keyword-Aggregation für diesen Zeitraum
        const keywordMap: Record<string, {
            keyword_id: string;
            keyword_label: string;
            keyword_color: string;
            minutes: number;
        }> = {};

        events.forEach((event) => {
            const date = new Date(event.start_time);

            // gleiche Logik wie oben → Event gehört zu diesem Zeitraum?
            let eventKey = "";

            if (granularity === "day") {
                eventKey = date.toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                });
            }

            if (granularity === "week") {
                const day = date.getDay();
                const diffToMonday = day === 0 ? -6 : 1 - day;

                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() + diffToMonday);

                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);

                const formatDate = (d: Date) =>
                    d.toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                    });

                eventKey = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
            }

            if (granularity === "month") {
                eventKey = date.toLocaleDateString("de-DE", {
                    month: "2-digit",
                    year: "numeric",
                });
            }

            // Nur Events berücksichtigen, die in diesen Zeitraum gehören
            if (eventKey !== period) return;

            // Keywords des Events durchgehen
            event.keywords.forEach((keyword) => {
                if (!keywordMap[keyword.id]) {
                    keywordMap[keyword.id] = {
                        keyword_id: keyword.id,
                        keyword_label: keyword.label,
                        keyword_color: keyword.color,
                        minutes: 0,
                    };
                }

                keywordMap[keyword.id].minutes += event.duration_minutes;
            });
        });

        return {
            period,
            total_minutes,
            by_keyword: Object.values(keywordMap),
        };
    });

    return NextResponse.json({
        data: response,
        error: null,
    });
}