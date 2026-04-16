"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { BarTooltip } from "@/components/stats/CustomTooltip";

type KeywordData = {
    keyword_id: string;
    keyword_label: string;
    keyword_color: string;
    minutes: number;
};

type Props = {
    data: KeywordData[];
};

/**
 * KeywordBarChart
 *
 * Ziel:
 * Visualisiert die Lernzeit pro Keyword als Balkendiagramm.
 *
 * Warum:
 * - bessere Übersicht als Text
 * - unterstützt Analyse des Lernverhaltens
 */
export default function KeywordBarChart({ data }: Props) {
    return (
        <div className="w-full h-[360px]">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={data}
                    barCategoryGap="50%"
                    margin={{ top: 10, right: 20, left: 20, bottom: 30 }}
                >
                    <XAxis
                        dataKey="keyword_label"
                        tick={{ fontSize: 12, fill: "#374151" }}
                        tickMargin={12}
                        tickFormatter={(value) =>
                            value.length > 16 ? value.slice(0, 16) + "…" : value
                        }
                        label={{
                            value: "Keyword",
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

                    {/* Custom Tooltip:
                    - zeigt Keyword-Name und Minuten
                    - ersetzt die Standard-Darstellung von Recharts */}
                    <Tooltip content={<BarTooltip />} />

                    <Bar
                        dataKey="minutes"
                        barSize={30}
                        radius={[8, 8, 0, 0]} // abgerundete Balken oben
                    >
                        {data.map((entry) => (
                            <Cell
                                key={entry.keyword_id}
                                fill={entry.keyword_color}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}