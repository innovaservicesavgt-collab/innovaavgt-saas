'use client';

import { Crown, Calendar, Users, Database, CheckCircle2, AlertCircle, MailCheck } from 'lucide-react';

type Plan = {
  id: string;
  code: string;
  name: string;
  monthly_price: number;
  currency: string;
  trial_days: number | null;
  max_users: number | null;
  max_branches: number | null;
  storage_mb: number | null;
  features: Record<string, unknown>;
} | null;

type Subscription = {
  id: string;
  status: string;
  billing_cycle: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  locked_price: number;
  currency: string;
} | null;

function daysBetween(now: Date, future: Date): number {
  const ms = future.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function TabPlan(props: { plan: Plan; subscription: Subscription }) {
  const { plan, subscription } = props;

  if (!plan) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900">Sin plan asignado</h2>
        <p className="text-sm text-slate-500 mt-1">Contacta a soporte para asignar un plan a tu clinica.</p>
      </div>
    );
  }

  const status = subscription?.status || 'unknown';
  const isTrial = status === 'trial';
  const isActive = status === 'active';
  const trialEnds = subscription?.trial_ends_at;
  const daysLeft = trialEnds ? daysBetween(new Date(), new Date(trialEnds)) : null;

  return (
    <div className="space-y-4">
      {/* Card 1: Plan actual */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Plan actual</p>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mt-1">
              <Crown className="h-6 w-6 text-amber-500" />
              {plan.name}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {plan.currency} {plan.monthly_price.toLocaleString('es-GT', { minimumFractionDigits: 2 })}/mes
            </p>
          </div>

          {isTrial ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              Periodo de prueba
            </span>
          ) : isActive ? (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Activo
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
              {status}
            </span>
          )}
        </div>

        {/* Trial countdown */}
        {isTrial && daysLeft !== null ? (
          <div
            className={
              'rounded-lg p-3 mb-4 ' +
              (daysLeft <= 3
                ? 'bg-rose-50 border border-rose-200'
                : daysLeft <= 7
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-blue-50 border border-blue-200')
            }
          >
            <p className="text-xs font-bold mb-0.5 ' + (daysLeft <= 3 ? 'text-rose-900' : daysLeft <= 7 ? 'text-amber-900' : 'text-blue-900')">
              {daysLeft > 0 ? 'Tu prueba termina en ' + daysLeft + ' dia' + (daysLeft === 1 ? '' : 's') : 'Tu prueba expiro'}
            </p>
            <p className="text-xs text-slate-700">
              {trialEnds ? 'Vence el ' + formatDate(trialEnds) : ''}
            </p>
          </div>
        ) : null}

        {/* Limites del plan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <LimitCard
            icon={<Users className="h-4 w-4" />}
            label="Usuarios"
            value={plan.max_users ? plan.max_users.toString() : 'Ilimitados'}
          />
          <LimitCard
            icon={<Database className="h-4 w-4" />}
            label="Almacenamiento"
            value={plan.storage_mb ? Math.round(plan.storage_mb / 1024) + ' GB' : 'Ilimitado'}
          />
          <LimitCard
            icon={<Calendar className="h-4 w-4" />}
            label="Sucursales"
            value={plan.max_branches ? plan.max_branches.toString() : 'Ilimitadas'}
          />
        </div>

        {/* Features */}
        {Object.keys(plan.features || {}).length > 0 ? (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Funciones incluidas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {Object.entries(plan.features as Record<string, unknown>)
                .filter(([, v]) => v === true || v === 'true')
                .map(([key]) => (
                  <div key={key} className="flex items-center gap-1.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{formatFeatureName(key)}</span>
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Card 2: Suscripcion */}
      {subscription ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-base font-bold text-slate-900 mb-3">Detalles de suscripcion</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <DetailRow label="Ciclo de facturacion" value={subscription.billing_cycle === 'monthly' ? 'Mensual' : 'Anual'} />
            <DetailRow label="Precio bloqueado" value={subscription.currency + ' ' + subscription.locked_price.toLocaleString('es-GT', { minimumFractionDigits: 2 })} />
            <DetailRow label="Estado" value={subscription.status} />
            {subscription.current_period_end ? (
              <DetailRow label="Proximo pago" value={formatDate(subscription.current_period_end)} />
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Card 3: Upgrade */}
      <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-xl border-2 border-blue-200 p-6">
        <div className="flex items-start gap-3">
          <MailCheck className="h-6 w-6 text-blue-600 shrink-0" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">Necesitas mas funciones o cambiar de plan?</h3>
            <p className="text-sm text-slate-700 mt-1">
              Contactanos y te ayudamos a elegir el plan ideal para tu clinica.
            </p>
            <a
              href="mailto:contacto@innovaavgt.com?subject=Cambio de plan"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              style={{ textDecoration: 'none' }}
            >
              Contactar a soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function LimitCard(props: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
        {props.icon}
        <span className="text-[10px] font-bold uppercase">{props.label}</span>
      </div>
      <p className="text-base font-bold text-slate-900">{props.value}</p>
    </div>
  );
}

function DetailRow(props: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase text-slate-500">{props.label}</p>
      <p className="text-sm font-bold text-slate-900 capitalize">{props.value}</p>
    </div>
  );
}

function formatFeatureName(key: string): string {
  return key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}
