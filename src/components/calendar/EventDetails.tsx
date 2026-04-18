'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EventWithKeywords } from '@/types';
import { EventForm } from '@/components/events/EventForm';
import { deleteEvent } from '@/lib/services/event.service';
import { useToast } from '@/hooks/use-toast';
import { useCalendar } from '@/hooks/useCalendar';
import { Key } from 'lucide-react';
import { KeywordBadges } from '../ui/KeywordBadges';

interface EventDetailsProps {
  event: EventWithKeywords;
  onClose: () => void;
  onUpdate: () => void;
}

export function EventDetails({ event, onClose, onUpdate }: EventDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { fetchEvents } = useCalendar();

  const handleDelete = async () => {
    if (!confirm('Möchtest du diesen Termin wirklich löschen?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteEvent(event.id);

      if (result.error) {
        toast({
          title: 'Fehler',
          description: result.error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erfolgreich',
          description: 'Termin wurde gelöscht.',
        });
        onUpdate();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Termin konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = () => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));

    if (diffMins < 60) {
      return `${diffMins} Minuten`;
    }

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;

    if (mins === 0) {
      return `${hours} Stunde${hours > 1 ? 'n' : ''}`;
    }

    return `${hours} Stunde${hours > 1 ? 'n' : ''} ${mins} Minute${mins > 1 ? 'n' : ''}`;
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold">Termin bearbeiten</h2>
            <p className="text-sm text-text-secondary">Bearbeite die Details deines Lerntermins.</p>
          </div>
          <button
            onClick={() => setIsEditing(false)}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
            aria-label="Bearbeiten abbrechen"
          >
            Abbrechen
          </button>
        </div>

        <EventForm
          initialEvent={event}
          onSuccess={() => {
            setIsEditing(false);
            onUpdate();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg w-full max-w-2xl shadow-xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-text-primary">
            {event.label || 'Unbenannter Termin'}
          </h2>
          {event.description && (
            <p className="text-sm text-text-secondary mt-1">{event.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700 transition"
          aria-label="Details schließen"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-text-primary mb-2">Zeitraum</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Start:</span> {formatDateTime(event.start_time)}
              </div>
              <div>
                <span className="font-medium">Ende:</span> {formatDateTime(event.end_time)}
              </div>
              <div>
                <span className="font-medium">Dauer:</span> {calculateDuration()}
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-text-primary mb-2">Keywords</h3>
            <KeywordBadges keywords={event.keywords} />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          onClick={() => setIsEditing(true)}
          variant="outline"
          className="flex-1"
        >
          Bearbeiten
        </Button>
        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="destructive"
          className="flex-1"
        >
          {isDeleting ? 'Löschen...' : 'Löschen'}
        </Button>
      </div>
    </div>
  );
}