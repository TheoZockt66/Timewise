'use client';

// Import der grundlegenden React-Funktionen für State-Management und Nebeneffekte
import React, { useState, useEffect } from 'react';

// Import der Hauptkomponente und der benötigten Plugins von FullCalendar
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Import der projektspezifischen Daten-Schnittstellen (Hooks und Typen)
import { useCalendar } from '@/hooks/useCalendar';
import { EventWithKeywords } from '@/types';

// Import des Formular-Platzhalters für die Terminerstellung
import { EventForm } from '@/components/EventForm';

export default function CalendarView() {
  // Destrukturierung der Rückgabewerte aus dem Custom Hook
  // events: Array der geladenen Termine
  // isLoading: Boolean, der anzeigt, ob gerade Daten vom Server geladen werden
  // fetchEvents: Funktion zum Abrufen neuer Termine für einen bestimmten Zeitraum
  const { events, isLoading, fetchEvents } = useCalendar();
  
  // useState für isModalOpen: Steuert die Sichtbarkeit des Pop-up-Fensters.
  // Standardwert ist 'false' (Fenster ist geschlossen).
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // useState für selectedDates: Speichert die Start- und Endzeit als Objekt.
  // Wird aktualisiert, wenn der Benutzer einen Bereich im Kalender markiert.
  const [selectedDates, setSelectedDates] = useState<{start: string, end: string} | null>(null);

  // useEffect Hook: Wird einmalig beim initialen Rendern der Komponente ausgeführt (leeres Array []).
  // Berechnet den ersten und letzten Tag des aktuellen Monats und ruft die Termine dafür ab.
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    fetchEvents(start, end);
  }, []);

  // Funktion handleSelect: Wird durch das 'select'-Event von FullCalendar aufgerufen.
  // selectInfo enthält die Daten des vom Benutzer markierten Zeitraums.
  const handleSelect = (selectInfo: any) => {
    // 1. Speichert die markierten Zeiten im lokalen State
    setSelectedDates({ start: selectInfo.startStr, end: selectInfo.endStr });
    // 2. Setzt den State auf true, um das Fenster (Modal) zu öffnen
    setIsModalOpen(true);
    // 3. Entfernt die visuelle blaue Markierung im Kalender, nachdem das Fenster offen ist
    selectInfo.view.calendar.unselect();
  };

  return (
    <div 
      // Das Haupt-Layout des Kalenders mit Tailwind-Klassen für Hintergrund und Schatten
      className="p-4 h-full bg-white rounded-lg shadow relative"
      
      // Das style-Attribut überschreibt die internen CSS-Variablen von FullCalendar.
      // Hier werden die Kalenderfarben an die globalen Tailwind-Variablen gebunden.
      style={{
        '--fc-button-bg-color': 'var(--tw-primary-300)',             // Hintergrundfarbe der Buttons
        '--fc-button-border-color': 'var(--tw-primary-300)',         // Rahmenfarbe der Buttons
        '--fc-button-hover-bg-color': 'var(--tw-primary-400)',       // Button-Farbe bei Mausberührung
        '--fc-button-hover-border-color': 'var(--tw-primary-400)',   // Rahmenfarbe bei Mausberührung
        '--fc-button-active-bg-color': 'var(--tw-primary-400)',      // Button-Farbe beim Klicken
        '--fc-button-active-border-color': 'var(--tw-primary-400)',  // Rahmenfarbe beim Klicken
        '--fc-today-bg-color': 'var(--tw-surface)',                  // Hintergrundfarbe der aktuellen Spalte
      } as React.CSSProperties}
    >
      {/* Bedingtes Rendering: Zeigt einen Lade-Text, solange isLoading auf true steht */}
      {isLoading && <p className="text-sm text-gray-500 mb-4 font-sans">Lade Termine...</p>}
      
      {/* Die Hauptkomponente des Kalenders */}
      <FullCalendar
        // Registrierung der benötigten Plugins für Tages-/Wochenansicht und Interaktion
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek" // Die Standardansicht beim Laden der Seite
        selectable={true}          // Aktiviert die Möglichkeit, Zeiten mit der Maus zu markieren
        selectMirror={true}        // Zeigt einen temporären Terminblock während des Ziehens
        select={handleSelect}      // Verknüpft das Auswahl-Event mit der Funktion oben
        locale="de"                // Stellt die Sprache auf Deutsch um (Tage, Monate)
        
        // Konfiguration der oberen Navigationsleiste
        headerToolbar={{
          left: 'prev,next today',                      // Buttons links
          center: 'title',                              // Monat/Jahr in der Mitte
          right: 'dayGridMonth,timeGridWeek,timeGridDay' // Ansichtswechsel rechts
        }}
        
        // Die Termindaten werden für FullCalendar aufbereitet (gemappt)
        events={events.map((event: EventWithKeywords) => ({
          id: event.id,
          title: event.label || 'Unbenannt', // Fallback-Titel, falls keiner vorhanden ist
          start: event.start_time,
          end: event.end_time,
          // Die Farbe wird aus den Keywords des Events bezogen. 
          // Falls keine Farbe definiert ist, wird als Fallback der primäre lila Hex-Code genutzt.
          backgroundColor: event.keywords?.[0]?.color || '#7700F4',
          borderColor: event.keywords?.[0]?.color || '#7700F4'
        }))}
        height="80vh" // Setzt die Höhe des Kalenders auf 80% der Bildschirmhöhe
      />

      {/* Bedingtes Rendering für das Pop-up-Fenster (Modal) */}
      {/* Dieser Block wird nur im HTML eingefügt, wenn isModalOpen den Wert 'true' hat */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Neuer Termin</h2>
            
            {/* Hier wird die Platzhalter-Komponente gerendert */}
            <EventForm />

            {/* Der Schließen-Button ändert den State wieder auf 'false', wodurch das Fenster verschwindet */}
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
