import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Calendar,
  CalendarClock,
  Users,
  Wallet,
  TrendingUp,
  XCircle,
  Plus,
  UserPlus,
  FileText,
  CalendarDays,
  Clock,
  Phone,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  CalendarX,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────
type AppointmentRow = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  reason: string | null;
  price: number | null;
  patients: {
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
  professionals: {
    first_name: string;
    last_name: string;
    title: string | null;
    color: string | null;
  } | null;
  services: { name: string } | null;
};

type WeekAppointmentRow = {
  appointment_date: string;
  status: string;
};

type MonthAppointmentRow = {
  status: string;
  price: number | null;
};

type NewPatientRow = {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function formatTime(t: string | null): string {
  if (!t) return '';
  return t.slice(0, 5);
}

function formatMoney(n: number): string {
  return `Q${n.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusConfig(status: string) {
  switch (status) {
    case 'confirmed':
      return {
        label: 'Confirmada',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'scheduled':
      return {
        label: 'Pendiente',
        cls: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'in_progress':
      return {
        label: 'En curso',
        cls: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'completed':
      return {
        label: 'Atendida',
        cls: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
      };
    case 'cancelled':
      return {
        label: 'Cancelada',
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'no_show':
      return {
        label: 'No asistió',
        cls: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        cls: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay() + 1); // Lunes
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Domingo
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    startDate: start,
  };
}

function getMonthRange(monthsAgo = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function formatLongDate(d: Date): string {
  return d.toLocaleDateString('es-GT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─────────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createServerSupabase();

  const now = new Date();
  const today = getTodayISO();
  const yesterday = getYesterdayISO();
  const week = getWeekRange();
  const thisMonth = getMonthRange(0);
  const lastMonth = getMonthRange(1);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user.profile.first_name || 'Usuario';

  // ---- FETCH EN PARALELO ----
  const [
    { count: todayCount },
    { count: yesterdayCount },
    { count: pendingCount },
    { count: patientsCount },
    { count: newPatientsMonth },
    { count: newPatientsLastMonth },
    { data: todayAppts },
    { data: weekAppts },
    { data: monthAppts },
    { data: lastMonthAppts },
    { data: newPatients },
  ] = await Promise.all([
    // Citas hoy (no canceladas)
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('appointment_date', today)
      .not('status', 'eq', 'cancelled'),
    // Citas ayer (para comparativa)
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('appointment_date', yesterday)
      .not('status', 'eq', 'cancelled'),
    // Citas pendientes (futuras programadas/confirmadas)
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('appointment_date', today)
      .in('status', ['scheduled']),
    // Total pacientes
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    // Pacientes nuevos este mes
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thisMonth.start)
      .lte('created_at', thisMonth.end + 'T23:59:59'),
    // Pacientes nuevos mes anterior
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', lastMonth.start)
      .lte('created_at', lastMonth.end + 'T23:59:59'),
    // Citas detalladas de hoy
    supabase
      .from('appointments')
      .select(
        'id, appointment_date, start_time, end_time, status, reason, price, patients(first_name, last_name, phone), professionals(first_name, last_name, title, color), services(name)'
      )
      .eq('appointment_date', today)
      .not('status', 'eq', 'cancelled')
      .order('start_time', { ascending: true }),
    // Citas de la semana (para gráfico)
    supabase
      .from('appointments')
      .select('appointment_date, status')
      .gte('appointment_date', week.start)
      .lte('appointment_date', week.end),
    // Citas del mes (facturación)
    supabase
      .from('appointments')
      .select('status, price')
      .gte('appointment_date', thisMonth.start)
      .lte('appointment_date', thisMonth.end),
    // Citas mes anterior (comparativa)
    supabase
      .from('appointments')
      .select('status, price')
      .gte('appointment_date', lastMonth.start)
      .lte('appointment_date', lastMonth.end),
    // Pacientes nuevos del mes (lista)
    supabase
      .from('patients')
      .select('id, first_name, last_name, created_at')
      .gte('created_at', thisMonth.start)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // ---- CÁLCULOS ----
  const todayCountSafe = todayCount ?? 0;
  const yesterdayCountSafe = yesterdayCount ?? 0;
  const todayDelta = todayCountSafe - yesterdayCountSafe;

  const newMonth = newPatientsMonth ?? 0;
  const newLastMonth = newPatientsLastMonth ?? 0;

  // Ingresos del mes (citas completed o in_progress contadas como ingreso)
  const monthRows = (monthAppts as MonthAppointmentRow[]) ?? [];
  const monthBilled = monthRows
    .filter((r) => r.status === 'completed' || r.status === 'in_progress')
    .reduce((sum, r) => sum + Number(r.price ?? 0), 0);

  const lastMonthRows = (lastMonthAppts as MonthAppointmentRow[]) ?? [];
  const lastMonthBilled = lastMonthRows
    .filter((r) => r.status === 'completed' || r.status === 'in_progress')
    .reduce((sum, r) => sum + Number(r.price ?? 0), 0);

  const monthDeltaPercent =
    lastMonthBilled > 0
      ? Math.round(((monthBilled - lastMonthBilled) / lastMonthBilled) * 100)
      : 0;

  // Cobrado: solo las completed
  const monthCollected = monthRows
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + Number(r.price ?? 0), 0);

  const collectedPercent =
    monthBilled > 0 ? Math.round((monthCollected / monthBilled) * 100) : 0;

  // Tasa de cancelación
  const monthTotal = monthRows.length;
  const monthCancelled = monthRows.filter(
    (r) => r.status === 'cancelled' || r.status === 'no_show'
  ).length;
  const cancellationRate =
    monthTotal > 0 ? Math.round((monthCancelled / monthTotal) * 100) : 0;

  // Citas atendidas (mes)
  const monthCompleted = monthRows.filter((r) => r.status === 'completed').length;

  // Datos para el gráfico semanal
  const weekRows = (weekAppts as WeekAppointmentRow[]) ?? [];
  const weekBuckets: { label: string; date: string; count: number; isToday: boolean }[] = [];
  const weekLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(week.startDate);
    d.setDate(week.startDate.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const count = weekRows.filter(
      (r) => r.appointment_date === dStr && r.status !== 'cancelled'
    ).length;
    weekBuckets.push({
      label: weekLabels[i],
      date: dStr,
      count,
      isToday: dStr === today,
    });
  }
  const maxWeekCount = Math.max(...weekBuckets.map((b) => b.count), 1);

  const todayApptsSafe = (todayAppts as unknown as AppointmentRow[]) ?? [];
  const newPatientsList = (newPatients as NewPatientRow[]) ?? [];

  return (
    <div className="space-y-6">
      {/* ──────────────────────────── HEADER ──────────────────────────── */}
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {greeting}, {firstName}
        </h1>
        <p className="text-sm text-slate-500 capitalize">
          {formatLongDate(now)}
        </p>
      </header>

      {/* ──────────────────────────── KPIs ──────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={<Calendar className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Citas hoy"
          value={todayCountSafe}
          hint={
            todayDelta > 0
              ? `+${todayDelta} vs ayer`
              : todayDelta < 0
              ? `${todayDelta} vs ayer`
              : 'Igual que ayer'
          }
          hintColor={
            todayDelta > 0 ? 'text-emerald-600' : todayDelta < 0 ? 'text-rose-600' : 'text-slate-500'
          }
        />
        <KpiCard
          icon={<CalendarClock className="h-5 w-5 text-amber-600" />}
          iconBg="bg-amber-50"
          label="Pendientes"
          value={pendingCount ?? 0}
          hint="Próximas citas"
          hintColor="text-slate-500"
        />
        <KpiCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Pacientes"
          value={patientsCount ?? 0}
          hint={newMonth > 0 ? `+${newMonth} este mes` : 'Sin nuevos este mes'}
          hintColor={newMonth > 0 ? 'text-emerald-600' : 'text-slate-500'}
        />
        <KpiCard
          icon={<Wallet className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50"
          label="Facturado mes"
          value={formatMoney(monthBilled)}
          hint={
            monthDeltaPercent !== 0
              ? `${monthDeltaPercent > 0 ? '+' : ''}${monthDeltaPercent}% vs mes anterior`
              : 'Sin comparación'
          }
          hintColor={
            monthDeltaPercent > 0
              ? 'text-emerald-600'
              : monthDeltaPercent < 0
              ? 'text-rose-600'
              : 'text-slate-500'
          }
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-50"
          label="Cobrado mes"
          value={formatMoney(monthCollected)}
          hint={`${collectedPercent}% del facturado`}
          hintColor="text-slate-500"
        />
        <KpiCard
          icon={<XCircle className="h-5 w-5 text-rose-600" />}
          iconBg="bg-rose-50"
          label="Cancelaciones"
          value={`${cancellationRate}%`}
          hint={
            cancellationRate < 10
              ? 'Saludable'
              : cancellationRate < 20
              ? 'Aceptable'
              : 'Revisar'
          }
          hintColor={
            cancellationRate < 10
              ? 'text-emerald-600'
              : cancellationRate < 20
              ? 'text-amber-600'
              : 'text-rose-600'
          }
        />
      </section>

      {/* ────────────────────── GRÁFICO + ACCIONES RÁPIDAS ────────────────────── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Gráfico semanal */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Citas esta semana</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total:{' '}
                {weekBuckets.reduce((s, b) => s + b.count, 0)} citas
              </p>
            </div>
            <Link
              href="/dental/calendar"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Ver calendario
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-end justify-between gap-2 sm:gap-4 h-40">
            {weekBuckets.map((b) => {
              const heightPercent = (b.count / maxWeekCount) * 100;
              return (
                <div key={b.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className={`w-full rounded-t-xl transition-all ${
                        b.isToday
                          ? 'bg-emerald-500'
                          : b.count === 0
                          ? 'bg-slate-100'
                          : 'bg-emerald-200'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    >
                      <div className="text-center text-xs font-bold text-emerald-900 pt-1">
                        {b.count > 0 ? b.count : ''}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-xs font-semibold ${
                      b.isToday ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  >
                    {b.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Acciones rápidas</h3>
          <div className="space-y-2">
            <QuickAction
              href="/dental/appointments/new"
              icon={<Plus className="h-5 w-5" />}
              label="Nueva cita"
              variant="primary"
            />
            <QuickAction
              href="/dental/patients/new"
              icon={<UserPlus className="h-5 w-5" />}
              label="Nuevo paciente"
              variant="success"
            />
            <QuickAction
              href="/dental/quotations/new"
              icon={<FileText className="h-5 w-5" />}
              label="Nueva cotización"
              variant="secondary"
            />
            <QuickAction
              href="/dental/calendar"
              icon={<CalendarDays className="h-5 w-5" />}
              label="Ver calendario"
              variant="secondary"
            />
          </div>
        </div>
      </section>

      {/* ────────────────────── AGENDA DE HOY ────────────────────── */}
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900">Agenda de hoy</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {todayApptsSafe.length === 0
                ? 'No hay citas programadas'
                : `${todayApptsSafe.length} ${
                    todayApptsSafe.length === 1 ? 'cita' : 'citas'
                  } programadas`}
            </p>
          </div>
          <Link
            href="/dental/appointments"
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Ver todas
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {todayApptsSafe.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CalendarX className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              No hay citas para hoy
            </p>
            <p className="mt-1 text-xs text-slate-500">
              ¿Quieres agendar una cita ahora?
            </p>
            <Link
              href="/dental/appointments/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Agendar cita
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayApptsSafe.map((apt) => (
              <AppointmentRowDisplay key={apt.id} apt={apt} />
            ))}
          </div>
        )}
      </section>

      {/* ────────────────────── PACIENTES NUEVOS + RESUMEN MES ────────────────────── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pacientes nuevos */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pacientes nuevos</h3>
              <p className="text-xs text-slate-500 mt-0.5">Este mes</p>
            </div>
            <Link
              href="/dental/patients"
              className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {newPatientsList.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                Sin pacientes nuevos
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Registra tu primer paciente del mes
              </p>
              <Link
                href="/dental/patients/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <UserPlus className="h-4 w-4" />
                Nuevo paciente
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {newPatientsList.map((p) => (
                <Link
                  key={p.id}
                  href={`/dental/patients/${p.id}`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    {getInitials(p.first_name, p.last_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Registrado el{' '}
                      {new Date(p.created_at).toLocaleDateString('es-GT', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Resumen del mes */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Resumen del mes</h3>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">
            {now.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' })}
          </p>
          <div className="mt-5 space-y-3">
            <SummaryRow
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              label="Citas atendidas"
              value={monthCompleted.toString()}
            />
            <SummaryRow
              icon={<UserPlus className="h-4 w-4 text-blue-600" />}
              label="Pacientes nuevos"
              value={newMonth.toString()}
              compare={
                newLastMonth > 0
                  ? `vs ${newLastMonth} mes anterior`
                  : undefined
              }
            />
            <SummaryRow
              icon={<XCircle className="h-4 w-4 text-rose-600" />}
              label="Cancelaciones"
              value={monthCancelled.toString()}
            />
            <SummaryRow
              icon={<Wallet className="h-4 w-4 text-violet-600" />}
              label="Facturado"
              value={formatMoney(monthBilled)}
              highlight
            />
            <SummaryRow
              icon={<TrendingUp className="h-4 w-4 text-green-600" />}
              label="Cobrado"
              value={formatMoney(monthCollected)}
              highlight
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Componentes locales
// ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon,
  iconBg,
  label,
  value,
  hint,
  hintColor,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  hint: string;
  hintColor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
            {value}
          </p>
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
      </div>
      <p className={`mt-2 text-[11px] font-medium ${hintColor} truncate`}>{hint}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  variant,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant: 'primary' | 'success' | 'secondary';
}) {
  const cls = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700',
    success: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100',
  }[variant];

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${cls}`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      <ArrowRight className="h-4 w-4 opacity-50" />
    </Link>
  );
}

function AppointmentRowDisplay({ apt }: { apt: AppointmentRow }) {
  const cfg = statusConfig(apt.status);
  const patientName = apt.patients
    ? `${apt.patients.first_name} ${apt.patients.last_name}`
    : 'Paciente sin registro';
  const profName = apt.professionals
    ? `${apt.professionals.title || ''} ${apt.professionals.first_name} ${apt.professionals.last_name}`.trim()
    : '';
  const profColor = apt.professionals?.color || '#10b981';

  return (
    <Link
      href={`/dental/appointments/${apt.id}`}
      className="block px-6 py-4 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Hora */}
        <div className="shrink-0 text-center min-w-[60px]">
          <div className="text-xl font-bold text-slate-900">
            {formatTime(apt.start_time)}
          </div>
          {apt.end_time && (
            <div className="text-[10px] text-slate-400">
              {formatTime(apt.end_time)}
            </div>
          )}
        </div>

        {/* Vertical bar (color del doctor) */}
        <div
          className="shrink-0 w-1 self-stretch rounded-full"
          style={{ backgroundColor: profColor }}
        />

        {/* Info paciente */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {patientName}
          </p>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
            {apt.services?.name && (
              <span className="truncate">{apt.services.name}</span>
            )}
            {apt.patients?.phone && (
              <span className="hidden sm:inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {apt.patients.phone}
              </span>
            )}
          </div>
          {profName && (
            <p className="mt-0.5 text-xs text-slate-400 truncate">
              <Stethoscope className="inline h-3 w-3 mr-1" />
              {profName}
            </p>
          )}
        </div>

        {/* Estado */}
        <div className="shrink-0 hidden sm:block">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
      </div>
    </Link>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  compare,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  compare?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm text-slate-700">{label}</p>
          {compare && <p className="text-[10px] text-slate-400">{compare}</p>}
        </div>
      </div>
      <p
        className={`shrink-0 text-sm font-bold ${
          highlight ? 'text-slate-900 text-base' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
    </div>
  );
}