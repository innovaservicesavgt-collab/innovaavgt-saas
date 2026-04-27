import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { getVertical, type VerticalCode } from '@/lib/verticals';
import {
  Package,
  Users,
  Building2,
  HardDrive,
  UserCog,
  Check,
  Eye,
  DollarSign,
  Layers,
  Sparkles,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────
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
};

type TenantSummary = {
  id: string;
  plan_id: string | null;
  tenant_status: string | null;
  monthly_fee: number | null;
};

// Mapeo de features a nombres legibles (para mostrar las más importantes)
// No tiene que incluir todas — solo las que tienen valor mostrar en la card.
const FEATURE_LABELS: Record<string, string> = {
  // Comunes
  reports_basic: 'Reportes básicos',
  reports_advanced: 'Reportes avanzados',
  audit_logs: 'Logs de auditoría',
  api_access: 'Acceso API',
  white_label: 'Marca blanca',
  sso: 'SSO',

  // Dental
  odontogram: 'Odontograma',
  periodontogram: 'Periodontograma',
  orthodontics: 'Ortodoncia',
  inventory: 'Inventario',
  cash_register: 'Control de caja',
  expenses: 'Control de gastos',
  lab_orders: 'Laboratorios',
  commissions: 'Comisiones',
  patient_portal: 'Portal de pacientes',
  whatsapp_reminders: 'Recordatorios WhatsApp',
  email_campaigns: 'Campañas por email',
  nps_surveys: 'Encuestas NPS',
  ai_features: 'Funciones con IA',

  // Legal
  cases: 'Expedientes',
  actuations: 'Actuaciones',
  honorarios: 'Honorarios',
};

// ─────────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────────
async function getPlans(): Promise<Plan[]> {
  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .order('vertical', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('[superadmin/plans] Error fetching plans:', error);
    return [];
  }
  return (data || []) as Plan[];
}

async function getTenantSummaries(): Promise<TenantSummary[]> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('id, plan_id, tenant_status, monthly_fee');

  if (error) {
    console.error('[superadmin/plans] Error fetching tenants:', error);
    return [];
  }
  return (data || []) as TenantSummary[];
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function formatCurrency(amount: number, currency: string) {
  const symbol: Record<string, string> = {
    GTQ: 'Q',
    USD: '$',
    MXN: 'MX$',
    EUR: '€',
    COP: 'COL$',
    CLP: 'CL$',
    PEN: 'S/',
  };
  const s = symbol[currency] || currency + ' ';
  return `${s}${amount.toFixed(2)}`;
}

function formatLimit(n: number | null, labelPlural: string) {
  if (n === null || n === undefined) return `${labelPlural} ilimitados`;
  return `${n.toLocaleString('es-GT')} ${labelPlural}`;
}

