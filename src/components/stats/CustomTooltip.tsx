"use client";

import { isColorTooLight } from "@/lib/color.utils";

/**
 * Gemeinsame Payload-Struktur für Recharts-Tooltips.
 */
type TooltipEntry = {
    name?: string;
    dataKey?: string;
    value?: number | string;
    color?: string;
};

type BaseProps = {
    active?: boolean;
    payload?: TooltipEntry[];
    label?: string;
};

/**
 * Wandelt kurze Wochentags-Kürzel in ausgeschriebene Namen um.
 */
function formatLabel(label?: string) {
    if (!label) {
        return "";
    }

    const weekdayMap: Record<string, string> = {
        Mo: "Montag",
        Di: "Dienstag",
        Mi: "Mittwoch",
        Do: "Donnerstag",
        Fr: "Freitag",
        Sa: "Samstag",
        So: "Sonntag",
    };

    return weekdayMap[label] ?? label;
}

/**
 * Tooltip für das Balkendiagramm.
 *
 * Verhalten:
 * - zeigt genau einen Wert
 * - bleibt bewusst schlicht
 * - entspricht dem alten, einfachen Verhalten
 */
export function BarTooltip({ active, payload, label }: BaseProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const item = payload[0];
    const value = item.value ?? 0;
    const name = label ?? item.name ?? item.dataKey ?? "Wert";

    return (
        <div className="rounded-md border bg-white p-2 shadow max-w-xs break-words">
            <p
                className="font-medium break-words"
                title={name}
            >
                {name}
            </p>
            <p>{value} Minuten</p>
        </div>
    );
}

/**
 * Tooltip für das Liniendiagramm.
 *
 * Verhalten:
 * - zeigt die Beschriftung ausgeschrieben an
 * - zeigt Gesamtlernzeit plus alle Keyword-Werte
 * - bleibt übersichtlich trotz mehrerer Linien
 */
export function LineTooltip({ active, payload, label }: BaseProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div className="rounded-md border bg-white p-4 shadow-sm max-w-sm">
            <p className="font-medium">{formatLabel(label)}</p>

            <div className="mt-2 space-y-1">
                {payload.map((entry, index) => {
                    const rawName = entry.name ?? entry.dataKey ?? "Wert";
                    const displayName =
                        rawName === "total" ? "Gesamtlernzeit" : rawName;

                    const value = entry.value ?? 0;

                    return (
                        <div
                            key={`${displayName}-${index}`}
                            className="flex items-start justify-between gap-4 pl-1"
                        >
                            <div className="flex items-center gap-2 min-w-0 pl-1">
                                <span
                                    className="h-3 w-3 rounded-full shrink-0 border"
                                    style={{
                                        backgroundColor: entry.color ?? "#7700F4",
                                        borderColor: isColorTooLight(entry.color ?? "#7700F4")
                                            ? "#cfcfcf"
                                            : "transparent",
                                    }}
                                />
                                <span
                                    className="break-all"
                                    title={displayName}
                                >
                                    {displayName}
                                </span>
                            </div>

                            <span className="whitespace-nowrap">{value} Minuten</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}