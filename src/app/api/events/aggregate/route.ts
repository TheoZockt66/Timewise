import { NextResponse } from "next/server";
import { fetchEvents } from "@/lib/services/event.service";
import type { AggregatedTime } from "@/types";
import {
    buildTimeRange,
    getAggregatePeriodLabel,
    type StatsGranularity,
    splitEventByDay,
} from "@/lib/stats";

/**
 * GET /api/events/aggregate
 *
 * Ziel:
 * Liefert aggregierte Lernzeiten basierend auf vorhandenen Events.
 *
 * Hinweis:
 * Mehrtägige Events werden vor der Gruppierung an Tagesgrenzen aufgeteilt,
 * damit jede Tagesportion korrekt im jeweiligen Zeitraum landet.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const start_date = searchParams.get("start_date") || undefined;
    const end_date = searchParams.get("end_date") || undefined;
    const keyword_ids = searchParams.getAll("keyword_ids");

    const result = await fetchEvents({
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

    const granularityParam = searchParams.get("granularity");
    const granularity: StatsGranularity =
        granularityParam === "day" ||
            granularityParam === "month" ||
            granularityParam === "week"
            ? granularityParam
            : "week";

    const range = buildTimeRange(start_date, end_date);
    const grouped = new Map<
        string,
        {
            period: string;
            total_minutes: number;
            by_keyword: Record<
                string,
                {
                    keyword_id: string;
                    keyword_label: string;
                    keyword_color: string;
                    minutes: number;
                }
            >;
        }
    >();

    const daySlices = (result.data || [])
        .flatMap((event) => splitEventByDay(event, range))
        .sort((left, right) => left.start.getTime() - right.start.getTime());

    daySlices.forEach((slice) => {
        const period = getAggregatePeriodLabel(slice.start, granularity);

        if (!grouped.has(period)) {
            grouped.set(period, {
                period,
                total_minutes: 0,
                by_keyword: {},
            });
        }

        const entry = grouped.get(period);

        if (!entry) {
            return;
        }

        entry.total_minutes += slice.minutes;

        slice.event.keywords.forEach((keyword) => {
            if (!entry.by_keyword[keyword.id]) {
                entry.by_keyword[keyword.id] = {
                    keyword_id: keyword.id,
                    keyword_label: keyword.label,
                    keyword_color: keyword.color,
                    minutes: 0,
                };
            }

            entry.by_keyword[keyword.id].minutes += slice.minutes;
        });
    });

    const response: AggregatedTime[] = Array.from(grouped.values()).map((entry) => ({
        period: entry.period,
        total_minutes: entry.total_minutes,
        by_keyword: Object.values(entry.by_keyword),
    }));

    return NextResponse.json({
        data: response,
        error: null,
    });
}
