'use client';

import { useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg, EventInput } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import { LegalEventWithCase } from '../types';
import { getTipoEventoInfo } from '../constants';

type Props = {
  events: LegalEventWithCase[];
  onDateClick: (dateStr: string) => void;
  onEventClick: (event: LegalEventWithCase) => void;
};

export function CalendarView({ events, onDateClick, onEventClick }: Props) {
  const calendarRef = useRef<FullCalendar>(null);

  // Transformar eventos de BD al formato que espera FullCalendar
  const calendarEvents: EventInput[] = useMemo(() => {
    return events.map((e) => {
      const tipo = getTipoEventoInfo(e.tipo);
      const duracion = e.duracion_min ?? 60;
      const startDate = new Date(e.fecha_hora);
      const endDate = new Date(startDate.getTime() + duracion * 60 * 1000);

      return {
        id: e.id,
        title: e.titulo,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: e.completado ? '#9ca3af' : tipo.hex,
        borderColor: e.completado ? '#6b7280' : tipo.hex,
        textColor: '#ffffff',
        classNames: e.completado ? ['opacity-60', 'line-through'] : [],
        extendedProps: {
          tipo: e.tipo,
          completado: e.completado,
          originalEvent: e,
        },
      };
    });
  }, [events]);

  const handleDateClick = (arg: DateClickArg) => {
    // Formatear fecha para input datetime-local
    // arg.date es la fecha clickeada a medianoche
    const date = arg.date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Si hace click en un día vacío, default a 09:00
    // Si hace click en un slot de hora específica, usa esa hora
    let hour = '09';
    let minute = '00';
    
    if (arg.date.getHours() > 0 || arg.date.getMinutes() > 0) {
      hour = String(date.getHours()).padStart(2, '0');
      minute = String(date.getMinutes()).padStart(2, '0');
    }
    
    const dateStr = `${year}-${month}-${day}T${hour}:${minute}`;
    onDateClick(dateStr);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const original = arg.event.extendedProps.originalEvent as LegalEventWithCase;
    if (original) {
      onEventClick(original);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <style jsx global>{`
        .fc {
          font-family: inherit;
        }
        .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
          text-transform: capitalize;
        }
        .fc .fc-button-primary {
          background-color: #1e293b;
          border-color: #1e293b;
        }
        .fc .fc-button-primary:hover {
          background-color: #0f172a;
          border-color: #0f172a;
        }
        .fc .fc-button-primary:disabled {
          background-color: #64748b;
          border-color: #64748b;
        }
        .fc .fc-button-active {
          background-color: #0f172a !important;
          border-color: #0f172a !important;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #fef3c7 !important;
        }
        .fc .fc-col-header-cell {
          background-color: #f9fafb;
          padding: 0.5rem 0;
          text-transform: uppercase;
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          letter-spacing: 0.05em;
        }
        .fc .fc-event {
          cursor: pointer;
          font-size: 0.75rem;
          padding: 2px 4px;
          border-radius: 4px;
          border-width: 2px;
        }
        .fc .fc-event:hover {
          opacity: 0.85;
        }
        .fc .fc-daygrid-day-number {
          padding: 0.5rem;
          font-size: 0.875rem;
          color: #374151;
        }
      `}</style>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={esLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        buttonText={{
          today: 'Hoy',
          month: 'Mes',
          week: 'Semana',
          day: 'Día',
        }}
        events={calendarEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        height="auto"
        contentHeight={650}
        dayMaxEvents={3}
        moreLinkText={(n) => `+${n} más`}
        firstDay={1} // Lunes como primer día de la semana
        slotMinTime="07:00:00"
        slotMaxTime="20:00:00"
        allDaySlot={false}
        nowIndicator={true}
        weekends={true}
        eventDisplay="block"
      />
    </div>
  );
}