'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ClipboardList,
  ArrowRight,
  Calendar,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Pause,
  XCircle,
} from 'lucide-react';
import { PLAN_STATUS_CONFIG, type TreatmentPlanStatus } from '@/lib/types/treatment-plan';

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

type Props = {
  plans: PlanRow[];
};

type StatusFilter = 'all' | TreatmentPlanStatus;

export function TreatmentsClient({ plans }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      const name = p.patients ? p.patients.first_name + ' ' + p.patients.last_name : '';
      const phone = p.patients?.phone || '';
      const haystack = (p.title + ' ' + name + ' ' + phone).toLowerCase();
      return haystack.includes(q);
    });
  }, [plans, search, statusFilter]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente o concepto del plan..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="completed">Completados</option>
            <option value="paused">Pausados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          {filtered.length} de {plans.length} planes
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasFilters={search.length > 0 || statusFilter !== 'all'} totalPlans={plans.length} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((p) => <PlanCard key={p.id} plan={p} />)}
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan }: { plan: PlanRow }) {
  const total = Number(plan.final_amount || 0);
  const paid = Number(plan.paid_amount || 0);
  const pending = total - paid;
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  const cfg = PLAN_STATUS_CONFIG[plan.status as TreatmentPlanStatus] || PLAN_STATUS_CONFIG.active;
  const patientName = plan.patients ? plan.patients.first_name + ' ' + plan.patients.last_name : 'Sin paciente';

  const statusIcon = (() => {
    if (plan.status === 'completed') return <CheckCircle2 className="h-3 w-3" />;
    if (plan.status === 'paused') return <Pause className="h-3 w-3" />;
    if (plan.status === 'cancelled') return <XCircle className="h-3 w-3" />;
    return <TrendingUp className="h-3 w-3" />;
  })();

  return (
    <Link
      href={'/dental/treatments/' + plan.id}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 truncate">{plan.title}</h3>
          <p className="mt-0.5 text-sm text-slate-600 truncate">{patientName}</p>
        </div>
        <span className={'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0 ' + cfg.bg + ' ' + cfg.color + ' ' + cfg.border}>
          {statusIcon}
          {cfg.label}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-medium text-slate-500">Progreso de pago</span>
          <span className="text-xs font-bold text-emerald-700 tabular-nums">{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: progress + '%' }}
          />
        </div>
      </div>

      {/* Montos */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] font-medium text-slate-500">Total</p>
          <p className="text-sm font-bold text-slate-900 tabular-nums">{formatMoney(total)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-emerald-700">Pagado</p>
          <p className="text-sm font-bold text-emerald-700 tabular-nums">{formatMoney(paid)}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium text-amber-700">Saldo</p>
          <p className="text-sm font-bold text-amber-700 tabular-nums">{formatMoney(pending)}</p>
        </div>
      </div>

      {/* Proxima cuota */}
      {plan.status === 'active' && plan.next_due && plan.schedules_pending > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="h-3.5 w-3.5 text-amber-700 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-amber-900">
                Proxima cuota: {formatDate(plan.next_due)}
              </p>
              <p className="text-[10px] text-amber-700">
                {plan.schedules_pending} {plan.schedules_pending === 1 ? 'cuota pendiente' : 'cuotas pendientes'}
              </p>
            </div>
          </div>
          {plan.next_amount != null && (
            <p className="text-sm font-bold text-amber-900 tabular-nums shrink-0">
              {formatMoney(plan.next_amount)}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-end text-xs font-medium text-emerald-700">
        Ver detalle
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </div>
    </Link>
  );
}

function EmptyState({ hasFilters, totalPlans }: { hasFilters: boolean; totalPlans: number }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      {hasFilters ? (
        <>
          <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-900">Sin coincidencias</p>
          <p className="mt-1 text-xs text-slate-500">Prueba cambiando los filtros</p>
        </>
      ) : (
        <>
          <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-900">
            {totalPlans === 0 ? 'Aun no tienes planes de tratamiento' : 'Sin planes activos'}
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Los planes se crean al aceptar una cotizacion. Genera una cotizacion y aceptala para iniciar el plan con su cronograma de cuotas.
          </p>
          <Link href="/dental/quotations" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Ir a cotizaciones
          </Link>
        </>
      )}
    </div>
  );
}

function formatMoney(n: number | null | undefined): string {
  return 'Q' + (Number(n) || 0).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(s: string): string {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
