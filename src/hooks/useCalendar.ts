import { useState } from 'react';
import { EventWithKeywords } from '@/types';

export function useCalendar() {
  // Unsere "Gedächtnis-Boxen" (States)
  const [events, setEvents] = useState<EventWithKeywords[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funktion, die die Termine aus dem Internet holt
  const fetchEvents = async (startDate: string, endDate: string) => {
    setIsLoading(true); // "Achtung, ich lade jetzt!"
    setError(null);     // Alte Fehler löschen

    try {
      // Aufruf API von Modul 3 
      const response = await fetch(`/api/events?start_date=${startDate}&end_date=${endDate}`);
      const result = await response.json();

      // Gab es einen Fehler von der API?
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Termine in unsere Box speichern
      setEvents(result.data || []);
      
    } catch (err: any) {
      // Fehlertext speichern
      setError(err.message || 'Fehler beim Laden der Kalenderdaten.');
    } finally {
      setIsLoading(false); // fertig mit Laden
    }
  };

  // unsere Boxen und die Funktion für den Kalender zur Verfügung stellen
  return { events, isLoading, error, fetchEvents };
}