import Link from 'next/link';
import { ClipboardList, CheckCircle2, DollarSign, Clock } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { TreatmentsClient } from '@/components/treatments/treatments-client';

type PlanRow = {
  id: string;
  patient_id: string;
  title: string;
  status: string;
  final_amount: number | null;
  paid_amount: number | null;
  num_installments: number | null;
  installment_frequency: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  created_at: string | null;
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
  schedules_pending: number;
  next_due: string | null;
  next_amount: number | null;
};

export default async function TreatmentsPage() {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const supabase = await createServerSupabase();

  const { data: plans } = await supabase
    .from('treatment_plans')
    .select('id, patient_id, title, status, final_amount, paid_amount, num_installments, installment_frequency, start_date, expected_end_date, created_at, patients (id, first_name, last_name, phone)')
    .eq('tenant_id', profile.tenant.id)
    .order('created_at', { ascending: false })
    .limit(200);

  const list = (plans || []) as unknown as PlanRow[];

  // Cargar info adicional: cuotas pendientes y proxima por plan
  if (list.length > 0) {
    const planIds = list.map((p) => p.id);
    const { data: schedules } = await supabase
      .from('payment_schedules')
      .select('treatment_plan_id, status, due_date, amount, amount_paid')
      .in('treatment_plan_id', planIds)
      .order('due_date', { ascending: true });

    const byPlan = new Map<string, { pending: number; nextDue: string | null; nextAmount: number | null }>();
    (schedules || []).forEach((s) => {
      const existing = byPlan.get(s.treatment_plan_id) || { pending: 0, nextDue: null, nextAmount: null };
      const isPending = s.status === 'pending' || s.status === 'partial' || s.status === 'overdue';
      if (isPending) {
        existing.pending += 1;
        if (!existing.nextDue) {
          existing.nextDue = s.due_date;
          existing.nextAmount = Number(s.amount) - Number(s.amount_paid || 0);
        }
      }
      byPlan.set(s.treatment_plan_id, existing);
    });

    list.forEach((p) => {
      const info = byPlan.get(p.id);
      p.schedules_pending = info?.pending || 0;
      p.next_due = info?.nextDue || null;
      p.next_amount = info?.nextAmount || null;
    });
  }

  // KPIs
  const totalPlans = list.length;
  const activePlans = list.filter((p) => p.status === 'active').length;
  const totalPaid = list.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
  const totalPending = list.reduce(
    (sum, p) => sum + (Number(p.final_amount || 0) - Number(p.paid_amount || 0)),
    0
  );

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Tratamientos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Planes de tratamiento activos con su cronograma de pagos
          </p>
        </div>
        <Link
          href="/dental/quotations"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
        >
          Ver cotizaciones
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Total planes"
          value={totalPlans.toString()}
          icon={<ClipboardList className="h-4 w-4" />}
          color="blue"
        />
        <Kpi
          label="Activos"
          value={activePlans.toString()}
          sub={totalPlans > 0 ? Math.round((activePlans / totalPlans) * 100) + '% del total' : ''}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="emerald"
        />
        <Kpi
          label="Cobrado"
          value={'Q' + totalPaid.toLocaleString('es-GT', { maximumFractionDigits: 0 })}
          sub="Total recibido"
          icon={<DollarSign className="h-4 w-4" />}
          color="violet"
        />
        <Kpi
          label="Por cobrar"
          value={'Q' + totalPending.toLocaleString('es-GT', { maximumFractionDigits: 0 })}
          sub="Saldos pendientes"
          icon={<Clock className="h-4 w-4" />}
          color="amber"
        />
      </div>

      <TreatmentsClient plans={list} />
    </div>
  );
}

function Kpi({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: 'blue' | 'emerald' | 'amber' | 'violet'; }) {
  const cls = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  }[color];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={'flex h-7 w-7 items-center justify-center rounded-lg ring-1 ' + cls}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}
