import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import type { VerticalCode } from '@/lib/verticals';
import {
  Building2,
  Search,
  Users,
  Clock3,
  Eye,
  Pencil,
  Wallet,
  CircleAlert,
  TrendingUp,
  X,
  Scale,
  Stethoscope,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────
type TenantPlan = {
  id: string;
  code: string;
  name: string;
  monthly_price: number;
};

type Tenant = {
  id: string;
  name: string;
  slug: string | null;
  subdomain: string | null;
  email: string | null;
  tenant_status: string | null;
  payment_status: string | null;
  monthly_fee: number | null;
  vertical: VerticalCode | null;
  brand_name: string | null;
  plan: TenantPlan | null;
  created_at?: string | null;
};

// ⚠️ IMPORTANTE (Next.js 15/16): searchParams es Promise, se debe awaitear.
type PageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    payment?: string;
    vertical?: string;
  }>;
};

// ─────────────────────────────────────────────────────────────────
// Data fetching
// ─────────────────────────────────────────────────────────────────
async function getClients(): Promise<Tenant[]> {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select(
      `
      id,
      name,
      slug,
      subdomain,
      email,
      tenant_status,
      payment_status,
      monthly_fee,
      vertical,
      brand_name,
      plan:plans ( id, code, name, monthly_price ),
      created_at
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[superadmin/clients] Error:', error);
    return [];
  }
  if (!data) return [];

  return data as unknown as Tenant[];
}

// ─────────────────────────────────────────────────────────────────
// Helpers de presentación
// ─────────────────────────────────────────────────────────────────
function paymentText(value: string | null) {
  switch (value) {
    case 'current': return 'Al día';
    case 'pending': return 'Pendiente';
    case 'overdue': return 'Vencido';
    case 'grace': return 'En gracia';
    case 'suspended': return 'Suspendido';
    default: return 'Sin definir';
  }
}

function paymentBadge(value: string | null) {
  switch (value) {
    case 'current': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'overdue': return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'grace': return 'bg-sky-100 text-sky-700 border border-sky-200';
    case 'suspended': return 'bg-slate-200 text-slate-700 border border-slate-300';
    default: return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
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
    case 'active': return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'trial': return 'bg-violet-100 text-violet-700 border border-violet-200';
    case 'suspended': return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'cancelled': return 'bg-slate-200 text-slate-700 border border-slate-300';
    default: return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function getSubdomain(client: Tenant) {
  if (client.subdomain) return client.subdomain;
  if (client.slug) return `${client.slug}.innovaservicesav.com`;
  return 'Sin subdominio';
}

// Construye el href de una tab de vertical preservando los otros filtros
function buildVerticalHref(
  target: 'all' | VerticalCode,
  params: { q: string; status: string; payment: string }
) {
  const query: Record<string, string> = {};
  if (target !== 'all') query.vertical = target;
  if (params.q) query.q = params.q;
  if (params.status) query.status = params.status;
  if (params.payment) query.payment = params.payment;
  return { pathname: '/superadmin/clients', query };
}

// ─────────────────────────────────────────────────────────────────
// Componentes locales
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

function VerticalTabs({
  vertical,
  totalClients,
  legalCount,
  dentalCount,
  currentParams,
}: {
  vertical: string;
  totalClients: number;
  legalCount: number;
  dentalCount: number;
  currentParams: { q: string; status: string; payment: string };
}) {
  const isAll = vertical === '';
  const isLegal = vertical === 'legal';
  const isDental = vertical === 'dental';

  // Estilos base iguales; los colores cambian por vertical
  const baseTab =
    'inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-base font-semibold transition-all duration-150';

  const tabAll = isAll
    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60';

  const tabLegal = isLegal
    ? 'bg-blue-600 text-white shadow-sm'
    : 'text-slate-600 hover:text-blue-700 hover:bg-white/60';

  const tabDental = isDental
    ? 'bg-emerald-600 text-white shadow-sm'
    : 'text-slate-600 hover:text-emerald-700 hover:bg-white/60';

  const counterAll = isAll
    ? 'bg-slate-100 text-slate-700'
    : 'bg-slate-200/80 text-slate-600';
  const counterLegal = isLegal
    ? 'bg-white/25 text-white'
    : 'bg-blue-50 text-blue-700';
  const counterDental = isDental
    ? 'bg-white/25 text-white'
    : 'bg-emerald-50 text-emerald-700';

  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
      <Link
        href={buildVerticalHref('all', currentParams)}
        className={`${baseTab} ${tabAll}`}
      >
        <Users className="h-5 w-5" />
        <span>Todos</span>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${counterAll}`}>
          {totalClients}
        </span>
      </Link>

      <Link
        href={buildVerticalHref('legal', currentParams)}
        className={`${baseTab} ${tabLegal}`}
      >
        <Scale className="h-5 w-5" />
        <span>Legal</span>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${counterLegal}`}>
          {legalCount}
        </span>
      </Link>

      <Link
        href={buildVerticalHref('dental', currentParams)}
        className={`${baseTab} ${tabDental}`}
      >
        <Stethoscope className="h-5 w-5" />
        <span>Dental</span>
        <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${counterDental}`}>
          {dentalCount}
        </span>
      </Link>
    </div>
  );
}

