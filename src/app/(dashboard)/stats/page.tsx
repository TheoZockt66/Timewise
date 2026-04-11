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
     * Lädt Statistikdaten basierend auf den aktuellen Filtern.
     *
     * Rückgabewerte:
     * - data → aggregierte Daten
     * - loading → Ladezustand
     * - error → Fehlerzustand
     */
    const { data, timelineData, loading, error } = useStats(filters);

    // Liste aller verfügbaren Keywords für den Filter
    type Keyword = {
        id: string;
        label: string;
        color: string;
    };

    const [keywords, setKeywords] = useState<Keyword[]>([]);

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
                            width={56}
                            height={56}
                            className="h-14 w-auto object-contain"
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
                        <StatsFilterBar
                            startDate={filters.startDate}
                            endDate={filters.endDate}
                            granularity={filters.granularity}
                            keywordIds={filters.keywordIds}
                            onChange={(newFilters) => setFilters(newFilters)}
                        />
                    </div>

                    {/* Rechts: Keyword Filter */}
                    <div className="w-64">
                        <KeywordSelect
                            keywords={keywords}
                            selectedIds={filters.keywordIds}
                            onChange={(ids) =>
                                setFilters({ ...filters, keywordIds: ids })
                            }
                        />
                    </div>
                </div>

                {/* Datenanzeige */}
                {loading && <p>Lade Daten...</p>}

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

                                        <p>
                                            <strong>Zeitraum:</strong> {entry.period}
                                        </p>

                                        <p>
                                            <strong>Gesamtlernzeit:</strong>{" "}
                                            {Math.floor(entry.total_minutes / 60)}h {entry.total_minutes % 60}min
                                        </p>

                                        {entry.by_keyword.length > 0 && (
                                            <>
                                                <div className="mt-2 space-y-1">
                                                    {entry.by_keyword.map((k) => (
                                                        <div
                                                            key={k.keyword_id}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="h-3 w-3 rounded-full"
                                                                    style={{ backgroundColor: k.keyword_color }}
                                                                />
                                                                <span>{k.keyword_label}</span>
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
                                    <h2 className="text-lg font-semibold mb-4">
                                        Lernzeit-Verlauf
                                    </h2>

                                    <div className="w-full h-[360px]">
                                        <TimelineLineChart data={timelineData} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
