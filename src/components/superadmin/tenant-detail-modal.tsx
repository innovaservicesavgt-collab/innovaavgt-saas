'use client';

import { useEffect, useState } from 'react';
import {
  X, Building2, Mail, Phone, MapPin, Calendar, Crown, CreditCard,
  Users, Stethoscope, Briefcase, AlertTriangle, CheckCircle2, Clock, Loader2,
  Gavel, FileText, HelpCircle,
} from 'lucide-react';
import { getTenantDetails } from '@/server/actions/superadmin';
import { getVerticalLabels, STATUS_TOOLTIPS } from '@/lib/types/vertical-labels';

type Props = {
  tenantId: string;
  onClose: () => void;
};

type TenantDetails = {
  tenant: Record<string, unknown>;
  subscription: Record<string, unknown> | null;
  suspendedByProfile: { first_name: string; last_name: string; email: string } | null;
  metrics: { users: number; professionals: number; patients: number; appointments: number; services: number };
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function TenantDetailModal(props: Props) {
  const [data, setData] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await getTenantDetails(props.tenantId);
      if (!mounted) return;
      if (!res.ok) {
        setError(res.error);
      } else {
        setData({
          tenant: res.tenant as Record<string, unknown>,
          subscription: res.subscription as Record<string, unknown> | null,
          suspendedByProfile: res.suspendedByProfile,
          metrics: res.metrics,
        });
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [props.tenantId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={props.onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="text-base font-bold text-slate-900">Detalles del tenant</h3>
          <button type="button" onClick={props.onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Cargando detalles...</p>
          </div>
        ) : error ? (
          <div className="p-8">
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-900">
              <p className="font-bold">Error</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </div>
        ) : data ? (
          <DetailContent data={data} />
        ) : null}
      </div>
    </div>
  );
}

function DetailContent(props: { data: TenantDetails }) {
  const t = props.data.tenant as {
    id: string; name: string; slug: string; email: string; phone: string | null;
    address: string | null; vertical: string; is_active: boolean | null;
    is_onboarding_complete: boolean | null; onboarding_completed_at: string | null;
    suspended_at: string | null; suspension_reason: string | null;
    reactivated_at: string | null; created_at: string;
    plan: { name: string; monthly_price: number; currency: string; max_users: number; storage_mb: number } | null;
  };

  const sub = props.data.subscription as {
    status: string; billing_cycle: string; trial_ends_at: string | null;
    current_period_end: string | null;
  } | null;

  const planObj = Array.isArray(t.plan) ? t.plan[0] : t.plan;
  const labels = getVerticalLabels(t.vertical);
  const ProfessionalsIcon = t.vertical === 'legal' ? Gavel : Stethoscope;
  const PatientsIcon = t.vertical === 'legal' ? FileText : Users;

  return (
    <div className="p-5 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t.name}</h2>
        <p className="text-sm text-slate-500 font-mono">{t.slug}.innovaavgt.com</p>
      </div>

      {!t.is_active ? (
        <div className="rounded-xl bg-rose-50 border-2 border-rose-300 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-900">Tenant suspendido</p>
              <p className="text-[11px] text-rose-700 mt-0.5 italic">{STATUS_TOOLTIPS.suspended}</p>
              {t.suspension_reason ? <p className="text-xs text-rose-800 mt-2"><strong>Razon:</strong> {t.suspension_reason}</p> : null}
              {t.suspended_at ? <p className="text-xs text-rose-800 mt-0.5"><strong>Suspendido el:</strong> {formatDate(t.suspended_at)}</p> : null}
              {props.data.suspendedByProfile ? <p className="text-xs text-rose-800 mt-0.5"><strong>Por:</strong> {props.data.suspendedByProfile.first_name} {props.data.suspendedByProfile.last_name}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {t.is_onboarding_complete === false ? (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-900">Onboarding incompleto</p>
              <p className="text-[11px] text-blue-700 mt-0.5">{STATUS_TOOLTIPS.onboarding}</p>
            </div>
          </div>
        </div>
      ) : null}

      <Section title="Informacion general" icon={<Building2 className="h-4 w-4" />}>
        <DetailRow label="Vertical" value={t.vertical === 'legal' ? 'Despacho legal' : t.vertical === 'dental' ? 'Clinica dental' : t.vertical} />
        <DetailRow label="Email" value={t.email} icon={<Mail className="h-3 w-3" />} />
        {t.phone ? <DetailRow label="Telefono" value={t.phone} icon={<Phone className="h-3 w-3" />} /> : null}
        {t.address ? <DetailRow label="Direccion" value={t.address} icon={<MapPin className="h-3 w-3" />} /> : null}
        <DetailRow label="Creado" value={formatDateShort(t.created_at)} icon={<Calendar className="h-3 w-3" />} />
        <DetailRow
          label="Onboarding"
          value={t.is_onboarding_complete ? 'Completo (' + formatDateShort(t.onboarding_completed_at) + ')' : 'En progreso'}
          icon={t.is_onboarding_complete ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Clock className="h-3 w-3 text-amber-600" />}
        />
      </Section>

      {planObj ? (
        <Section title="Plan y suscripcion" icon={<Crown className="h-4 w-4" />}>
          <DetailRow label="Plan" value={planObj.name} />
          <DetailRow label="Precio" value={planObj.currency + ' ' + planObj.monthly_price.toLocaleString('es-GT', { minimumFractionDigits: 2 }) + '/mes'} />
          {sub ? (
            <>
              <DetailRow label="Estado" value={sub.status} icon={<CreditCard className="h-3 w-3" />} />
              <DetailRow label="Ciclo" value={sub.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'} />
              {sub.status === 'trial' && sub.trial_ends_at ? <DetailRow label="Trial vence" value={formatDateShort(sub.trial_ends_at)} /> : null}
              {sub.current_period_end ? <DetailRow label="Proximo pago" value={formatDateShort(sub.current_period_end)} /> : null}
            </>
          ) : <p className="text-xs text-amber-700 italic mt-2">Sin suscripcion registrada</p>}
          <DetailRow label="Limites" value={(planObj.max_users || 'inf') + ' usuarios | ' + Math.round((planObj.storage_mb || 0) / 1024) + ' GB storage'} />
        </Section>
      ) : null}

      <Section title={'Metricas de uso (' + (t.vertical === 'legal' ? 'Despacho' : 'Clinica') + ')'} icon={<Briefcase className="h-4 w-4" />}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <MetricBox icon={<Users className="h-4 w-4" />} label="Usuarios" value={props.data.metrics.users} />
          <MetricBox icon={<ProfessionalsIcon className="h-4 w-4" />} label={labels.professionals} value={props.data.metrics.professionals} />
          <MetricBox icon={<PatientsIcon className="h-4 w-4" />} label={labels.patients} value={props.data.metrics.patients} />
          <MetricBox icon={<Calendar className="h-4 w-4" />} label={labels.appointments} value={props.data.metrics.appointments} />
          <MetricBox icon={<Briefcase className="h-4 w-4" />} label={labels.services} value={props.data.metrics.services} />
        </div>
      </Section>

      {t.reactivated_at ? (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
          <p className="font-bold">Ultima reactivacion: {formatDate(t.reactivated_at)}</p>
        </div>
      ) : null}
    </div>
  );
}

function Section(props: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase text-slate-500 mb-2 flex items-center gap-1.5">
        {props.icon}
        {props.title}
      </h4>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
        {props.children}
      </div>
    </div>
  );
}

function DetailRow(props: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-slate-500 shrink-0 flex items-center gap-1">
        {props.icon}
        {props.label}:
      </span>
      <span className="text-slate-900 font-bold text-right break-words">{props.value}</span>
    </div>
  );
}

function MetricBox(props: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 p-2">
      <div className="flex items-center gap-1 text-slate-500 mb-1">
        {props.icon}
      </div>
      <p className="text-lg font-bold text-slate-900 tabular-nums">{props.value}</p>
      <p className="text-[10px] uppercase font-bold text-slate-500">{props.label}</p>
    </div>
  );
}

function AlertCircle(props: { className?: string }) {
  return <div className={props.className}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" /><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" /></svg></div>;
}
