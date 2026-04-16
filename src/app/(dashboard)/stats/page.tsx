"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useStats } from "@/hooks/useStats";
import KeywordBarChart from "@/components/stats/KeywordBarChart";
import StatsFilterBar from "@/components/stats/StatsFilterBar";
import KeywordSelect from "@/components/stats/KeywordSelect";
import TimelineLineChart from "@/components/stats/TimelineLineChart";
import { formatDate } from "@/lib/utils";
import DateNavigation from "@/components/ui/DateNavigation";

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
            start.setMonth(start.getMonth() + factor);
            end.setMonth(end.getMonth() + factor);
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
    const { data, timelineData, loading, error } = useStats(filters);

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
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/timewise-logo.svg"
                            alt="Timewise Logo"
                            width={216}
                            height={56}
                            className="h-14 w-[216px] object-contain"
                            priority
                        />
                    </Link>
                </div>

                {/* Seitenüberschrift */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statistiken</h1>
                </div>

                {/* Filter-Bar zur Steuerung der Daten */}
                {/* Filter-Bereich */}
                <div className="flex gap-6 items-start">

                    {/* Links: Datum + Buttons */}
                    <div className="flex-1">
                        <div className="mb-2">
                            <DateNavigation
                                onPrev={() => shiftPeriod("prev")}
                                onNext={() => shiftPeriod("next")}
                            />
                        </div>
                        <StatsFilterBar
                            startDate={filters.startDate}
                            endDate={filters.endDate}
                            granularity={filters.granularity}
                            keywordIds={filters.keywordIds}
                            onChange={(newFilters) => {

                                // WOCHE → Montag bis Sonntag
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

                                    // MONAT → kompletter Monat
                                } else if (newFilters.granularity === "month") {
                                    const selectedDate = new Date(newFilters.startDate);

                                    // erster Tag des Monats
                                    const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

                                    // letzter Tag des Monats
                                    const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

                                    setFilters({
                                        ...newFilters,
                                        startDate: formatDate(start),
                                        endDate: formatDate(end),
                                    });

                                } else {
                                    // Tag → Start- und Enddatum auf denselben Tag setzen
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

                    {/* Rechts: Keyword Filter */}
                    <div className="w-64">
                        <KeywordSelect
                            keywords={keywords}
                            selectedIds={filters.keywordIds}
                            onChange={(ids) =>
                                setFilters((prev) => ({ ...prev, keywordIds: ids }))
                            }
                        />
                    </div>
                </div>

                {/* Datenanzeige */}
                {loading && <p>Lade Daten...</p>}

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
                            <strong>Gesamtlernzeit:</strong>{" "}
                            {Math.floor(totalTimelineMinutes / 60)}h {totalTimelineMinutes % 60}min
                        </p>

                        {/* Keywords */}
                        <div className="mt-3">
                            <strong>Ausgewählte Keywords:</strong>

                            {filters.keywordIds.length === 0 ? (
                                <p className="mt-2 text-gray-500 italic">
                                    Alle Keywords ausgewählt
                                </p>
                            ) : (
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {keywords
                                        .filter((k) => filters.keywordIds.includes(k.id))
                                        .map((k) => (
                                            <div key={k.id} className="flex items-center gap-2">
                                                <span
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: k.color }}
                                                />
                                                <span
                                                    className="truncate max-w-[160px] cursor-default"
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
                            <p>Keine Daten vorhanden</p>
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
                                                                    className="h-3 w-3 rounded-full"
                                                                    style={{ backgroundColor: k.keyword_color }}
                                                                />
                                                                <span
                                                                    className="truncate max-w-[160px]"
                                                                    title={k.keyword_label}
                                                                >
                                                                    {k.keyword_label}
                                                                </span>
                                                            </div>

                                                            <span>{k.minutes} min</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="mt-6 w-full min-h-[300px]">
                                                    <KeywordBarChart data={entry.by_keyword} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {/* Liniendiagramm: zeigt Verlauf der Lernzeit über den gewählten Zeitraum */}
                                <div className="rounded-xl border bg-white p-6 shadow-sm">
                                    <h2 className="text-lg font-semibold mb-2">
                                        Lernzeit im Zeitverlauf
                                    </h2>

                                    <div className="w-full h-[360px]">
                                        <TimelineLineChart
                                            data={timelineData}
                                            keywordColors={keywordColorMap}
                                            selectedKeywords={keywords
                                                .filter((k) => filters.keywordIds.includes(k.id))
                                                .map((k) => k.label)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </main >
    );
}
