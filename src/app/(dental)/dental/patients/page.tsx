import Link from 'next/link';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { PatientsClient } from '@/components/patients/patients-client';
import {
  Users,
  UserPlus,
  Sparkles,
  CalendarCheck,
} from 'lucide-react';

export type PatientRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  allergies: string | null;
  medical_notes: string | null;
  blood_type: string | null;
  tags: string[] | null;
  is_active: boolean | null;
  photo_url: string | null;
  responsible_name: string | null;
  insurance_provider: string | null;
  source: string | null;
  created_at: string;
  /** Calculados en el server */
  last_visit_date?: string | null;
  next_appointment_date?: string | null;
};

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return start.toISOString();
}

export default async function PatientsPage() {
  await requireAuth();
  const supabase = await createServerSupabase();
  const today = new Date().toISOString().split('T')[0];
  const monthStart = getMonthRange();

  // ─── Cargar pacientes ───
  const { data: patientsRaw } = await supabase
    .from('patients')
    .select(
      'id, first_name, last_name, email, phone, date_of_birth, gender, allergies, medical_notes, blood_type, tags, is_active, photo_url, responsible_name, insurance_provider, source, created_at'
    )
    .order('created_at', { ascending: false });

  const patients = (patientsRaw || []) as PatientRow[];

  // ─── Última visita y próxima cita por paciente ───
  const patientIds = patients.map((p) => p.id);
  let lastVisits = new Map<string, string>();
  let nextAppointments = new Map<string, string>();

  if (patientIds.length > 0) {
    // Última visita: completed más reciente
    const { data: completedAppts } = await supabase
      .from('appointments')
      .select('patient_id, appointment_date')
      .in('patient_id', patientIds)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false });

    if (completedAppts) {
      for (const a of completedAppts as { patient_id: string; appointment_date: string }[]) {
        if (!lastVisits.has(a.patient_id)) {
          lastVisits.set(a.patient_id, a.appointment_date);
        }
      }
    }

    // Próxima cita: scheduled/confirmed futura más cercana
    const { data: upcomingAppts } = await supabase
      .from('appointments')
      .select('patient_id, appointment_date')
      .in('patient_id', patientIds)
      .gte('appointment_date', today)
      .in('status', ['scheduled', 'confirmed'])
      .order('appointment_date', { ascending: true });

    if (upcomingAppts) {
      for (const a of upcomingAppts as { patient_id: string; appointment_date: string }[]) {
        if (!nextAppointments.has(a.patient_id)) {
          nextAppointments.set(a.patient_id, a.appointment_date);
        }
      }
    }
  }

  // Enriquecer pacientes con last_visit y next_appointment
  const enrichedPatients = patients.map((p) => ({
    ...p,
    last_visit_date: lastVisits.get(p.id) || null,
    next_appointment_date: nextAppointments.get(p.id) || null,
  }));

  // ─── KPIs ───
  const totalCount = enrichedPatients.length;
  const newThisMonth = enrichedPatients.filter(
    (p) => p.created_at >= monthStart
  ).length;
  const withUpcoming = enrichedPatients.filter(
    (p) => p.next_appointment_date !== null
  ).length;
  const withAlerts = enrichedPatients.filter(
    (p) => (p.allergies && p.allergies.trim().length > 0) || (p.medical_notes && p.medical_notes.trim().length > 0)
  ).length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Pacientes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona la información clínica de tus pacientes
          </p>
        </div>
        <Link
          href="/dental/patients/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo paciente
        </Link>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Total pacientes"
          value={totalCount}
          hint={totalCount === 0 ? 'Sin registros' : 'Activos en clínica'}
        />
        <KpiCard
          icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Nuevos este mes"
          value={newThisMonth}
          hint={newThisMonth > 0 ? '¡Buen ritmo!' : 'Sin nuevos aún'}
          hintColor={newThisMonth > 0 ? 'text-emerald-600' : 'text-slate-500'}
        />
        <KpiCard
          icon={<CalendarCheck className="h-5 w-5 text-violet-600" />}
          iconBg="bg-violet-50"
          label="Con próxima cita"
          value={withUpcoming}
          hint={
            totalCount > 0
              ? `${Math.round((withUpcoming / totalCount) * 100)}% del total`
              : 'Sin pacientes'
          }
        />
        <KpiCard
          icon={<AlertIconWrap />}
          iconBg="bg-amber-50"
          label="Con alertas clínicas"
          value={withAlerts}
          hint={
            withAlerts > 0
              ? 'Alergias o notas médicas'
              : 'Ninguna alerta'
          }
          hintColor={withAlerts > 0 ? 'text-amber-600' : 'text-slate-500'}
        />
      </section>

      {/* LISTADO + BÚSQUEDA (client component) */}
      <PatientsClient patients={enrichedPatients} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Componentes locales
// ─────────────────────────────────────────────────────────────
function KpiCard({
  icon,
  iconBg,
  label,
  value,
  hint,
  hintColor = 'text-slate-500',
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number | string;
  hint: string;
  hintColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className={`mt-2 text-[11px] font-medium ${hintColor}`}>{hint}</p>
    </div>
  );
}

function AlertIconWrap() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 text-amber-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}
