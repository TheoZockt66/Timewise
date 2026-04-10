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
        <div className="w-full h-72">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} barCategoryGap="50%">
                    <XAxis
                        dataKey="keyword_label"
                        tick={{ fontSize: 14 }}
                    />

                    <YAxis
                        tick={{ fontSize: 12 }}
                    />

                    <Tooltip
                        formatter={(value) => `${value} Minuten`}
                    />

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