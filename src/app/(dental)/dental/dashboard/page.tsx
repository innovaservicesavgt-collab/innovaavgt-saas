import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import { InlineStatusButton } from '@/components/appointments/inline-status';
import { WeeklyChart } from '@/components/dashboard/weekly-chart';

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5);
  const hour = now.getHours();

  // Greeting
  const greeting = hour < 12 ? 'Buenos dias' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user.profile.first_name || 'Usuario';
  const role = user.roleName;

  // ---- FETCH ALL DATA ----
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [
    { count: todayCount },
    { count: pendingCount },
    { count: patientsCount },
    { count: profsCount },
    { data: todayAppts },
    { data: weekAppts },
    { data: monthAppts },
    { data: inProgressAppts },
    { data: monthPayments },
    { count: newPatientsMonth },
  ] = await Promise.all([
    supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('appointment_date', today).not('status', 'eq', 'cancelled'),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).in('status', ['scheduled', 'confirmed']),
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('professionals').select('id', { count: 'exact', head: true }),
    supabase.from('appointments').select('id, appointment_date, start_time, end_time, status, reason, price, patients(first_name, last_name, phone), professionals(first_name, last_name, title, color), services(name)').eq('appointment_date', today).not('status', 'eq', 'cancelled').order('start_time', { ascending: true }),
    supabase.from('appointments').select('appointment_date, status').gte('appointment_date', weekStartStr).lte('appointment_date', weekEndStr),
    supabase.from('appointments').select('status, price').gte('appointment_date', monthStart).lte('appointment_date', monthEnd),
    supabase.from('appointments').select('id, start_time, patients(first_name, last_name), professionals(first_name, last_name, title), services(name)').eq('appointment_date', today).eq('status', 'in_progress'),
    supabase.from('payments').select('amount, status').gte('created_at', monthStart + 'T00:00:00'),
    supabase.from('patients').select('id', { count: 'exact', head: true }).gte('created_at', monthStart + 'T00:00:00'),
  ]);

  // ---- CALCULATIONS ----
  const revenueMonth = monthAppts?.reduce((s: number, a: any) => s + (Number(a.price) || 0), 0) || 0;
  const paidMonth = monthPayments?.reduce((s: number, p: any) => s + (p.status === 'paid' ? Number(p.amount) : 0), 0) || 0;
  const cancelledMonth = monthAppts?.filter((a: any) => a.status === 'cancelled').length || 0;
  const totalMonth = monthAppts?.length || 0;
  const cancelRate = totalMonth > 0 ? Math.round((cancelledMonth / totalMonth) * 100) : 0;
  const completedToday = todayAppts?.filter((a: any) => a.status === 'completed').length || 0;

  // Weekly chart data
  const dayNames = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  const weekData = dayNames.map((name, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const ds = d.toISOString().split('T')[0];
    const dayAppts = weekAppts?.filter((a: any) => a.appointment_date === ds) || [];
    return {
      name,
      date: ds,
      total: dayAppts.length,
      completed: dayAppts.filter((a: any) => a.status === 'completed').length,
      cancelled: dayAppts.filter((a: any) => a.status === 'cancelled').length,
      isToday: ds === today,
    };
  });
  const weekMax = Math.max(...weekData.map(d => d.total), 1);

  // Alerts
  const alerts: { type: string; color: string; icon: string; text: string }[] = [];
  const upcomingSoon = todayAppts?.filter((a: any) => a.status === 'scheduled' && a.start_time?.slice(0, 5) >= currentTime && a.start_time?.slice(0, 5) <= currentTime.replace(/\d{2}$/, (m: string) => String(Math.min(59, Number(m) + 30)).padStart(2, '0'))) || [];
  if (upcomingSoon.length > 0) alerts.push({ type: 'urgent', color: 'bg-red-50 border-red-200 text-red-700', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: upcomingSoon.length + ' cita(s) en los proximos 30 min sin confirmar' });

  const unconfirmed = todayAppts?.filter((a: any) => a.status === 'scheduled').length || 0;
  if (unconfirmed > 0) alerts.push({ type: 'warning', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z', text: unconfirmed + ' cita(s) de hoy sin confirmar' });

  const inProgress = inProgressAppts?.length || 0;
  if (inProgress > 0) alerts.push({ type: 'info', color: 'bg-purple-50 border-purple-200 text-purple-700', icon: 'M13 10V3L4 14h7v7l9-11h-7z', text: inProgress + ' consulta(s) en curso ahora mismo' });

  // Role-based data
  const isAdmin = role === 'admin' || user.isSuperadmin;
  const isDoctor = role === 'professional';

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-slate-800">{greeting}, {firstName}</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {todayAppts?.length || 0} citas hoy · {completedToday} completadas · {(todayAppts?.length || 0) - completedToday} pendientes
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className={"flex items-center gap-3 px-4 py-2.5 rounded-lg border text-sm " + alert.color}>
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={alert.icon} /></svg>
              <span className="font-medium">{alert.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <span className="text-xs text-slate-400">hoy</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{todayCount || 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">Citas del dia</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-xs text-slate-400">total</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{pendingCount || 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">Pendientes</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <span className={"text-xs font-medium " + ((newPatientsMonth || 0) > 0 ? "text-emerald-600" : "text-slate-400")}>{newPatientsMonth || 0} nuevos</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{patientsCount || 0}</p>
          <p className="text-xs text-slate-400 mt-0.5">Pacientes</p>
        </div>

        {isAdmin ? (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <span className="text-xs text-slate-400">mes</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">Q{revenueMonth.toLocaleString('es', { minimumFractionDigits: 0 })}</p>
            <p className="text-xs text-slate-400 mt-0.5">Facturado este mes</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{profsCount || 0}</p>
            <p className="text-xs text-slate-400 mt-0.5">Profesionales</p>
          </div>
        )}
      </div>

      {/* Admin: Revenue + Cancellation row */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div><p className="text-lg font-bold text-emerald-700">Q{paidMonth.toLocaleString('es', { minimumFractionDigits: 0 })}</p><p className="text-xs text-slate-400">Cobrado este mes</p></div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <div><p className="text-lg font-bold text-slate-700">{cancelRate}%</p><p className="text-xs text-slate-400">Tasa cancelacion</p></div>
          </div>
          <div className="hidden lg:flex bg-white rounded-xl border border-slate-200 p-4 items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div><p className="text-lg font-bold text-slate-700">{newPatientsMonth || 0}</p><p className="text-xs text-slate-400">Pacientes nuevos mes</p></div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Nueva cita', href: '/dental/appointments/new', color: 'bg-blue-600 hover:bg-blue-700 text-white', icon: 'M12 4v16m8-8H4' },
          { label: 'Nuevo paciente', href: '/dental/patients/new', color: 'bg-emerald-600 hover:bg-emerald-700 text-white', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
          { label: 'Cotizar', href: '/dental/quotations/new', color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
          { label: 'Calendario', href: '/dental/calendar', color: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25' },
        ].map((a) => (
          <Link key={a.href} href={a.href} className={"flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all " + a.color}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={a.icon} /></svg>
            <span className="hidden sm:inline">{a.label}</span>
            <span className="sm:hidden">{a.label.split(' ').pop()}</span>
          </Link>
        ))}
      </div>

      {/* Two columns: Chart + In progress */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Weekly chart */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Citas esta semana</h3>
          <WeeklyChart data={weekData} maxVal={weekMax} />
        </div>

        {/* Now + upcoming */}
        <div className="lg:col-span-2 space-y-4">
          {/* In progress now */}
          {(inProgressAppts && inProgressAppts.length > 0) && (
            <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
              <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-2">En consulta ahora</h4>
              {inProgressAppts.map((a: any) => (
                <div key={a.id} className="flex items-center gap-2 py-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <p className="text-sm text-purple-800 font-medium">{(a.patients as any)?.first_name} {(a.patients as any)?.last_name}</p>
                  <p className="text-xs text-purple-500 ml-auto">{(a.professionals as any)?.title} {(a.professionals as any)?.first_name}</p>
                </div>
              ))}
            </div>
          )}

          {/* Month summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Resumen del mes</h4>
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Citas atendidas</span><span className="font-semibold text-slate-700">{monthAppts?.filter((a: any) => a.status === 'completed').length || 0}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Pacientes nuevos</span><span className="font-semibold text-slate-700">{newPatientsMonth || 0}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Cancelaciones</span><span className="font-semibold text-red-600">{cancelledMonth}</span></div>
              {isAdmin && <div className="flex justify-between text-sm border-t border-slate-100 pt-2"><span className="text-slate-500">Facturado</span><span className="font-bold text-emerald-600">Q{revenueMonth.toLocaleString('es')}</span></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Today's appointments with inline actions */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">Agenda de hoy</h3>
            <p className="text-xs text-slate-400 mt-0.5">{today} · {todayAppts?.length || 0} citas</p>
          </div>
          <Link href="/dental/appointments" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Ver todas</Link>
        </div>
        {(!todayAppts || todayAppts.length === 0) ? (
          <div className="p-8 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="font-medium text-slate-500">No hay citas hoy</p>
            <Link href="/dental/appointments/new" className="text-sm text-blue-600 hover:underline mt-1 inline-block">Agendar cita</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayAppts.map((apt: any) => {
              const isPast = apt.start_time?.slice(0, 5) < currentTime;
              const statusColors: Record<string, string> = { scheduled: 'bg-blue-100 text-blue-700', confirmed: 'bg-emerald-100 text-emerald-700', completed: 'bg-slate-100 text-slate-500', cancelled: 'bg-red-100 text-red-600', in_progress: 'bg-purple-100 text-purple-700', no_show: 'bg-amber-100 text-amber-700' };
              const statusLabels: Record<string, string> = { scheduled: 'Agendada', confirmed: 'Confirmada', completed: 'Completada', cancelled: 'Cancelada', in_progress: 'En curso', no_show: 'No asistio' };
              return (
                <div key={apt.id} className={"px-4 lg:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 transition-colors " + (apt.status === 'completed' ? 'opacity-50' : 'hover:bg-slate-50/50')}>
                  {/* Time */}
                  <div className="flex items-center gap-3 sm:w-20 flex-shrink-0">
                    <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: (apt.professionals as any)?.color || '#94a3b8' }} />
                    <div>
                      <p className={"text-sm font-semibold " + (isPast && apt.status !== 'in_progress' ? "text-slate-400" : "text-slate-800")}>{apt.start_time?.slice(0, 5)}</p>
                      <p className="text-xs text-slate-400">{apt.end_time?.slice(0, 5)}</p>
                    </div>
                  </div>
                  {/* Patient */}
                  <Link href={'/dental/appointments/' + apt.id} className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{(apt.patients as any)?.first_name} {(apt.patients as any)?.last_name}</p>
                    <p className="text-xs text-slate-400 truncate">{(apt.professionals as any)?.title} {(apt.professionals as any)?.first_name} · {(apt.services as any)?.name || 'Consulta'}</p>
                  </Link>
                  {/* Status + Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusColors[apt.status] || 'bg-slate-100 text-slate-600')}>{statusLabels[apt.status] || apt.status}</span>
                    <InlineStatusButton appointmentId={apt.id} currentStatus={apt.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
