'use client';

// Benötigte Module von React und FullCalendar laden
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Eigene Hooks und Datentypen importieren
import { useCalendar } from '@/hooks/useCalendar';
import { EventWithKeywords } from '@/types';

export default function CalendarView() {
  // Daten und Lade-Status aus dem Hook beziehen
  const { events, isLoading, fetchEvents } = useCalendar();
  
  // State: Steuert, ob das Eingabefenster (Modal) sichtbar ist
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State: Speichert die Start- und Endzeit des im Kalender markierten Bereichs
  const [selectedDates, setSelectedDates] = useState<{start: string, end: string} | null>(null);

  // Beim Laden der Komponente: Termine für den aktuellen Monat abrufen
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    fetchEvents(start, end);
  }, []);

  // Funktion: Wird aufgerufen, wenn ein Zeitraum im Kalender markiert wird
  const handleSelect = (selectInfo: any) => {
    // 1. Die gewählten Zeiten im State speichern
    setSelectedDates({
      start: selectInfo.startStr,
      end: selectInfo.endStr
    });
    // 2. Das Modal-Fenster öffnen
    setIsModalOpen(true);
    // 3. Die blaue Markierung im Kalender wieder entfernen
    selectInfo.view.calendar.unselect();
  };

  return (
    <div className="p-4 h-full bg-white rounded-lg shadow relative">
      {/* Status-Anzeige während des Datenabrufs */}
      {isLoading && <p className="text-sm text-gray-500 mb-4">Lade Termine...</p>}
      
      {/* Kalender-Komponente mit Konfiguration */}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek" // Startansicht: Woche
        selectable={true}         // Ermöglicht das Markieren von Zeiträumen
        selectMirror={true}       // Zeigt eine Vorschau während des Ziehens
        select={handleSelect}     // Verknüpfung mit unserer Funktion oben
        locale="de"               // Deutsche Spracheinstellungen
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        // Daten für die Anzeige im Kalender aufbereiten
        events={events.map((event: EventWithKeywords) => ({
          id: event.id,
          title: event.label || 'Unbenannt',
          start: event.start_time,
          end: event.end_time,
          backgroundColor: event.keywords?.[0]?.color || '#3b82f6'
        }))}
        height="80vh"
      />

      {/* Overlay-Fenster (Modal) für die Event-Erstellung */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Neuer Termin</h2>
            <p className="text-gray-600 mb-6 font-sans">
              Zeitraum ausgewählt. Hier wird das Formular von Modul 3 eingebunden.
            </p>
            {/* Schaltfläche zum Schließen des Fensters */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-full bg-blue-600 text-white py-2 rounded shadow hover:bg-blue-700 transition"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}