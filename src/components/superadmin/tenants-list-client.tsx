'use client';

import { useState, useMemo } from 'react';
import { Toaster } from 'sonner';
import {
  Shield,
  Search,
  Building2,
  Stethoscope,
  Scale,
  Users,
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Pause,
  XCircle,
  Eye,
  HelpCircle,
  FileText,
  Gavel,
} from 'lucide-react';
import type { TenantSummary, TenantFilter, VerticalFilter } from '@/lib/types/superadmin';
import { getVerticalLabels, STATUS_TOOLTIPS } from '@/lib/types/vertical-labels';
import { SuspendModal } from './suspend-modal';
import { ReactivateButton } from './reactivate-button';
import { TenantDetailModal } from './tenant-detail-modal';

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function isTenantInTrial(t: TenantSummary): boolean {
  if (t.subscription_status === 'trial') return true;
  if (t.trial_ends_at && new Date(t.trial_ends_at) > new Date()) return true;
  return false;
}

export function TenantsListClient(props: { tenants: TenantSummary[] }) {
  const [search, setSearch] = useState('');
  const [verticalFilter, setVerticalFilter] = useState<VerticalFilter>('all');
  const [statusFilter, setStatusFilter] = useState<TenantFilter>('all');
  const [suspendingTenant, setSuspendingTenant] = useState<TenantSummary | null>(null);
  const [viewingTenant, setViewingTenant] = useState<TenantSummary | null>(null);

  const filtered = useMemo(() => {
    return props.tenants.filter((t) => {
      if (verticalFilter !== 'all' && t.vertical !== verticalFilter) return false;
      if (statusFilter === 'active' && (!t.is_active || t.subscription_status !== 'active')) return false;
      if (statusFilter === 'inactive' && t.is_active) return false;
      if (statusFilter === 'trial' && !isTenantInTrial(t)) return false;
      if (statusFilter === 'onboarding' && t.is_onboarding_complete) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [props.tenants, search, verticalFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: props.tenants.length,
      active: props.tenants.filter((t) => t.is_active && t.subscription_status === 'active').length,
      trial: props.tenants.filter(isTenantInTrial).length,
      inactive: props.tenants.filter((t) => !t.is_active).length,
      onboarding: props.tenants.filter((t) => t.is_onboarding_complete === false).length,
    };
  }, [props.tenants]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <Toaster position="top-right" richColors closeButton />

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-6 w-6 text-violet-700" />
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
        </div>
        <p className="text-sm text-slate-500">Vista global de todos los clientes de la plataforma</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total" value={stats.total} color="slate" tooltip="Cantidad total de tenants registrados" />
        <StatCard label="Activos" value={stats.active} color="emerald" tooltip={STATUS_TOOLTIPS.active} />
        <StatCard label="En prueba" value={stats.trial} color="amber" tooltip={STATUS_TOOLTIPS.trial} />
        <StatCard label="Onboarding" value={stats.onboarding} color="blue" tooltip={STATUS_TOOLTIPS.onboarding} />
        <StatCard label="Inactivos" value={stats.inactive} color="rose" tooltip={STATUS_TOOLTIPS.suspended} />
      </div>

      <div className="mb-4 bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={verticalFilter}
          onChange={(e) => setVerticalFilter(e.target.value as VerticalFilter)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">Todos los verticales</option>
          <option value="dental">Dental</option>
          <option value="legal">Legal</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TenantFilter)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="trial">En prueba</option>
          <option value="onboarding">En onboarding</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Mostrando {filtered.length} de {props.tenants.length} tenants
      </p>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            No hay tenants que coincidan con el filtro
          </div>
        ) : (
          filtered.map((t) => (
            <TenantCard
              key={t.id}
              tenant={t}
              onSuspend={() => setSuspendingTenant(t)}
              onView={() => setViewingTenant(t)}
            />
          ))
        )}
      </div>

      {suspendingTenant ? (
        <SuspendModal
          tenantId={suspendingTenant.id}
          tenantName={suspendingTenant.name}
          onClose={() => setSuspendingTenant(null)}
        />
      ) : null}

      {viewingTenant ? (
        <TenantDetailModal
          tenantId={viewingTenant.id}
          onClose={() => setViewingTenant(null)}
        />
      ) : null}
    </div>
  );
}

