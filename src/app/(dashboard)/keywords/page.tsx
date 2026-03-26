"use client";

import { useEffect, useState } from "react";

type Keyword = {
  id: string;
  label: string;
  color: string;
};

export default function Home() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);

  useEffect(() => {
    fetch("/api/keywords")
      .then((res) => res.json())
      .then((data) => setKeywords(data.data || []));
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Meine Keywords</h1>

      {keywords.length === 0 ? (
        <p className="text-base text-gray-500">
          Noch keine Keywords vorhanden
        </p>
      ) : (
        <ul className="space-y-2">
          {keywords.map((k) => (
            <li
              key={k.id}
              className="p-3 border rounded flex justify-between items-center"
            >
              <span className="text-base">{k.label}</span>

              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: k.color }}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}