function formatStorage(mb: number | null) {
  if (!mb) return 'Almacenamiento ilimitado';
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB almacenamiento`;
  return `${mb} MB almacenamiento`;
}

/**
 * Extrae las features activas (value === true) para mostrarlas en la card.
 * Ignora features que son configuraciones numéricas (ej: whatsapp_monthly_limit).
 */
function getActiveFeatures(features: Record<string, unknown>): string[] {
  return Object.entries(features)
    .filter(([, value]) => value === true)
    .map(([key]) => FEATURE_LABELS[key] || key)
    .sort((a, b) => a.localeCompare(b));
}

// ─────────────────────────────────────────────────────────────────
// UI locales
// ─────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon,
  iconBg,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 truncate text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  tenantCount,
  activeTenantCount,
}: {
  plan: Plan;
  tenantCount: number;
  activeTenantCount: number;
}) {
  const verticalConfig = getVertical(plan.vertical);
  const activeFeatures = getActiveFeatures(plan.features);

  // Borde coloreado según vertical
  const borderClass =
    plan.vertical === 'legal'
      ? 'border-blue-200 hover:border-blue-400'
      : 'border-emerald-200 hover:border-emerald-400';

  const priceColor =
    plan.vertical === 'legal' ? 'text-blue-600' : 'text-emerald-600';

  // Tier visual (Starter / Pro / Enterprise) → badge
  const tier = plan.code.endsWith('_enterprise')
    ? { label: 'Enterprise', cls: 'bg-purple-100 text-purple-700 border-purple-200' }
    : plan.code.endsWith('_pro')
    ? { label: 'Pro', cls: 'bg-amber-100 text-amber-700 border-amber-200' }
    : { label: 'Starter', cls: 'bg-slate-100 text-slate-700 border-slate-200' };

  return (
    <div
      className={`flex flex-col rounded-3xl border-2 bg-white p-6 shadow-sm transition-all ${borderClass}`}
    >
      {/* Header: vertical badge + tier */}
      <div className="flex items-center justify-between gap-2">
        <VerticalBadge vertical={plan.vertical} variant="compact" />
        <span
          className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${tier.cls}`}
        >
          {tier.label}
        </span>
      </div>

      {/* Nombre y descripción */}
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
        {plan.description && (
          <p className="mt-1.5 text-sm text-slate-600">{plan.description}</p>
        )}
      </div>

      {/* Precio */}
      <div className="mt-5 border-b border-slate-100 pb-5">
        <div className="flex items-baseline gap-1.5">
          <span className={`text-4xl font-bold ${priceColor}`}>
            {formatCurrency(plan.monthly_price, plan.currency)}
          </span>
          <span className="text-sm font-medium text-slate-500">/ mes</span>
        </div>
        {plan.annual_price && (
          <p className="mt-1 text-xs text-slate-500">
            Anual: {formatCurrency(plan.annual_price, plan.currency)} (≈{' '}
            {formatCurrency(plan.annual_price / 12, plan.currency)}/mes)
          </p>
        )}
      </div>

      {/* Uso actual */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-medium text-slate-500">Clientes con este plan</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{tenantCount}</div>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs font-medium text-slate-500">Activos</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {activeTenantCount}
          </div>
        </div>
      </div>

      {/* Límites */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <UserCog className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{formatLimit(plan.max_users, 'usuarios')}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{formatLimit(plan.max_branches, 'sucursales')}</span>
        </div>

        {plan.vertical === 'dental' && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Users className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{formatLimit(plan.max_patients, 'pacientes')}</span>
          </div>
        )}

        {plan.vertical === 'legal' && plan.max_cases !== undefined && (
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Layers className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{formatLimit(plan.max_cases, 'expedientes')}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-700">
          <HardDrive className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{formatStorage(plan.storage_mb)}</span>
        </div>
      </div>

      {/* Features activas */}
      {activeFeatures.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Incluye {activeFeatures.length} funciones
          </p>
          <div className="space-y-1.5">
            {activeFeatures.slice(0, 6).map((feat) => (
              <div key={feat} className="flex items-start gap-2 text-sm text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{feat}</span>
              </div>
            ))}
            {activeFeatures.length > 6 && (
              <div className="pl-6 text-xs font-medium text-slate-500">
                + {activeFeatures.length - 6} funciones más
              </div>
            )}
          </div>
        </div>
      )}

      {/* Acción */}
      <Link
        href={`/superadmin/plans/${plan.id}`}
        className={`mt-auto pt-5 inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
          plan.vertical === 'legal'
            ? 'bg-blue-600 hover:bg-blue-700'
            : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        <Eye className="h-4 w-4" />
        Ver detalle y editar
      </Link>
    </div>
  );
}

function VerticalSection({
  verticalCode,
  plans,
  tenantsByPlan,
}: {
  verticalCode: VerticalCode;
  plans: Plan[];
  tenantsByPlan: Map<string, { total: number; active: number }>;
}) {
  const config = getVertical(verticalCode);
  const Icon = config.icon;

  const headerBorder =
    verticalCode === 'legal' ? 'border-blue-200' : 'border-emerald-200';
  const headerBg =
    verticalCode === 'legal'
      ? 'bg-gradient-to-r from-blue-50 to-white'
      : 'bg-gradient-to-r from-emerald-50 to-white';
  const iconColor =
    verticalCode === 'legal' ? 'text-blue-600' : 'text-emerald-600';
  const iconBg =
    verticalCode === 'legal' ? 'bg-blue-100' : 'bg-emerald-100';

  if (plans.length === 0) {
    return null;
  }

  return (
    <section>
      <div
        className={`mb-4 flex items-center gap-4 rounded-2xl border ${headerBorder} ${headerBg} px-5 py-4`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {config.brandName}
          </h2>
          <p className="text-sm text-slate-600">
            {plans.length} {plans.length === 1 ? 'plan' : 'planes'} · {config.labelPlural}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const stats = tenantsByPlan.get(plan.id) || { total: 0, active: 0 };
          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              tenantCount={stats.total}
              activeTenantCount={stats.active}
            />
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────
// PÁGINA
// ─────────────────────────────────────────────────────────────────
export default async function SuperadminPlansPage() {
  const [plans, tenants] = await Promise.all([getPlans(), getTenantSummaries()]);

  // Agrupar por vertical
  const legalPlans = plans.filter((p) => p.vertical === 'legal');
  const dentalPlans = plans.filter((p) => p.vertical === 'dental');

  // Contar tenants por plan (totales y activos)
  const tenantsByPlan = new Map<string, { total: number; active: number }>();
  tenants.forEach((t) => {
    if (!t.plan_id) return;
    const current = tenantsByPlan.get(t.plan_id) || { total: 0, active: 0 };
    current.total += 1;
    if (t.tenant_status === 'active') current.active += 1;
    tenantsByPlan.set(t.plan_id, current);
  });

  // KPIs
  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.is_active).length;

  // MRR potencial = suma del precio mensual de todos los tenants según su plan
  const mrrPotential = tenants.reduce((sum, t) => {
    const plan = plans.find((p) => p.id === t.plan_id);
    return sum + (plan?.monthly_price || 0);
  }, 0);

  // MRR real = solo tenants activos
  const mrrReal = tenants
    .filter((t) => t.tenant_status === 'active')
    .reduce((sum, t) => {
      const plan = plans.find((p) => p.id === t.plan_id);
      return sum + (plan?.monthly_price || 0);
    }, 0);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500">
        Inicio <span className="mx-2">›</span>
        <span className="font-medium text-slate-700">Planes</span>
      </div>

      {/* Header */}
      <section className="rounded-[32px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900">
              Planes
            </h1>
            <p className="mt-3 max-w-3xl text-lg text-slate-500">
              Catálogo de planes disponibles por vertical. Cada plan define
              límites y funciones activas para los clientes que lo contratan.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <div className="text-sm text-amber-900">
              <div className="font-semibold">Próximamente</div>
              <div className="text-xs">Crear nuevos planes personalizados</div>
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de planes"
          value={totalPlans}
          icon={<Package className="h-6 w-6 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Planes activos"
          value={activePlans}
          icon={<Check className="h-6 w-6 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="MRR potencial"
          value={formatCurrency(mrrPotential, 'GTQ')}
          icon={<DollarSign className="h-6 w-6 text-violet-600" />}
          iconBg="bg-violet-50"
        />
        <StatCard
          title="MRR real (activos)"
          value={formatCurrency(mrrReal, 'GTQ')}
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
          iconBg="bg-green-50"
        />
      </section>

      {/* Planes agrupados por vertical */}
      <div className="space-y-8">
        <VerticalSection
          verticalCode="legal"
          plans={legalPlans}
          tenantsByPlan={tenantsByPlan}
        />
        <VerticalSection
          verticalCode="dental"
          plans={dentalPlans}
          tenantsByPlan={tenantsByPlan}
        />
      </div>

      {/* Empty state global */}
      {plans.length === 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            No hay planes creados
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Ejecuta el script de seed del Sprint 1 para crear los planes iniciales.
          </p>
        </section>
      )}
    </div>
  );
}