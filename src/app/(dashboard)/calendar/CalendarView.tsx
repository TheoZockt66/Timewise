'use client';

import React, { useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendar } from '@/hooks/useCalendar';
// Import für den Datentyp hinzugefügt
import { EventWithKeywords } from '@/types'; 

export default function CalendarView() {
  const { events, isLoading, fetchEvents } = useCalendar();

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    fetchEvents(start, end);
  }, []);

  return (
    <div className="p-4 h-full bg-white rounded-lg shadow">
      {isLoading && <p className="text-sm text-gray-500 font-sans">Lade Termine...</p>}
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale="de"
        // Typ 'EventWithKeywords' explizit zugewiesen
        events={events.map((event: EventWithKeywords) => ({
          id: event.id,
          title: event.label || 'Unbenannt',
          start: event.start_time,
          end: event.end_time,
          backgroundColor: event.keywords?.[0]?.color || '#3b82f6'
        }))}
        height="80vh"
        slotMinTime="07:00:00"
        editable={true}
        selectable={true}
      />
    </div>
  );
}