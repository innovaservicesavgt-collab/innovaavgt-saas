'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  FileText,
  CheckCircle2,
  PlayCircle,
  XCircle,
  CalendarCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import type { CalendarAppointment } from '@/app/(dental)/dental/calendar/page';

type Props = {
  appointment: CalendarAppointment;
  onClose: () => void;
  onStatusChange: (newStatus: string) => void;
  isPending: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Pendiente',
  confirmed: 'Confirmada',
  in_progress: 'En curso',
  completed: 'Atendida',
  cancelled: 'Cancelada',
  no_show: 'No asistio',
};

const STATUS_CLASSES: Record<string, string> = {
  scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  no_show: 'bg-rose-50 text-rose-700 border-rose-200',
};

function formatTime(t: string | null): string {
  if (!t) return '';
  return t.slice(0, 5);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-GT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatMoney(n: number | null): string {
  if (n == null) return '';
  return 'Q' + n.toLocaleString('es-GT', { minimumFractionDigits: 2 });
}

export function AppointmentDetailModal({
  appointment,
  onClose,
  onStatusChange,
  isPending,
}: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const patientName = appointment.patients
    ? appointment.patients.first_name + ' ' + appointment.patients.last_name
    : 'Sin paciente';
  const profName = appointment.professionals
    ? appointment.professionals.first_name + ' ' + appointment.professionals.last_name
    : 'Sin profesional';
  const serviceName = appointment.services?.name || appointment.reason || 'Consulta';
  const statusCls = STATUS_CLASSES[appointment.status] || STATUS_CLASSES.scheduled;
  const statusLabel = STATUS_LABELS[appointment.status] || appointment.status;

  const phone = appointment.patients?.phone || null;
  const telHref = phone ? 'tel:' + phone : '';

  const canConfirm = appointment.status === 'scheduled';
  const canStart = ['scheduled', 'confirmed'].includes(appointment.status);
  const canComplete = ['confirmed', 'in_progress'].includes(appointment.status);
  const canCancel = !['cancelled', 'completed', 'no_show'].includes(appointment.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">Detalle de cita</h3>
            <span className={'mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ' + statusCls}>
              {statusLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <DataRow
            icon={<User className="h-4 w-4 text-blue-600" />}
            label="Paciente"
            value={patientName}
          />

          <DataRow
            icon={<FileText className="h-4 w-4 text-violet-600" />}
            label="Servicio"
            value={serviceName}
          />

          <DataRow
            icon={<Stethoscope className="h-4 w-4 text-emerald-600" />}
            label="Profesional"
            value={profName}
          />

          <DataRow
            icon={<Calendar className="h-4 w-4 text-slate-600" />}
            label="Fecha"
            value={formatDate(appointment.appointment_date)}
            capitalize
          />

          <DataRow
            icon={<Clock className="h-4 w-4 text-slate-600" />}
            label="Hora"
            value={
              formatTime(appointment.start_time) +
              (appointment.end_time ? ' – ' + formatTime(appointment.end_time) : '')
            }
          />

          {phone && (
            <DataRow
              icon={<Phone className="h-4 w-4 text-emerald-600" />}
              label="Telefono"
              value={
                <a href={telHref} className="text-emerald-700 hover:underline">
                  {phone}
                </a>
              }
            />
          )}

          {appointment.price != null && appointment.price > 0 && (
            <DataRow
              icon={<FileText className="h-4 w-4 text-amber-600" />}
              label="Precio"
              value={formatMoney(appointment.price)}
            />
          )}

          {appointment.notes && (
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500 mb-1">Notas</div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Cambiar estado
          </div>
          <div className="grid grid-cols-2 gap-2">
            {canConfirm && (
              <ActionButton
                onClick={() => onStatusChange('confirmed')}
                disabled={isPending}
                icon={<CalendarCheck className="h-4 w-4" />}
                label="Confirmar"
                variant="emerald"
              />
            )}
            {canStart && (
              <ActionButton
                onClick={() => onStatusChange('in_progress')}
                disabled={isPending}
                icon={<PlayCircle className="h-4 w-4" />}
                label="Iniciar"
                variant="blue"
              />
            )}
            {canComplete && (
              <ActionButton
                onClick={() => onStatusChange('completed')}
                disabled={isPending}
                icon={<CheckCircle2 className="h-4 w-4" />}
                label="Marcar atendida"
                variant="slate"
              />
            )}
            {canCancel && (
              <ActionButton
                onClick={() => onStatusChange('cancelled')}
                disabled={isPending}
                icon={<XCircle className="h-4 w-4" />}
                label="Cancelar"
                variant="rose"
              />
            )}
            {appointment.status !== 'no_show' && canCancel && (
              <ActionButton
                onClick={() => onStatusChange('no_show')}
                disabled={isPending}
                icon={<AlertCircle className="h-4 w-4" />}
                label="No asistio"
                variant="rose-outline"
              />
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-3 flex gap-2">
          <Link
            href={'/dental/appointments/' + appointment.id}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Eye className="h-4 w-4" />
            Ver detalle
          </Link>
          {appointment.patient_id && (
            <Link
              href={'/dental/patients/' + appointment.patient_id}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <User className="h-4 w-4" />
              Ver paciente
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function DataRow({
  icon,
  label,
  value,
  capitalize,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className={'text-sm font-semibold text-slate-900 ' + (capitalize ? 'capitalize' : '')}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  icon,
  label,
  variant,
}: {
  onClick: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  variant: 'emerald' | 'blue' | 'slate' | 'rose' | 'rose-outline';
}) {
  const variantCls: Record<string, string> = {
    emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
    blue: 'bg-blue-600 text-white hover:bg-blue-700',
    slate: 'bg-slate-700 text-white hover:bg-slate-800',
    rose: 'bg-rose-600 text-white hover:bg-rose-700',
    'rose-outline': 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-50',
  };
  const cls = variantCls[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ' + cls}
    >
      {icon}
      {label}
    </button>
  );
}