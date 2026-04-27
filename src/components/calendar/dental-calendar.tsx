'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type {
  EventClickArg,
  EventDropArg,
  DateSelectArg,
  EventInput,
} from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import {
  Plus,
  Filter,
  ChevronDown,
  Users,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  moveAppointment,
  updateAppointmentStatus,
} from '@/server/actions/appointments';
import { AppointmentDetailModal } from './appointment-detail-modal';
import type {
  CalendarAppointment,
  ProfessionalOption,
  ServiceOption,
} from '@/app/(dental)/dental/calendar/page';

type Props = {
  appointments: CalendarAppointment[];
  professionals: ProfessionalOption[];
  services: ServiceOption[];
};

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const STATUS_BG: Record<string, string> = {
  scheduled: '#fbbf24',
  confirmed: '#10b981',
  in_progress: '#3b82f6',
  completed: '#94a3b8',
  cancelled: '#ef4444',
  no_show: '#ef4444',
};

const STATUS_BORDER: Record<string, string> = {
  scheduled: '#f59e0b',
  confirmed: '#059669',
  in_progress: '#2563eb',
  completed: '#64748b',
  cancelled: '#dc2626',
  no_show: '#dc2626',
};

function buildEventDate(date: string, time: string): string {
  const t = time.length === 5 ? `${time}:00` : time;
  return `${date}T${t}`;
}

function formatLocalDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatLocalTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}:00`;
}

// ─────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────
export function DentalCalendar({ appointments, professionals, services }: Props) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [activeProfIds, setActiveProfIds] = useState<Set<string>>(
    () => new Set(professionals.map((p) => p.id))
  );
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Modales
  const [selectedAppt, setSelectedAppt] = useState<CalendarAppointment | null>(null);

  // Eventos para FullCalendar
  const events = useMemo<EventInput[]>(() => {
    return appointments
      .filter((a) => {
        if (!a.professional_id) return true;
        return activeProfIds.has(a.professional_id);
      })
      .map((a) => {
        const start = buildEventDate(a.appointment_date, a.start_time);
        const end = a.end_time
          ? buildEventDate(a.appointment_date, a.end_time)
          : null;

        const profColor = a.professionals?.color;
        const statusColor = STATUS_BG[a.status] || '#64748b';
        const borderColor = profColor || STATUS_BORDER[a.status] || '#475569';

        const patientName = a.patients
          ? `${a.patients.first_name} ${a.patients.last_name}`
          : 'Sin paciente';
        const serviceName = a.services?.name || a.reason || 'Consulta';

        return {
          id: a.id,
          title: `${patientName} · ${serviceName}`,
          start,
          end: end || undefined,
          backgroundColor: statusColor,
          borderColor,
          textColor: '#ffffff',
          extendedProps: { apt: a },
        };
      });
  }, [appointments, activeProfIds]);

  // ─────────────────────── Handlers ───────────────────────
  const handleEventClick = (info: EventClickArg) => {
    const apt = info.event.extendedProps.apt as CalendarAppointment;
    setSelectedAppt(apt);
  };

  const handleEventDrop = async (info: EventDropArg) => {
    const apt = info.event.extendedProps.apt as CalendarAppointment;
    const newStart = info.event.start;
    const newEnd = info.event.end;

    if (!newStart) {
      info.revert();
      return;
    }

    const newDate = formatLocalDate(newStart);
    const newStartTime = formatLocalTime(newStart);
    const newEndTime = newEnd
      ? formatLocalTime(newEnd)
      : formatLocalTime(
          new Date(newStart.getTime() + (apt.duration_minutes || 30) * 60000)
        );

    startTransition(async () => {
      const res = await moveAppointment({
        id: apt.id,
        appointment_date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
      });

      if (!res.ok) {
        toast.error(res.error || 'No se pudo mover la cita');
        info.revert();
      } else {
        toast.success('Cita movida correctamente');
        router.refresh();
      }
    });
  };

  const handleEventResize = async (info: EventResizeDoneArg) => {
    const apt = info.event.extendedProps.apt as CalendarAppointment;
    const newStart = info.event.start;
    const newEnd = info.event.end;

    if (!newStart || !newEnd) {
      info.revert();
      return;
    }

    startTransition(async () => {
      const res = await moveAppointment({
        id: apt.id,
        appointment_date: formatLocalDate(newStart),
        start_time: formatLocalTime(newStart),
        end_time: formatLocalTime(newEnd),
      });

      if (!res.ok) {
        toast.error(res.error || 'No se pudo cambiar la duración');
        info.revert();
      } else {
        toast.success('Duración actualizada');
        router.refresh();
      }
    });
  };

  const handleDateSelect = (info: DateSelectArg) => {
    const date = formatLocalDate(info.start);
    const startTime = formatLocalTime(info.start).slice(0, 5);
    // Vamos a la página de nueva cita con valores pre-llenados
    router.push(
      `/dental/appointments/new?date=${date}&start=${startTime}`
    );
  };

  const toggleProfessional = (id: string) => {
    setActiveProfIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = async (apt: CalendarAppointment, newStatus: string) => {
    startTransition(async () => {
      const res = await updateAppointmentStatus({
        id: apt.id,
        status: newStatus as
          | 'scheduled'
          | 'confirmed'
          | 'in_progress'
          | 'completed'
          | 'cancelled'
          | 'no_show',
      });

      if (!res.ok) {
        toast.error(res.error || 'No se pudo cambiar el estado');
      } else {
        toast.success('Estado actualizado');
        setSelectedAppt(null);
        router.refresh();
      }
    });
  };

  // ─────────────────────── Render ───────────────────────
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Calendario
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona tu agenda con drag & drop
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Filter className="h-4 w-4" />
            Filtros
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <Link
            href="/dental/appointments/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nueva cita
          </Link>
        </div>
      </div>

      {/* PANEL DE FILTROS */}
      {filtersOpen && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-700 uppercase tracking-wide">
            <Users className="h-3.5 w-3.5" />
            Profesionales
          </div>
          <div className="flex flex-wrap gap-2">
            {professionals.length === 0 ? (
              <p className="text-sm text-slate-400 italic">
                No hay profesionales registrados
              </p>
            ) : (
              professionals.map((p) => {
                const active = activeProfIds.has(p.id);
                const color = p.color || '#10b981';
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProfessional(p.id)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium border transition ${
                      active
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-400 line-through opacity-60'
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {p.title ? `${p.title} ` : ''}
                    {p.first_name} {p.last_name}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* LEYENDA DE ESTADOS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
          <span className="font-semibold text-slate-500">Estados:</span>
          <LegendDot color="#fbbf24" label="Pendiente" />
          <LegendDot color="#10b981" label="Confirmada" />
          <LegendDot color="#3b82f6" label="En curso" />
          <LegendDot color="#94a3b8" label="Atendida" />
          <LegendDot color="#ef4444" label="Cancelada" />
        </div>
      </div>

      {/* CALENDARIO */}
      <div
        className={`rounded-3xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          locale={esLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          buttonText={{
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
          }}
          events={events}
          editable
          selectable
          selectMirror
          dayMaxEvents
          weekends
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:15:00"
          slotLabelInterval="01:00"
          allDaySlot={false}
          nowIndicator
          height="auto"
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          select={handleDateSelect}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            startTime: '08:00',
            endTime: '19:00',
          }}
        />
      </div>

      {/* MODAL DE DETALLE */}
      {selectedAppt && (
        <AppointmentDetailModal
          appointment={selectedAppt}
          onClose={() => setSelectedAppt(null)}
          onStatusChange={(newStatus) =>
            handleStatusChange(selectedAppt, newStatus)
          }
          isPending={isPending}
        />
      )}

      {/* Estilos personalizados de FullCalendar */}
      <style jsx global>{`
        .fc {
          font-family: inherit;
        }
        .fc-event {
          border-radius: 6px;
          padding: 2px 6px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          border-left-width: 3px !important;
        }
        .fc-event-title {
          font-weight: 600;
        }
        .fc-toolbar-title {
          font-size: 1.1rem !important;
          font-weight: 700 !important;
          color: #0f172a;
          text-transform: capitalize;
        }
        .fc-button {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #475569 !important;
          padding: 6px 12px !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          border-radius: 8px !important;
          box-shadow: none !important;
          text-transform: capitalize !important;
        }
        .fc-button:hover {
          background-color: #f8fafc !important;
        }
        .fc-button-active,
        .fc-button-primary:not(:disabled).fc-button-active {
          background-color: #10b981 !important;
          border-color: #10b981 !important;
          color: white !important;
        }
        .fc-today-button {
          background-color: #f1f5f9 !important;
        }
        .fc-day-today {
          background-color: #ecfdf5 !important;
        }
        .fc-timegrid-slot {
          height: 1.8rem;
        }
        .fc-col-header-cell {
          padding: 8px 0;
          font-weight: 700;
          background-color: #f8fafc;
        }
        .fc-col-header-cell-cushion {
          color: #475569;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </span>
  );
}