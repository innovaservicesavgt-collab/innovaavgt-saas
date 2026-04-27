'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, CalendarDays, List } from 'lucide-react';
import { EventsList } from './events-list';
import { EventFormDialog } from './event-form-dialog';
import { CalendarView } from './calendar-view';
import { LegalEventWithCase } from '../types';
import { cn } from '@/lib/utils';

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};

type Props = {
  initialEvents: LegalEventWithCase[];
  cases: CaseOption[];
};

type ViewMode = 'calendar' | 'list';

export function CalendarPageClient({ initialEvents, cases }: Props) {
  const [editingEvent, setEditingEvent] = useState<LegalEventWithCase | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  const handleNew = () => {
    setEditingEvent(null);
    setDefaultDate(undefined);
    setFormOpen(true);
  };

  const handleEdit = (event: LegalEventWithCase) => {
    setEditingEvent(event);
    setDefaultDate(undefined);
    setFormOpen(true);
  };

  const handleDateClick = (dateStr: string) => {
    setEditingEvent(null);
    setDefaultDate(dateStr);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header con toggle y botón crear */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Calendario
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            {initialEvents.length === 0
              ? 'Sin eventos'
              : `${initialEvents.length} evento(s)`}
          </div>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo evento
          </Button>
        </div>
      </div>

      {/* Vista según modo seleccionado */}
      {viewMode === 'calendar' ? (
        <CalendarView
          events={initialEvents}
          onDateClick={handleDateClick}
          onEventClick={handleEdit}
        />
      ) : (
        <EventsList events={initialEvents} onEdit={handleEdit} />
      )}

      {/* Modal compartido */}
      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingEvent={editingEvent}
        cases={cases}
        defaultDate={defaultDate}
      />
    </div>
  );
}