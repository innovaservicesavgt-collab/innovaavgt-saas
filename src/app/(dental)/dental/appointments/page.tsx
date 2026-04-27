import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import { AppointmentFilters } from '@/components/appointments/filters';

export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ status?: string; date?: string }> }) {
  await requireAuth();
  const supabase = await createServerSupabase();
  const params = await searchParams;
  const statusFilter = params.status || 'all';
  const dateFilter = params.date || '';

  let query = supabase.from('appointments')
    .select('id, appointment_date, start_time, end_time, duration_minutes, status, reason, patients(first_name, last_name, phone), professionals(first_name, last_name, title, color), services(name, color)')
    .order('appointment_date', { ascending: false }).order('start_time', { ascending: true }).limit(50);

  if (statusFilter !== 'all') query = query.eq('status', statusFilter);
  if (dateFilter) query = query.eq('appointment_date', dateFilter);

  const { data: appointments } = await query;
  const { data: allAppts } = await supabase.from('appointments').select('status');
  const counts: Record<string, number> = { all: allAppts?.length || 0 };
  allAppts?.forEach((a: any) => { counts[a.status] = (counts[a.status] || 0) + 1; });

  const statusColors: Record<string, string> = { scheduled:'bg-blue-100 text-blue-700 border-blue-200', confirmed:'bg-emerald-100 text-emerald-700 border-emerald-200', completed:'bg-slate-100 text-slate-600 border-slate-200', cancelled:'bg-red-100 text-red-600 border-red-200', no_show:'bg-amber-100 text-amber-700 border-amber-200', in_progress:'bg-purple-100 text-purple-700 border-purple-200' };
  const statusLabels: Record<string, string> = { all:'Todas', scheduled:'Agendadas', confirmed:'Confirmadas', completed:'Completadas', cancelled:'Canceladas', no_show:'No asistieron', in_progress:'En curso' };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{counts.all} citas</p>
        <Link href="/dental/appointments/new" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Nueva cita
        </Link>
      </div>
      <AppointmentFilters currentStatus={statusFilter} currentDate={dateFilter} counts={counts} statusLabels={statusLabels} />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {(!appointments || appointments.length === 0) ? (
          <div className="p-12 text-center text-slate-400"><p className="text-lg font-medium text-slate-500">No hay citas</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((apt: any) => (
              <Link key={apt.id} href={'/dental/appointments/' + apt.id} className="px-4 lg:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50/50 transition-colors block">
                <div className="flex sm:flex-col items-center gap-2 sm:gap-0 sm:w-16 sm:text-center flex-shrink-0">
                  <span className="text-xs text-slate-400 uppercase">{new Date(apt.appointment_date+'T12:00:00').toLocaleDateString('es',{weekday:'short',month:'short'})}</span>
                  <span className="text-xl font-bold text-slate-700">{new Date(apt.appointment_date+'T12:00:00').getDate()}</span>
                </div>
                <div className="hidden sm:block w-1 h-12 rounded-full flex-shrink-0" style={{backgroundColor:(apt.professionals as any)?.color||'#94a3b8'}} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{(apt.patients as any)?.first_name} {(apt.patients as any)?.last_name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{(apt.professionals as any)?.title} {(apt.professionals as any)?.first_name} {(apt.professionals as any)?.last_name}</p>
                  {(apt.services as any)?.name && <p className="text-xs text-slate-400 mt-0.5">{(apt.services as any).name}</p>}
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5 flex-shrink-0">
                  <span className="text-sm font-medium text-slate-700">{apt.start_time?.slice(0,5)} - {apt.end_time?.slice(0,5)}</span>
                  <span className={"inline-block px-2.5 py-1 rounded-full text-xs font-medium border "+(statusColors[apt.status]||'bg-slate-100 text-slate-600 border-slate-200')}>{statusLabels[apt.status]||apt.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
