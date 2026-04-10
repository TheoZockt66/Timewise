import { useCallback, useEffect, useState } from "react";
import type { AggregatedTime } from "@/types";
import type { ApiResponse } from "@/types";

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
    // State für die geladenen Statistikdaten
    const [data, setData] = useState<AggregatedTime[]>([]);

    // State für Ladezustand (z. B. Spinner in UI)
    const [loading, setLoading] = useState(false);

    // State für Fehler (z. B. Anzeige im UI)
    const [error, setError] = useState<string | null>(null);

    // Stabilisiert das Dependency Array, da Arrays sonst bei jedem Render eine neue Referenz haben
    const keywordIdsKey = keywordIds.join(",");

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
        loading,
        error,
        refetch: fetchStats,
    };
}