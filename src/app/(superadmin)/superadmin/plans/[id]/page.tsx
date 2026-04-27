import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { PlanEditForm } from '@/components/superadmin/plan-edit-form';
import type { VerticalCode } from '@/lib/verticals';
import {
  ArrowLeft,
  Building2,
  Users,
  ExternalLink,
} from 'lucide-react';

type Plan = {
  id: string;
  code: string;
  vertical: VerticalCode;
  name: string;
  description: string | null;
  monthly_price: number;
  annual_price: number | null;
  currency: string;
  max_users: number | null;
  max_branches: number | null;
  max_patients: number | null;
  max_cases: number | null;
  storage_mb: number | null;
  features: Record<string, unknown>;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type TenantUsingPlan = {
  id: string;
  name: string;
  slug: string | null;
  tenant_status: string | null;
};

// ⚠️ Next.js 15/16: params es Promise
type PageProps = {
  params: Promise<{ id: string }>;
};

async function getPlan(id: string): Promise<Plan | null> {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as Plan;
}

async function getTenantsUsingPlan(planId: string): Promise<TenantUsingPlan[]> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id, name, slug, tenant_status')
    .eq('plan_id', planId)
    .order('name');
  if (error || !data) return [];
  return data as TenantUsingPlan[];
}

async function getCurrencies(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('currencies')
    .select('code')
    .eq('is_active', true)
    .order('code');
  if (error || !data) return ['GTQ', 'USD'];
  return data.map((c) => c.code);
}

function statusText(value: string | null) {
  switch (value) {
    case 'active': return 'Activa';
    case 'trial': return 'En prueba';
    case 'suspended': return 'Suspendida';
    case 'cancelled': return 'Cancelada';
    default: return 'Sin definir';
  }
}

function statusBadge(value: string | null) {
  switch (value) {
    case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'trial': return 'bg-violet-100 text-violet-700 border-violet-200';
    case 'suspended': return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'cancelled': return 'bg-slate-200 text-slate-700 border-slate-300';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { id } = await params;

  const plan = await getPlan(id);
  if (!plan) notFound();

  const [tenants, currencies] = await Promise.all([
    getTenantsUsingPlan(id),
    getCurrencies(),
  ]);

  const activeTenants = tenants.filter((t) => t.tenant_status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500">
        <Link href="/superadmin" className="hover:text-slate-700">Inicio</Link>
        <span className="mx-2">›</span>
        <Link href="/superadmin/plans" className="hover:text-slate-700">Planes</Link>
        <span className="mx-2">›</span>
        <span className="font-medium text-slate-700">{plan.name}</span>
      </div>

      {/* Botón volver */}
      <Link
        href="/superadmin/plans"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a Planes
      </Link>

      {/* Header */}
      <section className="rounded-[32px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                {plan.name}
              </h1>
              <VerticalBadge vertical={plan.vertical} variant="compact" />
              {!plan.is_active && (
                <span className="rounded-md bg-rose-100 px-2 py-1 text-xs font-bold text-rose-700">
                  Inactivo
                </span>
              )}
            </div>
            <p className="mt-2 text-base text-slate-500">
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                {plan.code}
              </code>
              {plan.description && (
                <span className="ml-3">— {plan.description}</span>
              )}
            </p>
          </div>
        </div>

        {/* Mini KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-500">Tenants con este plan</div>
            <div className="mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-400" />
              <span className="text-2xl font-bold text-slate-900">{tenants.length}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-500">Activos</div>
            <div className="mt-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-2xl font-bold text-emerald-600">{activeTenants}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-500">Precio mensual</div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {plan.currency} {plan.monthly_price.toFixed(2)}
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs font-medium text-slate-500">Última actualización</div>
            <div className="mt-1 text-sm font-semibold text-slate-700">
              {new Date(plan.updated_at).toLocaleDateString('es-GT', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Form de edición */}
      <PlanEditForm plan={plan} availableCurrencies={currencies} />

      {/* Listado de tenants usando este plan */}
      {tenants.length > 0 && (
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">
            Clientes con este plan ({tenants.length})
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Cualquier cambio en este plan afectará a los siguientes clientes.
          </p>

          <div className="mt-5 divide-y divide-slate-100">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{tenant.name}</div>
                  <div className="text-xs text-slate-500">{tenant.slug}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadge(
                      tenant.tenant_status
                    )}`}
                  >
                    {statusText(tenant.tenant_status)}
                  </span>
                  <Link
                    href={`/superadmin/clients/${tenant.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                  >
                    Ver detalle
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}