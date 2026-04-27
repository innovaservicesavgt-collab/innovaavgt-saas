'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  patients: any[];
  professionals: any[];
  services: any[];
}

export function NewAppointmentForm({ patients, professionals, services }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    patient_id: '', professional_id: '', service_id: '',
    appointment_date: '', start_time: '', reason: '', notes: '',
  });

  const selectedService = services.find(s => s.id === form.service_id);
  const duration = selectedService?.duration_minutes || 30;

  const calcEndTime = (start: string, mins: number) => {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + mins;
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.patient_id || !form.professional_id || !form.appointment_date || !form.start_time) {
      setError('Completa los campos obligatorios'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          end_time: calcEndTime(form.start_time, duration),
          duration_minutes: duration,
          price: selectedService?.price || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al crear cita'); return; }
      router.push('/dental/appointments');
      router.refresh();
    } catch { setError('Error de conexion'); }
    finally { setLoading(false); }
  };

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dental/appointments" className="text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h2 className="text-xl font-bold text-slate-800">Nueva cita</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 lg:p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Paciente *</label>
          <select value={form.patient_id} onChange={e => update('patient_id', e.target.value)} required
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="">Seleccionar paciente...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name} {p.phone ? '- ' + p.phone : ''}</option>)}
          </select>
          {patients.length === 0 && <p className="text-xs text-amber-600 mt-1">No hay pacientes. <Link href="/dental/patients/new" className="underline">Crear uno primero</Link></p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Profesional *</label>
            <select value={form.professional_id} onChange={e => update('professional_id', e.target.value)} required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Seleccionar...</option>
              {professionals.map(p => <option key={p.id} value={p.id}>{p.title} {p.first_name} {p.last_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Servicio</label>
            <select value={form.service_id} onChange={e => update('service_id', e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="">Seleccionar...</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min) {s.price ? '- Q' + s.price : ''}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha *</label>
            <input type="date" value={form.appointment_date} onChange={e => update('appointment_date', e.target.value)} required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Hora inicio *</label>
            <input type="time" value={form.start_time} onChange={e => update('start_time', e.target.value)} required
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Duracion</label>
            <p className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">{duration} min {form.start_time ? '(hasta ' + calcEndTime(form.start_time, duration) + ')' : ''}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Motivo</label>
          <input type="text" value={form.reason} onChange={e => update('reason', e.target.value)} placeholder="Motivo de la consulta"
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas internas</label>
          <textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} placeholder="Notas privadas..."
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
        </div>

        <div className="flex gap-3 pt-2">
          <Link href="/dental/appointments" className="flex-1 py-2.5 text-center bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all">Cancelar</Link>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50">
            {loading ? 'Creando...' : 'Crear cita'}
          </button>
        </div>
      </form>
    </div>
  );
}
