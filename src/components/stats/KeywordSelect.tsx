"use client";

import { useEffect, useRef, useState } from "react";

type Keyword = {
    id: string;
    label: string;
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
                onFocus={() => setOpen(true)}
                className="w-full rounded border px-2 py-1"
            />

            {/* Dropdown */}
            {open && (
                <div className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded border bg-white shadow">
                    {filtered.map((k) => (
                        <label
                            key={k.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100"
                        >
                            <input
                                type="checkbox"
                                checked={selectedIds.includes(k.id)}
                                onChange={(e) => {
                                    const newIds = e.target.checked
                                        ? [...selectedIds, k.id]
                                        : selectedIds.filter((id) => id !== k.id);

                                    onChange(newIds);
                                    setOpen(false);
                                }}
                            />
                            <span>{k.label}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}