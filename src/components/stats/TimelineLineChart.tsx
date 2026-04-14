"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import CustomTooltip from "@/components/stats/CustomTooltip";

type DataPoint = {
    period: string;
    total_minutes: number;
};

type Props = {
    data: DataPoint[];
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
export default function TimelineLineChart({ data }: Props) {
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

                    <Tooltip content={<CustomTooltip />} />

                    <Line
                        type="linear"
                        dataKey="total_minutes"
                        stroke="#7700F4"
                        strokeWidth={2}
                        dot={{ r: 6 }}
                        connectNulls={true}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}