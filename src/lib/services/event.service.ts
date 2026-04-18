"use server"

import type {
  EventWithKeywords,
  ApiResponse,
} from "@/types";
import { validateEvent } from "@/lib/validators/event.validator";
import { createClient } from "@/lib/supabase/server";;

/**
 * ─── EVENT SERVICE ───
 * 
 * Client-seitige Event-API-Abstraktion.
 * Diese Datei bleibt clientseitig, damit keine serverseitigen Next.js-Header importiert werden.
 */

export type CreateEventRequest = {
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  keyword_ids: string[]; // UUIDs der Keywords
  label?: string;
  description?: string;
}

export interface EventQueryParams {
  start_date?: string;
  end_date?: string;
  keyword_ids?: string[];
}

/**
 * Hilfsfunktion: Konvertiert HTTP-Error in standardisiertes Format.
 * (DRY Prinzip: wird in allen API-Funktionen genutzt)
 */
function handleApiError(response: Response) {
  return {
    code: "API_ERROR",
    message: `HTTP ${response.status}: ${response.statusText}`,
    details: undefined,
  };
}

/**
 * Erstellt ein neues Event.
 * POST /api/events
 */
export async function createEvent(
  data: CreateEventRequest
) {

  // Validierung
  const validation = validateEvent({
    startTime: data.start_time,
    endTime: data.end_time,
    keywordIds: data.keyword_ids,
    existingEvents: await fetchEvents().then(res => res.data || []),
    excludeEventId: undefined, // Bei Erstellung gibt es noch kein Event, das ausgeschlossen werden muss
  });

  if (!validation.isValid) {
    return {
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: validation.errors.map(e => e.message).join("; "),
      },
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Wenn kein User vorhanden ist → Zugriff verweigern
  if (!user) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Nicht eingeloggt",
      },
    };
  }

  const { data: newEvent, error } = await supabase
    .from("events")
    .insert({
      start_time: data.start_time,
      end_time: data.end_time,
      label: data.label,
      description: data.description,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: {
        code: "CREATE_FAILED",
        message: "Speichern des Events fehlgeschlagen.",
        details: error.message,
      },
    };
  }

  // Event-Keyword-Zuordnungen in der Zwischentabelle speichern
  if (data.keyword_ids.length > 0) {
    const { error: keywordError } = await supabase
      .from("event_keywords")
      .insert(
        data.keyword_ids.map((keyword_id) => ({
          event_id: newEvent.id,
          keyword_id,
        }))
      );

    if (keywordError) {
      // Optional: Event löschen, wenn Zuordnungen fehlschlagen, um Inkonsistenzen zu vermeiden
      await supabase.from("events").delete().eq("id", newEvent.id);

      return {
        data: null,
        error: {
          code: "CREATE_FAILED",
          message: "Fehler beim Speichern der Event-Keywords.",
          details: keywordError.message,
        },
      };
    }
  }

  return {
    data: await getEventWithKeywords(newEvent.id, user.id),
    error: null,
  };

}

/**
 * Ruft Events für einen Zeitraum ab (serverseitig).
 * Wird von API-Route GET /api/events verwendet.
 */
export async function fetchEvents(
  params?: EventQueryParams
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Nicht eingeloggt",
      },
    };
  }

  // Basis-Query: Events des Users mit Keywords
  let query = supabase
    .from("events")
    .select(`
      *,
      event_keywords (
        keyword_id,
        keywords (
          id,
          label,
          color
        )
      )
    `)
    .eq("user_id", user.id);

  // Filter nach start_date
  if (params?.start_date) {
    query = query.gte("start_time", params.start_date);
  }

  // Filter nach end_date
  if (params?.end_date) {
    query = query.lte("end_time", params.end_date);
  }

  const { data, error } = await query;

  if (error) {
    return {
      data: null,
      error: {
        code: "FETCH_FAILED",
        message: "Events konnten nicht geladen werden.",
        details: error.message,
      },
    };
  }

  // Transformiere Daten in EventWithKeywords Format
  const eventsWithKeywords: EventWithKeywords[] = data.map((event: any) => ({
    ...event,
    keywords: event.event_keywords?.map((ek: any) => ek.keywords) || [],
    duration_minutes: Math.round(
      (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60)
    ),
  }));
  
  /**
 * Hinweis:
 * Supabase unterstützt Filter auf verschachtelten Relationen (event_keywords)
 * in Kombination mit select() nicht zuverlässig.
 *
 * Daher wird der Keyword-Filter nachträglich im Service angewendet,
 * um konsistentes Verhalten sicherzustellen.
 */
  let filteredEvents = eventsWithKeywords;

  if (params?.keyword_ids?.length) {
    filteredEvents = eventsWithKeywords.filter((event) =>
      event.keywords.some((k) =>
        params.keyword_ids!.includes(k.id)
      )
    );
  }

  return {
    data: filteredEvents,
    error: null,
  };
}

/**
 * Aktualisiert ein bestehendes Event (serverseitig).
 * Wird von API-Route PUT /api/events/:id verwendet.
 */
