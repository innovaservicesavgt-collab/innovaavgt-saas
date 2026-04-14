'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props { appointmentId: string; currentStatus: string }

export function AppointmentActions({ appointmentId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState('');

  const updateStatus = async (status: string) => {
    setLoading(status);
    try {
      const res = await fetch('/api/appointments/' + appointmentId, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) { router.refresh(); }
    } catch {} finally { setLoading(''); }
  };

  const actions: Record<string, { label: string; color: string; next: string[] }> = {
    scheduled: { label: 'Agendada', color: '', next: ['confirmed', 'cancelled'] },
    confirmed: { label: 'Confirmada', color: '', next: ['in_progress', 'cancelled', 'no_show'] },
    in_progress: { label: 'En curso', color: '', next: ['completed'] },
    completed: { label: 'Completada', color: '', next: [] },
    cancelled: { label: 'Cancelada', color: '', next: ['scheduled'] },
    no_show: { label: 'No asistio', color: '', next: ['scheduled'] },
  };

  const btnStyles: Record<string, string> = {
    confirmed: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    in_progress: 'bg-purple-600 hover:bg-purple-700 text-white',
    completed: 'bg-slate-700 hover:bg-slate-800 text-white',
    cancelled: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200',
    no_show: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200',
    scheduled: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  const btnLabels: Record<string, string> = {
    confirmed: 'Confirmar', in_progress: 'Iniciar consulta', completed: 'Completar',
    cancelled: 'Cancelar cita', no_show: 'Marcar no asistio', scheduled: 'Reagendar',
  };

  const current = actions[currentStatus];
  if (!current || current.next.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
      {current.next.map((s) => (
        <button key={s} onClick={() => updateStatus(s)} disabled={loading === s}
          className={"px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 " + (btnStyles[s] || 'bg-slate-100 text-slate-700')}>
          {loading === s ? 'Actualizando...' : btnLabels[s] || s}
        </button>
      ))}
    </div>
  );
}
