"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import { useStats } from "@/hooks/useStats";
import KeywordBarChart from "@/components/stats/KeywordBarChart";
import StatsFilterBar from "@/components/stats/StatsFilterBar";

/**
 * StatsPage
 *
 * Ziel:
 * Darstellung der aggregierten Lernstatistiken.
 *
 * Architektur:
 * - UI-Komponente (keine Fetch-Logik)
 * - Daten werden ausschließlich über den useStats Hook geladen
 *
 * Funktionen:
 * - Anzeige von Gesamtlernzeit pro Zeitraum
 * - Anzeige der Lernzeit pro Keyword
 * - Visualisierung über Balkendiagramm
 * - Filterung nach Zeitraum und Granularität
 */
export default function StatsPage() {

    /**
     * State für die aktuellen Filterparameter.
     *
     * Enthält:
     * - startDate / endDate → Zeitraum
     * - granularity → Gruppierung (day / week / month)
     *
     * Wird an den useStats Hook übergeben.
     */
    const [filters, setFilters] = useState({
        startDate: "2024-01-01",
        endDate: "2026-12-31",
        granularity: "week" as "day" | "week" | "month",
    });

    /**
     * Lädt Statistikdaten basierend auf den aktuellen Filtern.
     *
     * Rückgabewerte:
     * - data → aggregierte Daten
     * - loading → Ladezustand
     * - error → Fehlerzustand
     */
    const { data, loading, error } = useStats(filters);

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
                            className="h-14 w-auto"
                            priority
                        />
                    </Link>
                </div>

                {/* Seitenüberschrift */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statistiken</h1>
                </div>

                {/* Filter-Bar zur Steuerung der Daten */}
                <StatsFilterBar
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                    granularity={filters.granularity}
                    onChange={(newFilters) => setFilters(newFilters)}
                />

                {/* Ladezustand */}
                {loading && <p>Lade Daten...</p>}

                {/* Fehleranzeige */}
                {error && <p className="text-red-500">{error}</p>}

                {/* Datenanzeige */}
                {!loading && !error && (
                    <div className="space-y-4">

                        {/* Keine Daten vorhanden */}
                        {data.length === 0 ? (
                            <p>Keine Daten vorhanden</p>
                        ) : (

                            // Darstellung pro Zeitraum
                            data.map((entry) => (
                                <div key={entry.period} className="rounded-xl border bg-white p-6 shadow-sm">

                                    {/* Zeitraum */}
                                    <p>
                                        <strong>Zeitraum:</strong> {entry.period}
                                    </p>

                                    {/* Gesamtminuten */}
                                    <p>
                                        <strong>Gesamtminuten:</strong> {entry.total_minutes}
                                    </p>

                                    {/* Aufschlüsselung nach Keywords */}
                                    {entry.by_keyword.length > 0 && (
                                        <>
                                            <div className="mt-2 space-y-1">
                                                {entry.by_keyword.map((k) => (
                                                    <div key={k.keyword_id} className="flex justify-between">
                                                        <span>{k.keyword_label}</span>
                                                        <span>{k.minutes} min</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Balkendiagramm zur Visualisierung */}
                                            <div className="mt-6 w-full min-h-[300px]">
                                                <KeywordBarChart data={entry.by_keyword} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}