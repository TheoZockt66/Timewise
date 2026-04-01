'use client';

// 1. Standard React-Funktionen importieren (für den internen Speicher und automatische Ladevorgänge)
import React, { useState, useEffect } from 'react';

// 2. FullCalendar und seine benötigten Ansichts-Plugins laden
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// 3. Next.js Funktionen für Navigation und optimierte Bilder laden
import Link from 'next/link';
import Image from 'next/image';

// 4. Unsere eigenen, projektspezifischen Daten und Bausteine laden
import { useCalendar } from '@/hooks/useCalendar';
import { EventWithKeywords } from '@/types';
import { EventForm } from '@/components/EventForm';

export default function CalendarView() {
  // Holt die Termine und die Lade-Info aus der Datenbank
  const { events, isLoading, fetchEvents } = useCalendar();
  
  // Steuert, ob das weiße Fenster (Modal) für neue Termine sichtbar ist
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Speichert die Uhrzeiten, die der Nutzer mit der Maus markiert
  const [selectedDates, setSelectedDates] = useState<{start: string, end: string} | null>(null);

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

  return (
    // NEU: Ein unsichtbarer Haupt-Container, der alles umschließt
    <div className="flex flex-col h-full">
      
      {/* 1. LOGO-BEREICH (Ganz oben, außerhalb des weißen Kastens) */}
      <div className="mb-4">
        {/* Der Link-Befehl sorgt dafür, dass man beim Klicken zur Startseite ("/") navigiert */}
        <Link href="/" className="hover:opacity-80 transition-opacity inline-block">
          {/* Der Image-Befehl lädt das Bild aus dem public-Ordner und optimiert es */}
          <Image 
            src="/timewise-logo.svg"   // Der exakte Dateiname aus eurem public-Ordner
            alt="Timewise Logo"        // Alternativtext für Screenreader
            width={150}                // Anzeigebreite des Logos in Pixeln
            height={40}                // Anzeigehöhe des Logos in Pixeln
            priority                   // Priorisiert das Laden, da es direkt oben im Sichtfeld ist
          />
        </Link>
      </div>

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
          locale="de"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          // Hier werden die Termine an den Kalender übergeben und mit eurer Primärfarbe versehen
          events={events.map((event: EventWithKeywords) => ({
            id: event.id,
            title: event.label || 'Unbenannt',
            start: event.start_time,
            end: event.end_time,
            backgroundColor: event.keywords?.[0]?.color || '#7700F4',
            borderColor: event.keywords?.[0]?.color || '#7700F4'
          }))}
          height="80vh"
        />

        {/* MODAL: Das Pop-up Fenster zum Erstellen neuer Termine */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4">Neuer Termin</h2>
              
              {/* Hier wird der Formular-Platzhalter für Events geladen */}
              <EventForm />
              
              {/* Button zum Schließen des Fensters */}
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
    </div>
  );
} 