'use client';

import React from 'react';

// Das ist eine Attrappe für M3
export function EventForm() {
  return (
    <div className="bg-gray-100 p-6 rounded-lg text-center border-2 border-dashed border-gray-300">
      <h3 className="text-lg font-bold mb-2">Formular-Platzhalter</h3>
      <p className="text-gray-600 mb-4">
        Formular (Modul 3) noch in Arbeit.
      </p>
      
      {/* Fake-Button, damit es nach etwas aussieht */}
      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Speichern (Simulation)
      </button>
    </div>
  );
}
