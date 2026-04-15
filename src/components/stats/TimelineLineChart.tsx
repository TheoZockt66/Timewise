"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { LineTooltip } from "@/components/stats/CustomTooltip";

type TimelinePoint = {
    period: string;
    total: number;
    [key: string]: string | number;
};

type Props = {
    data: TimelinePoint[];
    keywordColors: Record<string, string>;
    selectedKeywords: string[];
};

/**
 * TimelineLineChart
 *
 * Ziel:
 * - zeigt Verlauf der gesamten Lernzeit über Zeiträume
 *
 * Darstellung:
 * - X-Achse: Zeitraum (Tag/Woche/Monat)
 * - Y-Achse: Minuten
 */
export default function TimelineLineChart({ data, keywordColors, selectedKeywords }: Props) {
return (
    <div className="w-full h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{ top: 10, right: 20, left: 20, bottom: 40 }}
            >
                <XAxis
                    dataKey="period"
                    tick={{ fontSize: 12, fill: "#374151" }}
                    tickMargin={12}
                    label={{
                        value:
                            data.length > 0 && data[0].period.includes("KW")
                                ? "Kalenderwoche"
                                : data.length > 0 && data[0].period.includes(":")
                                    ? "Uhrzeit"
                                    : "Wochentag",
                        position: "bottom",
                        offset: 10,
                        style: { fill: "#374151", fontSize: 12 },
                    }}
                />

                <YAxis
                    width={60}
                    tick={{ fontSize: 12, fill: "#374151" }}
                    tickMargin={10}
                    label={{
                        value: "Minuten",
                        angle: -90,
                        position: "insideLeft",
                        style: {
                            textAnchor: "middle",
                            fill: "#374151",
                            fontSize: 12,
                        },
                    }}
                />

                <Tooltip content={<LineTooltip />} />

                {/* Gesamtlinie (immer anzeigen, etwas dicker) */}
                <Line
                    type="linear"
                    dataKey="total"
                    stroke="#7700F4"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    connectNulls={true}
                />

                {/* Keyword-Linien (alle Keys über alle Datenpunkte sammeln) */}
                {(() => {
                    const keywordKeys = Array.from(
                        new Set(
                            data.flatMap((entry) =>
                                Object.keys(entry).filter(
                                    (key) =>
                                        key !== "period" &&
                                        key !== "total" &&
                                        selectedKeywords.includes(key)
                                )
                            )
                        )
                    );

                    return keywordKeys.map((key) => (
                        <Line
                            key={key}
                            type="linear"
                            dataKey={key}
                            stroke={keywordColors[key] ?? "#8884d8"}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            opacity={0.75}
                            connectNulls={true}
                        />
                    ));
                })()}
            </LineChart>
        </ResponsiveContainer>
    </div>
);
}