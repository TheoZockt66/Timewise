"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Keyword = {
    id: string;
    label: string;
    color: string; // Hex-Farbe aus DB
};

type Props = {
    keywords: Keyword[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
};

/**
 * KeywordSelect
 *
 * Ziel:
 * - ermöglicht Suche und Auswahl von Keywords
 * - skaliert für viele Einträge
 */
export default function KeywordSelect({
    keywords,
    selectedIds,
    onChange,
}: Props) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    // temporäre Auswahl im Dropdown
    const [tempSelected, setTempSelected] = useState<string[]>(selectedIds);

    const ref = useRef<HTMLDivElement>(null);

    // Filtert Keywords basierend auf Suche
    const filtered = keywords.filter((k) =>
        k.label.toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={ref} className="relative">
            {/* Input */}
            <input
                type="text"
                placeholder="Keyword suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {
                    if (!open) {
                        setTempSelected(selectedIds);
                    }
                    setOpen(true);
                }}
                className="w-full rounded border px-2 py-1"
            />

            {/* Dropdown */}
            {open && (
                <div className="absolute z-10 mt-2 w-full rounded border bg-white shadow">
                    {/* Alle auswählen Checkbox */}
                    <label className="flex items-center gap-2 p-2 border-b cursor-pointer hover:bg-gray-100">
                        <input
                            type="checkbox"
                            checked={
                                filtered.length > 0 &&
                                filtered.every((k) => tempSelected.includes(k.id))
                            }
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setTempSelected(filtered.map((k) => k.id));
                                } else {
                                    setTempSelected([]);
                                }
                            }}
                        />
                        <span className="font-medium">
                            {search ? "Gefilterte auswählen" : "Alle auswählen"}
                        </span>
                    </label>
                    <div className="max-h-60 overflow-y-auto">
                        {filtered.map((k) => (
                            <label
                                key={k.id}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer ${tempSelected.includes(k.id)
                                    ? "bg-purple-100"
                                    : "hover:bg-gray-100"
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={tempSelected.includes(k.id)}
                                    onChange={(e) => {
                                        const newIds = e.target.checked
                                            ? [...tempSelected, k.id]
                                            : tempSelected.filter((id) => id !== k.id);

                                        setTempSelected(newIds);
                                    }}
                                />
                                <div className="flex items-center gap-2 min-w-0">
                                    {/* Farbpunkt */}
                                    <span
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: k.color }}
                                    />

                                    {/* Label */}
                                    <span
                                        className="truncate max-w-[160px]"
                                        title={k.label}
                                    >
                                        {k.label}
                                    </span>
                                </div>
                            </label>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="border-t p-3 flex gap-2">
                        {/* Abbrechen */}
                        <Button
                            variant="outline"
                            className="flex-1 h-11"
                            onClick={() => {
                                setTempSelected(selectedIds); // Änderungen verwerfen
                                setOpen(false);
                            }}
                        >
                            Abbrechen
                        </Button>

                        {/* Übernehmen */}
                        <Button
                            className="flex-1 h-11"
                            onClick={() => {
                                onChange(tempSelected);
                                setOpen(false);
                            }}
                        >
                            Übernehmen
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}