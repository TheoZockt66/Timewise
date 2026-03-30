'use client';

// Wichtige Werkzeuge von React und dem Kalender laden
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Eigenen Daten und Typen laden
import { useCalendar } from '@/hooks/useCalendar';
import { EventWithKeywords } from '@/types';

// NEU: die neue Platzhalter-Datei für Events 
import { EventForm } from '@/components/EventForm';

export default function CalendarView() {
  // Kalender-Daten abrufen (Termine, Lade-Status)
  const { events, isLoading, fetchEvents } = useCalendar();
  
  // Speicher für das Fenster: Ist es offen (true) oder zu (false)?
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Speicher für die Uhrzeiten, die der Nutzer mit der Maus markiert hat
  const [selectedDates, setSelectedDates] = useState<{start: string, end: string} | null>(null);

  // Wenn die Seite zum ersten Mal lädt: Termine für diesen Monat holen
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    fetchEvents(start, end);
  }, []);

  // Diese Funktion startet, wenn du mit der Maus über den Kalender ziehst
  const handleSelect = (selectInfo: any) => {
    // 1. Gewählte Zeiten speichern
    setSelectedDates({ start: selectInfo.startStr, end: selectInfo.endStr });
    // 2. Das Fenster öffnen
    setIsModalOpen(true);
    // 3. Die blaue Markierung im Kalender wieder aufheben
    selectInfo.view.calendar.unselect();
  };

  return (
    <div className="p-4 h-full bg-white rounded-lg shadow relative">
      {/* Zeigt einen Text an, solange die Termine noch laden */}
      {isLoading && <p className="text-sm text-gray-500 mb-4 font-sans">Lade Termine...</p>}
      
      {/* Der eigentliche Kalender */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        selectable={true}       // Erlaubt das Markieren mit der Maus
        selectMirror={true}     // Zeigt an, was man gerade markiert
        select={handleSelect}   // Ruft unsere Funktion von oben auf
        locale="de"             // Alles auf Deutsch
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        // Hier übergeben wir unsere Termine an den Kalender, inkl. Farben
        events={events.map((event: EventWithKeywords) => ({
          id: event.id,
          title: event.label || 'Unbenannt',
          start: event.start_time,
          end: event.end_time,
          backgroundColor: event.keywords?.[0]?.color || '#3b82f6'
        }))}
        height="80vh"
      />

      {/* Das weiße Pop-up Fenster (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Neuer Termin</h2>
            
            {/* NEU: Hier wird jetzt das Formular (der Platzhalter) von Fritz angezeigt */}
            <EventForm />

            {/* Ein einfacher Button, um das Fenster wieder zu schließen */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="mt-4 w-full text-gray-600 py-2 hover:bg-gray-100 rounded transition"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