function StatCard(props: { label: string; value: number; color: string; tooltip?: string }) {
  const colorClasses: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-900 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    blue: 'bg-blue-50 text-blue-900 border-blue-200',
    rose: 'bg-rose-50 text-rose-900 border-rose-200',
  };
  return (
    <div className={'rounded-xl border p-3 ' + (colorClasses[props.color] || colorClasses.slate)}>
      <div className="flex items-center gap-1">
        <p className="text-[11px] font-bold uppercase opacity-70">{props.label}</p>
        {props.tooltip ? (
          <span className="group relative">
            <HelpCircle className="h-3 w-3 opacity-50 cursor-help" />
            <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block w-56 rounded-lg bg-slate-900 text-white p-2 text-[10px] z-20 shadow-lg">
              {props.tooltip}
            </span>
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-bold tabular-nums mt-0.5">{props.value}</p>
    </div>
  );
}

function TenantCard(props: { tenant: TenantSummary; onSuspend: () => void; onView: () => void }) {
  const t = props.tenant;
  const VerticalIcon = t.vertical === 'legal' ? Scale : Stethoscope;
  const trialDays = daysUntil(t.trial_ends_at);
  const showTrial = isTenantInTrial(t) && trialDays !== null;
  const labels = getVerticalLabels(t.vertical);

  // Iconos adaptativos
  const ProfessionalsIcon = t.vertical === 'legal' ? Gavel : Stethoscope;
  const PatientsIcon = t.vertical === 'legal' ? FileText : Users;

  return (
    <div className={'bg-white rounded-xl border p-4 hover:border-blue-300 transition ' + (!t.is_active ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200')}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <VerticalIcon className="h-5 w-5 text-slate-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 truncate">{t.name}</h3>
            <p className="text-xs text-slate-500 truncate">
              {t.email} | {t.slug}.innovaavgt.com
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t.vertical === 'legal' ? 'Despacho legal' : 'Clinica dental'} | Creado: {formatDate(t.created_at)}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          <StatusBadge tenant={t} />
          {t.plan_name ? (
            <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
              {t.plan_name}
            </span>
          ) : null}
        </div>
      </div>

      {showTrial ? (
        <div
          className={
            'rounded-lg p-2 mb-3 text-xs ' +
            (trialDays! <= 3
              ? 'bg-rose-50 text-rose-900'
              : trialDays! <= 7
              ? 'bg-amber-50 text-amber-900'
              : 'bg-blue-50 text-blue-900')
          }
        >
          {trialDays! > 0
            ? 'Trial vence en ' + trialDays + ' dia' + (trialDays === 1 ? '' : 's') + ' (' + formatDate(t.trial_ends_at) + ')'
            : 'Trial expirado el ' + formatDate(t.trial_ends_at)}
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Metric icon={<Users className="h-3 w-3" />} label="Usuarios" value={t.user_count} />
        <Metric icon={<ProfessionalsIcon className="h-3 w-3" />} label={labels.professionals} value={t.professional_count} />
        <Metric icon={<PatientsIcon className="h-3 w-3" />} label={labels.patients} value={t.patient_count} />
        <Metric icon={<Calendar className="h-3 w-3" />} label={labels.appointments} value={t.appointment_count} />
        <Metric icon={<Briefcase className="h-3 w-3" />} label={labels.services} value={t.service_count} />
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={props.onView}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver detalle
        </button>
        {t.is_active ? (
          <button
            type="button"
            onClick={props.onSuspend}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700"
          >
            <Pause className="h-3.5 w-3.5" />
            Suspender
          </button>
        ) : (
          <ReactivateButton tenantId={t.id} tenantName={t.name} />
        )}
      </div>
    </div>
  );
}

function StatusBadge(props: { tenant: TenantSummary }) {
  const t = props.tenant;

  if (!t.is_active) {
    return <BadgeWithTooltip color="rose" icon={<Pause className="h-3 w-3" />} label="Suspendido" tooltip={STATUS_TOOLTIPS.suspended} />;
  }

  if (t.is_onboarding_complete === false) {
    return <BadgeWithTooltip color="blue" icon={<AlertCircle className="h-3 w-3" />} label="Onboarding" tooltip={STATUS_TOOLTIPS.onboarding} />;
  }

  if (isTenantInTrial(t)) {
    return <BadgeWithTooltip color="amber" icon={<AlertCircle className="h-3 w-3" />} label="Trial" tooltip={STATUS_TOOLTIPS.trial} />;
  }

  if (t.subscription_status === 'active') {
    return <BadgeWithTooltip color="emerald" icon={<CheckCircle2 className="h-3 w-3" />} label="Activo" tooltip={STATUS_TOOLTIPS.active} />;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
      <XCircle className="h-3 w-3" />
      {t.subscription_status || 'Sin estado'}
    </span>
  );
}

function BadgeWithTooltip(props: { color: 'rose' | 'blue' | 'amber' | 'emerald'; icon: React.ReactNode; label: string; tooltip: string }) {
  const colors: Record<string, string> = {
    rose: 'bg-rose-100 text-rose-800',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    emerald: 'bg-emerald-100 text-emerald-800',
  };
  return (
    <span className="group relative inline-block">
      <span className={'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold cursor-help ' + colors[props.color]}>
        {props.icon}
        {props.label}
      </span>
      <span className="absolute right-0 top-full mt-1 hidden group-hover:block w-64 rounded-lg bg-slate-900 text-white p-2 text-[10px] z-20 shadow-lg">
        {props.tooltip}
      </span>
    </span>
  );
}

function Metric(props: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5">
      <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase">
        {props.icon}
        {props.label}
      </div>
      <p className="text-sm font-bold text-slate-900 tabular-nums">{props.value}</p>
    </div>
  );
}
