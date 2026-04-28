'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Eye,
  FileText,
  Calendar,
  CircleAlert,
  ArrowRight,
} from 'lucide-react';
import {
  getStatusConfig,
  parseQuotationNotes,
  type QuotationWithPatient,
  type QuotationStatus,
} from '@/lib/types/quotation';

type Props = {
  quotations: QuotationWithPatient[];
};

type StatusFilter = 'all' | QuotationStatus;
type PeriodFilter = 'all' | '7d' | '30d' | 'this_month' | 'this_year';

export function QuotationsClient({ quotations }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();

    return quotations.filter((quot) => {
      if (statusFilter !== 'all' && quot.status !== statusFilter) return false;

      if (periodFilter !== 'all') {
        const date = quot.created_at ? new Date(quot.created_at) : null;
        if (!date) return false;
        if (periodFilter === '7d') {
          const lim = new Date(now);
          lim.setDate(lim.getDate() - 7);
          if (date < lim) return false;
        } else if (periodFilter === '30d') {
          const lim = new Date(now);
          lim.setDate(lim.getDate() - 30);
          if (date < lim) return false;
        } else if (periodFilter === 'this_month') {
          if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false;
        } else if (periodFilter === 'this_year') {
          if (date.getFullYear() !== now.getFullYear()) return false;
        }
      }

      if (!q) return true;
      const patient = quot.patients ? quot.patients.first_name + ' ' + quot.patients.last_name : '';
      const haystack = [
        quot.quotation_number || '',
        parseQuotationNotes(quot.notes).title,
        parseQuotationNotes(quot.notes).description,
        patient,
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [quotations, search, statusFilter, periodFilter]);

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
              placeholder="Buscar por numero, paciente o concepto..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="sent">Enviadas</option>
              <option value="accepted">Aceptadas</option>
              <option value="rejected">Rechazadas</option>
              <option value="expired">Vencidas</option>
              <option value="cancelled">Canceladas</option>
            </select>

            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Todo el tiempo</option>
              <option value="7d">Ultimos 7 dias</option>
              <option value="30d">Ultimos 30 dias</option>
              <option value="this_month">Este mes</option>
              <option value="this_year">Este ano</option>
            </select>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <Filter className="h-3 w-3" />
          {filtered.length} de {quotations.length} cotizaciones
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState hasFilters={search.length > 0 || statusFilter !== 'all' || periodFilter !== 'all'} />
      ) : (
        <>
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-3 text-left">Numero / Fecha</th>
                  <th className="px-4 py-3 text-left">Paciente</th>
                  <th className="px-4 py-3 text-left">Concepto</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((q) => <DesktopRow key={q.id} q={q} />)}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {filtered.map((q) => <MobileCard key={q.id} q={q} />)}
          </div>
        </>
      )}
    </div>
  );
}

function DesktopRow({ q }: { q: QuotationWithPatient }) {
  const cfg = getStatusConfig(q.status);
  const patientName = q.patients ? q.patients.first_name + ' ' + q.patients.last_name : 'Sin paciente';
  const dateLabel = q.issued_at || q.created_at;

  return (
    <tr className="hover:bg-slate-50 transition">
      <td className="px-4 py-3">
        <div className="font-bold text-slate-900 text-sm">{q.quotation_number || '-'}</div>
        <div className="text-xs text-slate-500 mt-0.5">{dateLabel ? formatDate(dateLabel) : '-'}</div>
      </td>
      <td className="px-4 py-3">
        {q.patients ? (
          <Link href={'/dental/patients/' + q.patients.id} className="text-sm font-semibold text-slate-900 hover:text-emerald-600">
            {patientName}
          </Link>
        ) : (
          <span className="text-sm text-slate-500">{patientName}</span>
        )}
        {q.patients?.phone && <div className="text-xs text-slate-500 mt-0.5">{q.patients.phone}</div>}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-slate-900 line-clamp-1">{parseQuotationNotes(q.notes).title}</div>
        {q.items_count > 0 && (
          <div className="text-[11px] text-slate-500 mt-0.5">
            {q.items_count} {q.items_count === 1 ? 'tratamiento' : 'tratamientos'}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ' + cfg.bg + ' ' + cfg.color + ' ' + cfg.border}>
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="text-sm font-bold text-slate-900 tabular-nums">{formatMoney(q.total_amount)}</div>
      </td>
      <td className="px-4 py-3 text-right">
        <Link href={'/dental/quotations/' + q.id} className="inline-flex items-center gap-1 rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition">
          <Eye className="h-4 w-4" />
        </Link>
      </td>
    </tr>
  );
}

function MobileCard({ q }: { q: QuotationWithPatient }) {
  const cfg = getStatusConfig(q.status);
  const patientName = q.patients ? q.patients.first_name + ' ' + q.patients.last_name : 'Sin paciente';
  const dateLabel = q.issued_at || q.created_at;

  return (
    <Link href={'/dental/quotations/' + q.id} className="block rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 tabular-nums">{q.quotation_number || '-'}</span>
            <span className={'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold ' + cfg.bg + ' ' + cfg.color + ' ' + cfg.border}>
              {cfg.label}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="h-3 w-3" />
            {dateLabel ? formatDate(dateLabel) : '-'}
          </div>
          <p className="mt-1.5 text-sm font-bold text-slate-900 truncate">{patientName}</p>
          <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{parseQuotationNotes(q.notes).title}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-base font-bold text-slate-900 tabular-nums">{formatMoney(q.total_amount)}</div>
          {q.items_count > 0 && <div className="text-[10px] text-slate-500 mt-0.5">{q.items_count} item{q.items_count === 1 ? '' : 's'}</div>}
          <ArrowRight className="ml-auto mt-1 h-3.5 w-3.5 text-slate-300" />
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      {hasFilters ? (
        <>
          <CircleAlert className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-900">Sin coincidencias</p>
          <p className="mt-1 text-xs text-slate-500">Prueba cambiando los filtros o el termino de busqueda</p>
        </>
      ) : (
        <>
          <FileText className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-900">Aun no tienes cotizaciones</p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">Genera presupuestos formales para entregar a tus pacientes y aumentar tu tasa de conversion.</p>
          <Link href="/dental/quotations/new" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Crear primera cotizacion
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
  const d = new Date(s);
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
