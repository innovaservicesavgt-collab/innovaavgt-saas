import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { RemindersClient } from '@/components/reminders/reminders-client';

export default async function RemindersPage() {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const supabase = await createServerSupabase();
  const tenantId = profile.tenant.id;
  const tenantName = profile.tenant.brand_name || profile.tenant.name || 'Clinica';

  // Fechas
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const sevenDaysStr = inSevenDays.toISOString().split('T')[0];

  // Citas: hoy + 2 dias siguientes
  const inTwoDays = new Date(now);
  inTwoDays.setDate(inTwoDays.getDate() + 2);
  const twoDaysStr = inTwoDays.toISOString().split('T')[0];

  // 1. CUOTAS VENCIDAS Y PROXIMAS
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('id, treatment_plan_id, installment_number, due_date, amount, amount_paid, status, treatment_plans (id, title, status, patient_id, tenant_id, patients (id, first_name, last_name, phone))')
    .in('status', ['pending', 'partial', 'overdue'])
    .lte('due_date', sevenDaysStr)
    .order('due_date', { ascending: true });

  const allSchedules = (schedules || []) as unknown as ScheduleRow[];

  // Filtrar solo del tenant y planes activos
  const validSchedules = allSchedules.filter((s) => {
    const plan = s.treatment_plans;
    if (!plan) return false;
    if (plan.tenant_id !== tenantId) return false;
    return plan.status === 'active';
  });

  // Vencidas: due_date < today
  const overdueRaw = validSchedules.filter((s) => s.due_date < today);
  const overdueList = overdueRaw.map((s) => transformSchedule(s, today, 'overdue'));

  // Proximas: today <= due_date <= +7 dias
  const upcomingRaw = validSchedules.filter((s) => s.due_date >= today && s.due_date <= sevenDaysStr);
  const upcomingList = upcomingRaw.map((s) => transformSchedule(s, today, 'upcoming'));

  // 2. CITAS PROXIMAS (hoy + 2 dias)
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, appointment_date, start_time, status, patient_id, professional_id, service_id, reminder_sent, patients (id, first_name, last_name, phone), services (name), professionals (first_name, last_name, title)')
    .eq('tenant_id', tenantId)
    .in('status', ['confirmed', 'scheduled', 'pending'])
    .gte('appointment_date', today)
    .lte('appointment_date', twoDaysStr)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true });

  const apptRaw = (appointments || []) as unknown as AppointmentRow[];
  const appointmentsList = apptRaw.map((a) => transformAppointment(a, today));

  return (
    <RemindersClient
      overdueList={overdueList}
      upcomingList={upcomingList}
      appointmentsList={appointmentsList}
      tenantName={tenantName}
    />
  );
}

// ─── Tipos locales ──────────────────────────────────────
type ScheduleRow = {
  id: string;
  treatment_plan_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  amount_paid: number | null;
  status: string;
  treatment_plans: {
    id: string;
    title: string;
    status: string;
    tenant_id: string;
    patient_id: string;
    patients: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
    } | null;
  } | null;
};

type AppointmentRow = {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  patient_id: string;
  professional_id: string | null;
  service_id: string | null;
  reminder_sent: boolean | null;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
  services: { name: string } | null;
  professionals: { first_name: string; last_name: string; title: string | null } | null;
};

// ─── Helpers de transformacion ──────────────────────────
function transformSchedule(s: ScheduleRow, today: string, type: 'overdue' | 'upcoming') {
  const remaining = Number(s.amount) - Number(s.amount_paid || 0);
  const dueDate = new Date(s.due_date + 'T00:00:00');
  const todayDate = new Date(today + 'T00:00:00');
  const diffMs = dueDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return {
    id: s.id,
    treatment_plan_id: s.treatment_plan_id,
    plan_title: s.treatment_plans?.title || 'Plan de tratamiento',
    installment_number: s.installment_number,
    due_date: s.due_date,
    amount: Number(s.amount),
    remaining,
    days: type === 'overdue' ? Math.abs(diffDays) : diffDays,
    patient_id: s.treatment_plans?.patients?.id || null,
    patient_first_name: s.treatment_plans?.patients?.first_name || '',
    patient_last_name: s.treatment_plans?.patients?.last_name || '',
    patient_phone: s.treatment_plans?.patients?.phone || null,
  };
}

function transformAppointment(a: AppointmentRow, today: string) {
  const apptDate = new Date(a.appointment_date + 'T00:00:00');
  const todayDate = new Date(today + 'T00:00:00');
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(todayDate.getDate() + 1);

  const isToday = a.appointment_date === today;
  const isTomorrow = apptDate.getTime() === tomorrowDate.getTime();

  const profName = a.professionals
    ? (a.professionals.title ? a.professionals.title + ' ' : '') + a.professionals.first_name + ' ' + a.professionals.last_name
    : null;

  return {
    id: a.id,
    appointment_date: a.appointment_date,
    start_time: a.start_time,
    status: a.status,
    is_today: isToday,
    is_tomorrow: isTomorrow,
    reminder_sent: a.reminder_sent || false,
    patient_id: a.patients?.id || null,
    patient_first_name: a.patients?.first_name || '',
    patient_last_name: a.patients?.last_name || '',
    patient_phone: a.patients?.phone || null,
    service_name: a.services?.name || null,
    professional_name: profName,
  };
}
