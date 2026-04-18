'use client';

// 1. Standard React-Funktionen importieren (für den internen Speicher und automatische Ladevorgänge)
import React, { useState, useEffect } from 'react';

// 2. FullCalendar und seine benötigten Ansichts-Plugins laden
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// 3. Next.js Funktionen für Navigation und optimierte Bilder laden
import HeaderWithBack from "@/components/layout/HeaderWithBack";

// 4. Unsere eigenen, projektspezifischen Daten und Bausteine laden
import { useCalendar } from '@/hooks/useCalendar';
import { EventWithKeywords } from '@/types';
import { EventForm } from '@/components/events/EventForm';
import { EventDetails } from '@/components/calendar/EventDetails';

export default function CalendarView() {
  // Holt die Termine und die Lade-Info aus der Datenbank
  const { events, isLoading, fetchEvents } = useCalendar();

  // Steuert, ob das weiße Fenster (Modal) für neue Termine sichtbar ist
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Steuert, ob das Details-Modal für bestehende Termine sichtbar ist
  const [selectedEvent, setSelectedEvent] = useState<EventWithKeywords | null>(null);

  // Speichert die Uhrzeiten, die der Nutzer mit der Maus markiert
  const [selectedDates, setSelectedDates] = useState<{ start: string, end: string } | null>(null);

  // Wird einmalig beim Laden der Seite ausgeführt, um die aktuellen Termine zu holen
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    fetchEvents(start, end);
  }, []);

  // Wird aufgerufen, wenn jemand einen Zeitraum im Kalender markiert
  const handleSelect = (selectInfo: any) => {
    setSelectedDates({ start: selectInfo.startStr, end: selectInfo.endStr });
    setIsModalOpen(true);
    selectInfo.view.calendar.unselect(); // Entfernt die blaue Auswahlbox wieder
  };

  // Wird aufgerufen, wenn jemand auf einen bestehenden Termin klickt
  const handleEventClick = (clickInfo: any) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
    }
  };

  // Hilfsfunktion zum Aktualisieren der Events nach Änderungen
  const refreshEvents = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    fetchEvents(start, end);
  };

  return (
    // NEU: Ein unsichtbarer Haupt-Container, der alles umschließt
    <div className="flex flex-col h-full">

      {/* 1. LOGO-BEREICH (Ganz oben, außerhalb des weißen Kastens) */}
      <HeaderWithBack />

      {/* 2. DER WEISSE KASTEN (Kalender-Bereich) */}
      <div
        className="p-4 flex-1 bg-white rounded-lg shadow relative"
        // Hier verknüpfen wir die FullCalendar-Farben mit unseren globalen Tailwind-Variablen
        style={{
          '--fc-button-bg-color': 'var(--tw-primary-300)',
          '--fc-button-border-color': 'var(--tw-primary-300)',
          '--fc-button-hover-bg-color': 'var(--tw-primary-400)',
          '--fc-button-hover-border-color': 'var(--tw-primary-400)',
          '--fc-button-active-bg-color': 'var(--tw-primary-400)',
          '--fc-button-active-border-color': 'var(--tw-primary-400)',
          '--fc-today-bg-color': 'var(--tw-surface)',
        } as React.CSSProperties}
      >

        {/* Die Überschrift ist jetzt in dem weißen Kasten */}
        <h1 className="text-2xl font-bold mb-6 text-[#1A1A2E]">Mein Lernkalender</h1>

        {/* Lade-Indikator, falls die Termine noch vom Server abgerufen werden */}
        {isLoading && <p className="text-sm text-gray-500 mb-4 font-sans">Lade Termine...</p>}

        {/* DER EIGENTLICHE KALENDER */}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          selectable={true}
          selectMirror={true}
          select={handleSelect}
          eventClick={handleEventClick}

          // NEU: Ganztags-Spalte ("all-day") ausblenden
          allDaySlot={false}

          // NEU: Monat in der Überschrift voll ausschreiben
          titleFormat={{ year: 'numeric', month: 'long', day: 'numeric' }}

          // Lokalisierung (Deutsch & Wochenstart)
          locale="de"
          firstDay={1}                 // 1 = Montag (0 wäre Sonntag)
          buttonText={{                // Deutsche Buttons
            today: 'Heute',
            month: 'Monat',
            week: 'Woche',
            day: 'Tag',
            list: 'Liste'
          }}

          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          // Hier werden die Termine an den Kalender übergeben und mit der Primärfarbe versehen
          events={events.map((event: EventWithKeywords) => ({
            id: event.id,
            title: event.label || 'Unbenannt',
            start: event.start_time,
            end: event.end_time,
            backgroundColor: '#7700F4',
            borderColor: '#7700F4'
          }))}
          height="80vh"
        />

        {/* MODAL: Das Pop-up Fenster zum Erstellen neuer Termine */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-6">
            <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold">Neuer Termin</h2>
                  <p className="text-sm text-text-secondary">Bitte wähle Datum und Uhrzeit für deine Lernzeit.</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                  aria-label="Modal schließen"
                >
                  Schließen
                </button>
              </div>

              <EventForm
                selectedRange={selectedDates ?? undefined}
                onSuccess={() => {
                  setIsModalOpen(false);
                  const now = new Date();
                  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
                  fetchEvents(start, end);
                }}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        )}

        {/* MODAL: Details-Modal für bestehende Termine */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4 py-6">
            <EventDetails
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onUpdate={refreshEvents}
            />
          </div>
        )}
      </div>
    </div>
  );
}