function DonutChart({
  active,
  trial,
  suspended,
}: {
  active: number;
  trial: number;
  suspended: number;
}) {
  const total = active + trial + suspended;
  const safeTotal = total === 0 ? 1 : total;

  const a = (active / safeTotal) * 360;
  const t = (trial / safeTotal) * 360;
  const s = (suspended / safeTotal) * 360;

  const activeEnd = a;
  const trialEnd = a + t;
  const percent = Math.round((active / safeTotal) * 100);

  const background = `conic-gradient(
    #2563eb 0deg ${activeEnd}deg,
    #7c3aed ${activeEnd}deg ${trialEnd}deg,
    #ef4444 ${trialEnd}deg ${trialEnd + s}deg,
    #e5e7eb ${trialEnd + s}deg 360deg
  )`;

  return (
    <div className="flex h-full flex-col justify-center gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span className="h-3 w-3 rounded-full bg-blue-600" />
          <span className="min-w-[96px]">Activos</span>
          <span className="font-semibold">{active}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span className="h-3 w-3 rounded-full bg-violet-600" />
          <span className="min-w-[96px]">En prueba</span>
          <span className="font-semibold">{trial}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span className="h-3 w-3 rounded-full bg-rose-500" />
          <span className="min-w-[96px]">Suspendidos</span>
          <span className="font-semibold">{suspended}</span>
        </div>
      </div>

      <div className="relative h-40 w-40 rounded-full" style={{ background }}>
        <div className="absolute inset-[18px] flex items-center justify-center rounded-full bg-white shadow-inner">
          <span className="text-lg font-semibold text-slate-500">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PÁGINA
// ─────────────────────────────────────────────────────────────────
export default async function SuperadminClientsPage({ searchParams }: PageProps) {
  // ⚠️ CRÍTICO: awaitear searchParams (Next.js 15/16)
  const params = (await searchParams) ?? {};

  const q = (params.q || '').trim().toLowerCase();
  const status = (params.status || '').trim().toLowerCase();
  const payment = (params.payment || '').trim().toLowerCase();
  const vertical = (params.vertical || '').trim().toLowerCase();

  const hasActiveFilters = Boolean(q || status || payment || vertical);

  const allClients = await getClients();

  // Filtros
  const clients = allClients.filter((client) => {
    const matchesQ =
      !q ||
      (client.name || '').toLowerCase().includes(q) ||
      (client.email || '').toLowerCase().includes(q) ||
      (client.slug || '').toLowerCase().includes(q) ||
      (client.subdomain || '').toLowerCase().includes(q);

    const matchesStatus = !status || (client.tenant_status || '') === status;
    const matchesPayment = !payment || (client.payment_status || '') === payment;
    const matchesVertical = !vertical || (client.vertical || '') === vertical;

    return matchesQ && matchesStatus && matchesPayment && matchesVertical;
  });

  // KPIs (sobre el total, no sobre el filtro)
  const totalClients = allClients.length;
  const activeClients = allClients.filter((c) => c.tenant_status === 'active').length;
  const overdueClients = allClients.filter(
    (c) => c.payment_status === 'pending' || c.payment_status === 'overdue'
  ).length;
  const trialClients = allClients.filter((c) => c.tenant_status === 'trial').length;
  const suspendedClients = allClients.filter((c) => c.tenant_status === 'suspended').length;

  const expectedIncome = allClients.reduce(
    (sum, c) => sum + Number(c.monthly_fee || 0),
    0
  );

  const mrrActive = allClients
    .filter((c) => c.tenant_status === 'active')
    .reduce((sum, c) => sum + Number(c.monthly_fee || 0), 0);

  // Contadores por vertical
  const legalCount = allClients.filter((c) => c.vertical === 'legal').length;
  const dentalCount = allClients.filter((c) => c.vertical === 'dental').length;

  const currentParams = { q, status, payment };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500">
        Inicio <span className="mx-2">›</span>
        <span className="font-medium text-slate-700">Clientes</span>
      </div>

      {/* Header */}
      <section className="rounded-[32px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-5xl font-bold tracking-tight text-slate-900">
              Clientes
            </h2>
            <p className="mt-3 max-w-3xl text-lg text-slate-500">
              Administra empresas, subdominios, pagos y configuración del SaaS.
            </p>
          </div>

          <Link
            href="/superadmin/clients/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 text-lg font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Building2 className="h-5 w-5" />
            Nuevo Cliente
          </Link>
        </div>
      </section>

      {/* KPIs — 6 cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total de clientes"
          value={totalClients}
          icon={<Building2 className="h-6 w-6 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Clientes activos"
          value={activeClients}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Pagos pendientes"
          value={overdueClients}
          icon={<CircleAlert className="h-6 w-6 text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <StatCard
          title="En prueba"
          value={trialClients}
          icon={<Clock3 className="h-6 w-6 text-violet-600" />}
          iconBg="bg-violet-50"
        />
        <StatCard
          title="Ingreso esperado"
          value={`Q${expectedIncome.toFixed(2)}`}
          icon={<Wallet className="h-6 w-6 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="MRR activo"
          value={`Q${mrrActive.toFixed(2)}`}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          iconBg="bg-green-50"
        />
      </section>

      {/* Tabs por vertical */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <VerticalTabs
          vertical={vertical}
          totalClients={totalClients}
          legalCount={legalCount}
          dentalCount={dentalCount}
          currentParams={currentParams}
        />

        {hasActiveFilters && (
          <Link
            href="/superadmin/clients"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:self-auto"
          >
            <X className="h-4 w-4" />
            Limpiar filtros
          </Link>
        )}
      </section>

      {/* Tabla */}
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Listado de clientes
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Consulta vertical, estado, plan, pago y acciones rápidas.
              </p>
            </div>

            {/*
              action explícito + method GET → al enviar, Next.js re-renderiza
              la misma página con los query params. No se necesita JS.
            */}
            <form
              method="GET"
              action="/superadmin/clients"
              className="grid grid-cols-1 gap-3 md:grid-cols-4 xl:min-w-[680px]"
            >
              {/* Preserva el vertical activo al hacer búsqueda */}
              {vertical && (
                <input type="hidden" name="vertical" value={vertical} />
              )}

              <div className="relative md:col-span-2">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="q"
                  defaultValue={q}
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Buscar empresa..."
                />
              </div>

              <select
                name="status"
                defaultValue={status}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activa</option>
                <option value="trial">En prueba</option>
                <option value="suspended">Suspendida</option>
                <option value="cancelled">Cancelada</option>
              </select>

              <div className="flex gap-2">
                <select
                  name="payment"
                  defaultValue={payment}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Todos los pagos</option>
                  <option value="current">Al día</option>
                  <option value="pending">Pendiente</option>
                  <option value="overdue">Vencido</option>
                  <option value="grace">En gracia</option>
                  <option value="suspended">Suspendido</option>
                </select>

                <button
                  type="submit"
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Empresa</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Vertical</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Plan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Subdominio</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Pago</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Mensualidad</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No se encontraron clientes con los filtros aplicados.
                    {hasActiveFilters && (
                      <>
                        {' '}
                        <Link
                          href="/superadmin/clients"
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          Limpiar filtros
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                          {client.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-base font-semibold text-slate-900">
                            {client.name}
                          </div>
                          <div className="truncate text-sm text-slate-500">
                            {client.email || 'Sin correo'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 align-middle">
                      <VerticalBadge
                        vertical={client.vertical}
                        variant="compact"
                      />
                    </td>

                    <td className="px-6 py-5 align-middle">
                      {client.plan ? (
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {client.plan.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {client.plan.code}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">— Sin plan</span>
                      )}
                    </td>

                    <td className="px-6 py-5 align-middle text-sm text-slate-700">
                      <div className="max-w-[220px] break-words">
                        {getSubdomain(client)}
                      </div>
                    </td>

                    <td className="px-6 py-5 align-middle">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusBadge(
                          client.tenant_status
                        )}`}
                      >
                        {statusText(client.tenant_status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 align-middle">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${paymentBadge(
                          client.payment_status
                        )}`}
                      >
                        {paymentText(client.payment_status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 align-middle text-base font-semibold text-slate-900">
                      Q{Number(client.monthly_fee || 0).toFixed(2)}
                    </td>

                    <td className="px-6 py-5 align-middle">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/superadmin/clients/${client.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          <Eye className="h-4 w-4" />
                          Detalle
                        </Link>

                        <Link
                          href={`/superadmin/clients/${client.id}/edit`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
                        >
                          <Pencil className="h-4 w-4" />
                          Modificar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            Mostrando {clients.length} de {totalClients} clientes
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-3 py-2 text-slate-600"
            >
              ‹
            </button>
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-3 py-2 text-white"
            >
              1
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-3 py-2 text-slate-600"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* Últimos clientes + Donut */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-2xl font-bold text-slate-900">Últimos clientes</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {allClients.length === 0 ? (
              <div className="px-6 py-6 text-sm text-slate-500">
                No hay registros recientes.
              </div>
            ) : (
              allClients.slice(0, 5).map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-slate-900">
                        {client.name}
                      </span>
                      <VerticalBadge
                        vertical={client.vertical}
                        variant="dot"
                      />
                    </div>
                    <div className="truncate text-sm text-slate-500">
                      {getSubdomain(client)}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                      client.tenant_status
                    )}`}
                  >
                    {statusText(client.tenant_status)}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h3 className="text-2xl font-bold text-slate-900">
              Clientes por estado
            </h3>
          </div>

          <div className="flex h-full items-center p-6">
            <DonutChart
              active={activeClients}
              trial={trialClients}
              suspended={suspendedClients}
            />
          </div>
        </section>
      </section>
    </div>
  );
}
