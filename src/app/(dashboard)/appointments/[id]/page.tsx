import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import { AppointmentActions } from '@/components/appointments/actions';

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const supabase = await createServerSupabase();
  const { id } = await params;

  const { data: apt } = await supabase.from('appointments')
    .select('*, patients(first_name, last_name, phone, email, photo_url), professionals(first_name, last_name, title, color, specialty), services(name, duration_minutes, price, color)')
    .eq('id', id).single();

  if (!apt) return <div className="p-8 text-center text-slate-500">Cita no encontrada</div>;

  const statusColors: Record<string, string> = { scheduled: 'bg-blue-100 text-blue-700', confirmed: 'bg-emerald-100 text-emerald-700', completed: 'bg-slate-200 text-slate-700', cancelled: 'bg-red-100 text-red-600', in_progress: 'bg-purple-100 text-purple-700', no_show: 'bg-amber-100 text-amber-700' };
  const statusLabels: Record<string, string> = { scheduled: 'Agendada', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada', in_progress: 'En curso', no_show: 'No asistio', rescheduled: 'Reagendada' };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/appointments" className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></Link>
        <h2 className="text-xl font-bold text-slate-800">Detalle de cita</h2>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <span className={"px-3 py-1.5 rounded-full text-sm font-medium " + (statusColors[apt.status] || 'bg-slate-100')}>{statusLabels[apt.status] || apt.status}</span>
          <p className="text-sm text-slate-400">{new Date(apt.appointment_date + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Patient */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">{(apt.patients as any)?.first_name?.charAt(0)}{(apt.patients as any)?.last_name?.charAt(0)}</div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{(apt.patients as any)?.first_name} {(apt.patients as any)?.last_name}</p>
            <p className="text-xs text-slate-400">{(apt.patients as any)?.phone} {(apt.patients as any)?.email ? '· ' + (apt.patients as any).email : ''}</p>
          </div>
          <Link href={'/patients/' + apt.patient_id} className="ml-auto text-xs text-blue-600 hover:underline">Ver expediente</Link>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-slate-400 text-xs mb-0.5">Hora</p><p className="font-medium text-slate-800">{apt.start_time?.slice(0,5)} - {apt.end_time?.slice(0,5)}</p></div>
          <div><p className="text-slate-400 text-xs mb-0.5">Duracion</p><p className="font-medium text-slate-800">{apt.duration_minutes} min</p></div>
          <div><p className="text-slate-400 text-xs mb-0.5">Profesional</p><p className="font-medium text-slate-800">{(apt.professionals as any)?.title} {(apt.professionals as any)?.first_name} {(apt.professionals as any)?.last_name}</p></div>
          <div><p className="text-slate-400 text-xs mb-0.5">Servicio</p><p className="font-medium text-slate-800">{(apt.services as any)?.name || 'N/A'}</p></div>
          {apt.price && <div><p className="text-slate-400 text-xs mb-0.5">Precio</p><p className="font-medium text-slate-800">Q{Number(apt.price).toFixed(2)}</p></div>}
          {apt.reason && <div className="col-span-2"><p className="text-slate-400 text-xs mb-0.5">Motivo</p><p className="text-slate-700">{apt.reason}</p></div>}
          {apt.notes && <div className="col-span-2"><p className="text-slate-400 text-xs mb-0.5">Notas</p><p className="text-slate-700">{apt.notes}</p></div>}
        </div>

        {/* Actions */}
        <AppointmentActions appointmentId={apt.id} currentStatus={apt.status} />
      </div>
    </div>
  );
}
