import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { CobranzaClient } from '@/components/cobranza/cobranza-client';

export default async function CobranzaDashboardPage() {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const supabase = await createServerSupabase();

  // Fechas
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const inSevenDays = new Date(now);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const sevenDaysStr = inSevenDays.toISOString().split('T')[0];

  // 1. Pagos del dia
  const { data: paymentsToday } = await supabase
    .from('payments')
    .select('id, amount, payment_method, paid_at, receipt_number, patient_id, patients (first_name, last_name)')
    .eq('tenant_id', profile.tenant.id)
    .eq('status', 'paid')
    .gte('paid_at', startOfDay.toISOString())
    .order('paid_at', { ascending: false });

  const todayList = (paymentsToday || []) as unknown as PaymentRow[];
  const totalToday = todayList.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // 2. Cobrado del mes
  const { data: paymentsMonth } = await supabase
    .from('payments')
    .select('amount')
    .eq('tenant_id', profile.tenant.id)
    .eq('status', 'paid')
    .gte('paid_at', startOfMonth.toISOString());

  const totalMonth = (paymentsMonth || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  // 3. Cuotas pendientes (todas) para calcular total por cobrar y top deudores
  const { data: allPendingSchedules } = await supabase
    .from('payment_schedules')
    .select('id, treatment_plan_id, installment_number, due_date, amount, amount_paid, status, treatment_plans (id, title, patient_id, status, patients (id, first_name, last_name, phone))')
    .in('status', ['pending', 'partial', 'overdue'])
    .order('due_date', { ascending: true });

  const pendingList = (allPendingSchedules || []) as unknown as ScheduleRow[];

  // Filtrar solo del tenant (por seguridad, aunque RLS deberia hacerlo)
  const tenantPending = pendingList.filter((s) => {
    const plan = s.treatment_plans;
    if (!plan) return false;
    return plan.status === 'active';
  });

  // Total por cobrar (suma de saldos pendientes)
  const totalPendiente = tenantPending.reduce(
    (sum, s) => sum + (Number(s.amount) - Number(s.amount_paid || 0)),
    0
  );

  // Cuotas vencidas (due_date < today y status pending o partial)
  const overdueList = tenantPending.filter((s) => {
    return s.due_date < today;
  });

  // Cuotas proximas a vencer (today <= due_date <= +7 dias)
  const upcomingList = tenantPending.filter((s) => {
    return s.due_date >= today && s.due_date <= sevenDaysStr;
  });

  // Top deudores (agrupar por paciente)
  const debtorMap = new Map<string, {
    patient_id: string;
    patient_name: string;
    phone: string | null;
    total_pending: number;
    schedules_count: number;
  }>();

  tenantPending.forEach((s) => {
    const plan = s.treatment_plans;
    if (!plan?.patients) return;
    const pid = plan.patients.id;
    const remaining = Number(s.amount) - Number(s.amount_paid || 0);
    const existing = debtorMap.get(pid) || {
      patient_id: pid,
      patient_name: plan.patients.first_name + ' ' + plan.patients.last_name,
      phone: plan.patients.phone,
      total_pending: 0,
      schedules_count: 0,
    };
    existing.total_pending += remaining;
    existing.schedules_count += 1;
    debtorMap.set(pid, existing);
  });

  const topDebtors = Array.from(debtorMap.values())
    .sort((a, b) => b.total_pending - a.total_pending)
    .slice(0, 10);

  return (
    <CobranzaClient
      paymentsToday={todayList}
      totalToday={totalToday}
      totalMonth={totalMonth}
      totalPending={totalPendiente}
      overdueSchedules={overdueList}
      upcomingSchedules={upcomingList}
      topDebtors={topDebtors}
      tenantName={profile.tenant.brand_name || profile.tenant.name || 'ClinicaPrueba'}
    />
  );
}

// Tipos locales (Supabase devuelve patients como array en algunos casos)
type PaymentRow = {
  id: string;
  amount: number;
  payment_method: string | null;
  paid_at: string | null;
  receipt_number: string | null;
  patient_id: string;
  patients: { first_name: string; last_name: string } | null;
};

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
    patient_id: string;
    status: string;
    patients: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
    } | null;
  } | null;
};
