"use client";

import { useEffect, useState } from "react";

type Keyword = {
  id: string;
  label: string;
  color: string;
};

export default function Home() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#000000");

  useEffect(() => {
    fetch("/api/keywords")
      .then((res) => res.json())
      .then((data) => setKeywords(data.data || []));
  }, []);

  const handleCreate = async () => {
    const res = await fetch("/api/keywords", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        label: newLabel,
        color: newColor,
      }),
    });

    const result = await res.json();
    console.log("RESULT:", result);

    if (!result.error) {
      const refreshed = await fetch("/api/keywords");
      const refreshedData = await refreshed.json();

      setKeywords(refreshedData.data || []);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/keywords/${id}`, {
      method: "DELETE",
    });

    // Liste neu laden
    setKeywords((prev) => prev.filter((k) => k.id !== id));
  };

  const handleUpdate = async (id: string) => {
    await fetch(`/api/keywords/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        label: editLabel,
        color: editColor,
      }),
    });

    // UI aktualisieren
    setKeywords((prev) =>
      prev.map((k) =>
        k.id === id
          ? { ...k, label: editLabel, color: editColor }
          : k
      )
    );

    setEditingId(null);
  };

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Meine Keywords</h1>

      <div className="mb-4 flex gap-2 items-center">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Neues Keyword"
          className="border px-2 py-1"
        />

        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
        />

        <button
          onClick={handleCreate}
          className="min-w-[44px] min-h-[44px] border rounded"
        >
          Hinzufügen
        </button>
      </div>

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
              <div className="flex items-center gap-2">
                {editingId === k.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="border px-2 py-1 text-base"
                    />

                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-10 h-10"
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: k.color }}
                    />
                    <span className="text-base">{k.label}</span>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                {editingId === k.id ? (
                  <button
                    onClick={() => handleUpdate(k.id)}
                    className="min-w-[44px] min-h-[44px] border rounded text-sm"
                  >
                    Speichern
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(k.id);
                      setEditLabel(k.label);
                      setEditColor(k.color);
                    }}
                    className="min-w-[44px] min-h-[44px] border rounded text-sm"
                  >
                    Bearbeiten
                  </button>
                )}

                <button
                  onClick={() => handleDelete(k.id)}
                  className="min-w-[44px] min-h-[44px] border rounded text-sm text-red-500"
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}