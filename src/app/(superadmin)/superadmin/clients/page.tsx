import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  Building2,
  Plus,
  Search,
  Users,
  Clock3,
  Eye,
  Pencil,
  Wallet,
  CircleAlert,
} from 'lucide-react';

type Tenant = {
  id: string;
  name: string;
  slug: string | null;
  subdomain: string | null;
  email: string | null;
  tenant_status: string | null;
  payment_status: string | null;
  monthly_fee: number | null;
  created_at?: string | null;
};

type PageProps = {
  searchParams?: {
    q?: string;
    status?: string;
    payment?: string;
  };
};

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
      created_at
    `
    )
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Tenant[];
}

function paymentText(value: string | null) {
  switch (value) {
    case 'current':
      return 'Al día';
    case 'pending':
      return 'Pendiente';
    case 'overdue':
      return 'Vencido';
    case 'grace':
      return 'En gracia';
    case 'suspended':
      return 'Suspendido';
    default:
      return 'Sin definir';
  }
}

function paymentBadge(value: string | null) {
  switch (value) {
    case 'current':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'pending':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'overdue':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'grace':
      return 'bg-sky-100 text-sky-700 border border-sky-200';
    case 'suspended':
      return 'bg-slate-200 text-slate-700 border border-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function statusText(value: string | null) {
  switch (value) {
    case 'active':
      return 'Activa';
    case 'trial':
      return 'En prueba';
    case 'suspended':
      return 'Suspendida';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Sin definir';
  }
}

function statusBadge(value: string | null) {
  switch (value) {
    case 'active':
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'trial':
      return 'bg-violet-100 text-violet-700 border border-violet-200';
    case 'suspended':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'cancelled':
      return 'bg-slate-200 text-slate-700 border border-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function getSubdomain(client: Tenant) {
  if (client.subdomain) return client.subdomain;
  if (client.slug) return `${client.slug}.innovaservicesav.com`;
  return 'Sin subdominio';
}

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
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
          {icon}
        </div>
      </div>
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

      <div
        className="relative h-40 w-40 rounded-full"
        style={{ background }}
      >
        <div className="absolute inset-[18px] flex items-center justify-center rounded-full bg-white shadow-inner">
          <span className="text-lg font-semibold text-slate-500">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

export default async function SuperadminClientsPage({ searchParams }: PageProps) {
  const q = (searchParams?.q || '').trim().toLowerCase();
  const status = (searchParams?.status || '').trim().toLowerCase();
  const payment = (searchParams?.payment || '').trim().toLowerCase();

  const allClients = await getClients();

  const clients = allClients.filter((client) => {
    const matchesQ =
      !q ||
      (client.name || '').toLowerCase().includes(q) ||
      (client.email || '').toLowerCase().includes(q) ||
      (client.slug || '').toLowerCase().includes(q) ||
      (client.subdomain || '').toLowerCase().includes(q);

    const matchesStatus = !status || (client.tenant_status || '') === status;
    const matchesPayment = !payment || (client.payment_status || '') === payment;

    return matchesQ && matchesStatus && matchesPayment;
  });

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

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-500">
        Inicio <span className="mx-2">›</span>
        <span className="font-medium text-slate-700">Clientes</span>
      </div>

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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
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
      </section>

      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                Listado de clientes
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Consulta rápidamente estado, pago, subdominio y acciones.
              </p>
            </div>

            <form method="GET" className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Empresa
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Subdominio
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Pago
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Mensualidad
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    No se encontraron clientes.
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
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
                          {client.name?.charAt(0)?.toUpperCase() || 'C'}
                        </div>

                        <div>
                          <div className="text-base font-semibold text-slate-900">
                            {client.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {client.email || 'Sin correo'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 align-middle text-sm text-slate-700">
                      <div className="max-w-[240px] break-words">
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
            Mostrando clientes del 1 al {clients.length} de un total de {clients.length}
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
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-900">
                      {client.name}
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