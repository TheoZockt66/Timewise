"use client";

import { useStats } from "@/hooks/useStats";
import Link from "next/link";
import Image from "next/image";

/**
 * StatsPage
 *
 * Ziel:
 * Erste Darstellung der Statistikdaten.
 *
 * Hinweis:
 * - Nutzt ausschließlich den useStats Hook
 * - Keine eigene Fetch-Logik (Separation of Concerns)
 */
export default function StatsPage() {
    // Beispielhafte Parameter (später durch Filter ersetzbar)
    const { data, loading, error } = useStats({
        startDate: "2024-01-01",
        endDate: "2026-12-31",
        granularity: "week",
    });

    return (
        <main className="min-h-screen bg-muted/30 px-4 py-8">
            <div className="mx-auto max-w-4xl space-y-6">

                {/* Logo → Navigation zurück zur Startseite */}
                <div className="flex items-center justify-between mb-6">
                    <Link href="/" className="inline-block">
                        <Image
                            src="/timewise-logo.svg"
                            alt="Timewise Logo"
                            width={56}
                            height={56}
                            className="h-14 w-auto"
                            priority
                            style={{ width: "auto" }}
                        />
                    </Link>
                </div>

                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Statistiken</h1>
                </div>

                {loading && <p>Lade Daten...</p>}

                {error && <p className="text-red-500">{error}</p>}

                {!loading && !error && (
                    <div className="space-y-4">
                        {data.length === 0 ? (
                            <p>Keine Daten vorhanden</p>
                        ) : (
                            data.map((entry) => (
                                <div key={entry.period} className="border p-4 rounded">
                                    <p><strong>Zeitraum:</strong> {entry.period}</p>
                                    <p><strong>Gesamtminuten:</strong> {entry.total_minutes}</p>

                                    {entry.by_keyword.length > 0 && (
                                        <div className="mt-2">
                                            {entry.by_keyword.map((k) => (
                                                <p key={k.keyword_id}>
                                                    {k.keyword_label}: {k.minutes} Minuten
                                                </p>
                                            ))}
                                        </div>
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