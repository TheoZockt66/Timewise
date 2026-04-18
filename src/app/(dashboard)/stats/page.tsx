"use client";

import { useState } from "react";
import HeaderWithBack from "@/components/layout/HeaderWithBack";
import { useEffect } from "react";
import { useStats } from "@/hooks/useStats";
import KeywordBarChart from "@/components/stats/KeywordBarChart";
import StatsFilterBar from "@/components/stats/StatsFilterBar";
import KeywordSelect from "@/components/stats/KeywordSelect";
import TimelineLineChart from "@/components/stats/TimelineLineChart";
import { formatDate } from "@/lib/utils";
import DateNavigation from "@/components/ui/DateNavigation";
import DayTimeline from "@/components/stats/DayTimeline";
import { isColorTooLight } from "@/lib/color.utils";

/**
 * StatsPage
 *
 * Ziel:
 * Darstellung der aggregierten Lernstatistiken.
 *
 * Architektur:
 * - Reine UI-Komponente (keine Fetch-Logik)
 * - Daten werden ausschließlich über den useStats Hook geladen
 *
 * Funktionen:
 * - Anzeige der Gesamtlernzeit pro Zeitraum
 * - Anzeige der Lernzeit pro Keyword (Balkendiagramm)
 * - Darstellung des zeitlichen Verlaufs (Liniendiagramm)
 * - Filterung nach Zeitraum, Granularität und Keywords
 */
