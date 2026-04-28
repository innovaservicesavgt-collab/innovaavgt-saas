import Link from 'next/link';
import {
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
} from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { QuotationsClient } from '@/components/quotations/quotations-client';
import type { QuotationWithPatient } from '@/lib/types/quotation';

export default async function QuotationsPage() {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const supabase = await createServerSupabase();

  const { data: quotations } = await supabase
    .from('quotations')
    .select('*, patients (id, first_name, last_name, phone)')
    .eq('tenant_id', profile.tenant.id)
    .order('created_at', { ascending: false })
    .limit(200);

  const list = (quotations || []) as unknown as QuotationWithPatient[];

  if (list.length > 0) {
    const ids = list.map((q) => q.id);
    const { data: items } = await supabase
      .from('quotation_items')
      .select('quotation_id')
      .in('quotation_id', ids);

    const counts = new Map();
    (items || []).forEach((it) => {
      counts.set(it.quotation_id, (counts.get(it.quotation_id) || 0) + 1);
    });

    list.forEach((q) => {
      q.items_count = counts.get(q.id) || 0;
    });
  }

  const total = list.length;
  const accepted = list.filter((q) => q.status === 'accepted').length;
  const pending = list.filter(
    (q) => q.status === 'draft' || q.status === 'sent'
  ).length;

  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthAcceptedTotal = list
    .filter((q) => {
      if (q.status !== 'accepted') return false;
      const acceptedDate = q.accepted_at || q.updated_at;
      if (!acceptedDate) return false;
      return new Date(acceptedDate) >= startMonth;
    })
    .reduce((sum, q) => sum + Number(q.total_amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Cotizaciones
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Presupuestos formales para entregar a los pacientes
          </p>
        </div>
        <Link
          href="/dental/quotations/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nueva cotizacion
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Total cotizaciones"
          value={total.toString()}
          icon={<FileText className="h-4 w-4" />}
          color="blue"
        />
        <Kpi
          label="Aceptadas"
          value={accepted.toString()}
          sub={total > 0 ? Math.round((accepted / total) * 100) + '% conversion' : ''}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="emerald"
        />
        <Kpi
          label="Pendientes"
          value={pending.toString()}
          sub="Borrador + Enviadas"
          icon={<Clock className="h-4 w-4" />}
          color="amber"
        />
        <Kpi
          label="Aceptado este mes"
          value={'Q' + monthAcceptedTotal.toLocaleString('es-GT', { maximumFractionDigits: 0 })}
          sub="Cotizaciones aprobadas"
          icon={<DollarSign className="h-4 w-4" />}
          color="violet"
        />
      </div>

      <QuotationsClient quotations={list} />
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