export async function updateEvent(
  id: string,
  data: Partial<CreateEventRequest>
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: {
        code: "UNAUTHORIZED",
        message: "Nicht eingeloggt",
      },
    };
  }

  // Validierung, wenn Zeitdaten geändert werden
  if (data.start_time || data.end_time || data.keyword_ids) {
    // Hole das aktuelle Event, um zu prüfen, ob sich die Daten tatsächlich geändert haben
    const { data: currentEvent, error: fetchError } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      return {
        data: null,
        error: {
          code: "FETCH_FAILED",
          message: "Event konnte nicht gefunden werden.",
          details: fetchError.message,
        },
      };
    }

    // Prüfe, ob sich die Zeitdaten tatsächlich geändert haben
    const timeChanged = data.start_time !== undefined && data.start_time !== currentEvent.start_time ||
      data.end_time !== undefined && data.end_time !== currentEvent.end_time;

    if (timeChanged) {
      // Hole Events für Overlap-Check nur im gleichen Zeitraum
      const startDate = data.start_time ? new Date(data.start_time).toISOString().split('T')[0] :
        new Date(currentEvent.start_time).toISOString().split('T')[0];
      const endDate = data.end_time ? new Date(data.end_time).toISOString().split('T')[0] :
        new Date(currentEvent.end_time).toISOString().split('T')[0];

      const existingEvents = await fetchEvents({
        start_date: startDate,
        end_date: endDate,
      });

      const validation = validateEvent({
        startTime: data.start_time || currentEvent.start_time,
        endTime: data.end_time || currentEvent.end_time,
        keywordIds: data.keyword_ids || [], // Keywords werden separat behandelt
        existingEvents: existingEvents.data || [],
        excludeEventId: id, // Das aktuelle Event beim Overlap-Check ausschließen
      });

      if (!validation.isValid) {
        return {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: validation.errors.map(e => e.message).join("; "),
          },
        };
      }
    }
  }

  // Event aktualisieren
  const { data: updatedEvent, error } = await supabase
    .from("events")
    .update({
      start_time: data.start_time,
      end_time: data.end_time,
      label: data.label,
      description: data.description,
    })
    .eq("id", id)
    .eq("user_id", user.id) // Zusätzliche Sicherheit: nur eigene Events bearbeiten
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: {
        code: "UPDATE_FAILED",
        message: "Event konnte nicht aktualisiert werden.",
        details: error.message,
      },
    };
  }

  // Keyword-Zuordnungen aktualisieren, falls angegeben
  if (data.keyword_ids !== undefined) {

    // Alte Zuordnungen löschen
    await supabase
      .from("event_keywords")
      .delete()
      .eq("event_id", id);

    // Neue Zuordnungen erstellen
    const { error: keywordError } = await supabase
      .from("event_keywords")
      .insert(
        data.keyword_ids.map((keyword_id) => ({
          event_id: id,
          keyword_id,
        }))
      );

    if (keywordError) {
      return {
        data: null,
        error: {
          code: "UPDATE_FAILED",
          message: "Fehler beim Aktualisieren der Event-Keywords.",
          details: keywordError.message,
        },
      };
    }
  }

  // Hole das aktualisierte Event mit Keywords
  const eventWithKeywords = await getEventWithKeywords(id, user.id);
  if (!eventWithKeywords) {
    return {
      data: null,
      error: {
        code: "FETCH_FAILED",
        message: "Aktualisiertes Event konnte nicht geladen werden.",
      },
    };
  }

  return {
    data: eventWithKeywords,
    error: null,
  };
}

/**
 * Hilfsfunktion: Event mit Keywords laden
 */
async function getEventWithKeywords(eventId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      event_keywords (
        keyword_id,
        keywords (
          id,
          label,
          color
        )
      )
    `)
    .eq("id", eventId)
    .eq("user_id", userId)
    .single();

  if (error) {
    return null;
  }

  // Transformiere in EventWithKeywords Format
  return {
    ...data,
    keywords: data.event_keywords?.map((ek: any) => ek.keywords) || [],
    duration_minutes: Math.round(
      (new Date(data.end_time).getTime() - new Date(data.start_time).getTime()) / (1000 * 60)
    ),
  };
}

/**
 * Löscht ein Event.
 * DELETE /api/events/:id
 */
export async function deleteEvent(
  id: string
) {
  // Schritt 1: Verbindung zur Datenbank herstellen
  const supabase = await createClient();

  // Schritt 2: Event mit der passenden ID löschen
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  // Schritt 3: Fehlerbehandlung, falls die Datenbankoperation fehlschlägt
  if (error) {
    return {
      data: null,
      error: {
        code: "DELETE_FAILED",
        message: "Event konnte nicht gelöscht werden.",
        details: error.message,
      },
    };
  }

  // Erfolgsfall: Kein Fehler bedeutet, dass das Löschen erfolgreich war
  return {
    data: null,
    error: null,
  };
}