export default function StatsPage() {

    /**
    * State für die aktuellen Filterparameter.
    *
    * Enthält:
    * - startDate / endDate → dynamisch gesetzter Zeitraum (aktueller Monat)
    * - granularity → Gruppierung (day / week / month)
    * - keywordIds → ausgewählte Keywords für die Filterung
    *
    * Wird an den useStats Hook übergeben und bestimmt die angezeigten Daten.
    */
    const today = new Date();

    // Montag der aktuellen Woche berechnen
    const startOfWeek = new Date(today);
    const day = today.getDay(); // 0 = Sonntag, 1 = Montag ...

    // Berechnet die Verschiebung zum Montag der aktuellen Woche
    // (Sonntag ist Sonderfall, da getDay() = 0)
    const diff = day === 0 ? -6 : 1 - day;

    startOfWeek.setDate(today.getDate() + diff);

    const [filters, setFilters] = useState({
        startDate: formatDate(startOfWeek),
        endDate: formatDate(today),
        granularity: "week" as "day" | "week" | "month",
        keywordIds: [] as string[],
    });

    /**
    * Navigiert im Zeitraum vor/zurück (← →)
    */
    const shiftPeriod = (direction: "prev" | "next") => {
        const factor = direction === "next" ? 1 : -1;

        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);

        if (filters.granularity === "week") {
            start.setDate(start.getDate() + factor * 7);
            end.setDate(end.getDate() + factor * 7);
        } else if (filters.granularity === "month") {
            const newDate = new Date(start);
            newDate.setMonth(newDate.getMonth() + factor);

            const startOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
            const endOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);

            setFilters({
                ...filters,
                startDate: formatDate(startOfMonth),
                endDate: formatDate(endOfMonth),
            });

            return;
        } else {
            start.setDate(start.getDate() + factor);
            end.setDate(end.getDate() + factor);
        }

        setFilters({
            ...filters,
            startDate: formatDate(start),
            endDate: formatDate(end),
        });
    };

    /**
     * Lädt Statistikdaten basierend auf den aktuellen Filtern.
     *
     * Rückgabewerte:
     * - data → aggregierte Daten
     * - loading → Ladezustand
     * - error → Fehlerzustand
     */
    const { data, timelineData, events, loading, error } = useStats(filters);

    /**
    * Berechnet die Gesamtlernzeit für die Timeline
    * (Summe aller Werte im Verlauf)
    */
    const totalTimelineMinutes = timelineData.reduce(
        (sum, entry: any) => sum + (entry.total || 0),
        0
    );

    /**
    * Zeitraumtext für das Liniendiagramm
    */
    const formatGermanDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

    const timelinePeriodLabel =
        filters.granularity === "month"
            ? new Date(filters.startDate).toLocaleDateString("de-DE", {
                month: "long",
                year: "numeric",
            })
            : formatGermanDate(filters.startDate) +
            " bis " +
            formatGermanDate(filters.endDate);

    // Liste aller verfügbaren Keywords für den Filter
    type Keyword = {
        id: string;
        label: string;
        color: string;
    };

    const [keywords, setKeywords] = useState<Keyword[]>([]);

    const keywordColorMap = Object.fromEntries(
        keywords.map((keyword) => [keyword.label, keyword.color])
    );

    // Lädt alle verfügbaren Keywords für den Filter (Initial Load)
    useEffect(() => {
        fetch("/api/keywords")
            .then((res) => res.json())
            .then((data) => setKeywords(data.data || []));
    }, []);

    return (
        <main className="min-h-screen bg-muted/30 px-4 py-8">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Logo → Navigation zurück zur Startseite */}
                <HeaderWithBack />

                {/* Seitenüberschrift */}
                <div>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold tracking-tight">Statistiken</h1>

                        <div className="w-64 mt-2">
                            <KeywordSelect
                                keywords={keywords}
                                selectedIds={filters.keywordIds}
                                onChange={(ids) =>
                                    setFilters((prev) => ({ ...prev, keywordIds: ids }))
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Filter-Bar kompakt in einer Reihe */}
                <div className="flex items-end gap-6 w-full">

                    {/* LINKS: Pfeile */}
                    <DateNavigation
                        onPrev={() => shiftPeriod("prev")}
                        onNext={() => shiftPeriod("next")}
                    />

                    {/* RECHTS: Filter */}
                    <div className="flex-1">
                        <StatsFilterBar
                            startDate={filters.startDate}
                            endDate={filters.endDate}
                            granularity={filters.granularity}
                            keywordIds={filters.keywordIds}
                            onChange={(newFilters) => {

                                if (newFilters.granularity === "week") {
                                    const selectedDate = new Date(newFilters.startDate);
                                    const day = selectedDate.getDay();
                                    const diffToMonday = day === 0 ? -6 : 1 - day;

                                    const start = new Date(selectedDate);
                                    start.setDate(selectedDate.getDate() + diffToMonday);

                                    const end = new Date(start);
                                    end.setDate(start.getDate() + 6);

                                    setFilters({
                                        ...newFilters,
                                        startDate: formatDate(start),
                                        endDate: formatDate(end),
                                    });

                                } else if (newFilters.granularity === "month") {
                                    const selectedDate = new Date(newFilters.startDate);

                                    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                                    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

                                    setFilters({
                                        ...newFilters,
                                        startDate: formatDate(start),
                                        endDate: formatDate(end),
                                    });

                                } else {
                                    const selectedDate = new Date(newFilters.startDate);

                                    setFilters({
                                        ...newFilters,
                                        startDate: formatDate(selectedDate),
                                        endDate: formatDate(selectedDate),
                                    });
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Datenanzeige */}
                {loading && <p className="text-base text-gray-700">Lade Daten...</p>}

                {/* INFO-KACHEL: Kontextdaten */}
                {!loading && !error && (
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-2">
                            Statistikübersicht
                        </h2>

                        {/* Zeitraum */}
                        <p>
                            <strong>Zeitraum:</strong>{" "}
                            {timelinePeriodLabel}
                        </p>

                        {/* Gesamtlernzeit */}
                        <p>
                            <strong>
                                Gesamtlernzeit
                                {filters.keywordIds.length > 0 ? " (Auswahl)" : ""}:
                            </strong>{" "}
                            {Math.floor(totalTimelineMinutes / 60)}h {totalTimelineMinutes % 60}min
                        </p>

                        {/* Keywords */}
                        <div className="mt-3">
                            <strong>Ausgewählte Keywords:</strong>

                            {filters.keywordIds.length === 0 ? (
                                <p className="mt-2 text-gray-600 italic text-base">
                                    Alle Keywords ausgewählt
                                </p>
                            ) : (
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {keywords
                                        .filter((k) => filters.keywordIds.includes(k.id))
                                        .map((k) => (
                                            <div key={k.id} className="flex items-center gap-2">
                                                <span
                                                    className="h-3 w-3 rounded-full border"
                                                    style={{
                                                        backgroundColor: k.color,
                                                        borderColor: isColorTooLight(k.color) ? "#cfcfcf" : "transparent",
                                                    }}
                                                />
                                                <span
                                                    className="text-base truncate max-w-[160px] cursor-default"
                                                    title={k.label}
                                                >
                                                    {k.label}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Fehleranzeige */}
                {error && <p className="text-red-500">{error}</p>}

                {!loading && !error && (
                    <div className="space-y-4">

                        {data.length === 0 ? (
                            <p className="text-base text-gray-700">Keine Daten vorhanden</p>
                        ) : (
                            <>
                                {/* Karten pro Zeitraum */}
                                {data.map((entry) => (
                                    <div key={entry.period} className="rounded-xl border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold mb-2">
                                            Lernzeit nach Keywords
                                        </h2>

                                        {entry.by_keyword.length > 0 && (
                                            <>
                                                <div className="mt-2 space-y-1">
                                                    {entry.by_keyword.map((k) => (
                                                        <div
                                                            key={k.keyword_id}
                                                            className="flex items-center justify-between max-w-xs"
                                                        >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div
                                                                    className="h-3 w-3 rounded-full border"
                                                                    style={{
                                                                        backgroundColor: k.keyword_color,
                                                                        borderColor: isColorTooLight(k.keyword_color) ? "#cfcfcf" : "transparent",
                                                                    }}
                                                                />
                                                                <span
                                                                    className="text-base truncate max-w-[160px]"
                                                                    title={k.keyword_label}
                                                                >
                                                                    {k.keyword_label}
                                                                </span>
                                                            </div>

                                                            <span className="text-base">{k.minutes} min</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-6 w-full h-[260px]">
                                                    <KeywordBarChart data={entry.by_keyword} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {/* Liniendiagramm: zeigt Verlauf der Lernzeit über den gewählten Zeitraum */}
                                {filters.granularity === "day" ? (
                                    <div className="rounded-xl border bg-white p-6 shadow-sm min-h-[700px]">
                                        <h2 className="text-lg font-semibold mb-4">
                                            Lernzeit im Zeitverlauf
                                        </h2>

                                        <DayTimeline events={events} />
                                    </div>
                                ) : (
                                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                                        <h2 className="text-lg font-semibold mb-2">
                                            Lernzeit im Zeitverlauf
                                        </h2>

                                        <div className="w-full h-[350px]">
                                            <TimelineLineChart
                                                data={timelineData}
                                                keywordColors={keywordColorMap}
                                                selectedKeywords={keywords
                                                    .filter((k) => filters.keywordIds.includes(k.id))
                                                    .map((k) => k.label)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </main >
    );
}
