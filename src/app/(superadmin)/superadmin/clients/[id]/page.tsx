import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  User,
  Globe,
  Pencil,
  CalendarDays,
  Wallet,
} from 'lucide-react';

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getClient(id: string) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
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

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold text-slate-900">
        {value || 'Sin definir'}
      </div>
    </div>
  );
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-500">
        Inicio <span className="mx-2">›</span>
        Clientes <span className="mx-2">›</span>
        <span className="font-medium text-slate-700">{client.name}</span>
      </div>

      <section className="rounded-[32px] border border-slate-200 bg-white px-8 py-8 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Detalle del cliente</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
              {client.name}
              {client.logo_url ? (
  <div className="mt-4">
    <img
      src={client.logo_url}
      alt={client.name}
      className="h-20 w-auto rounded-2xl border border-slate-200 bg-white p-2 object-contain"
    />
  </div>
) : null}
            </h1>
            <p className="mt-3 text-lg text-slate-500">
              Revisión general de la empresa, estado, pago y configuración.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/superadmin/clients"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            <Link
              href={`/superadmin/clients/${client.id}/billing`}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Facturación
            </Link>
            <Link
              href={`/superadmin/clients/${client.id}/edit`}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Pencil className="h-4 w-4" />
              Modificar
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Información general</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem icon={<Building2 className="h-4 w-4" />} label="Nombre" value={client.name} />
              <InfoItem icon={<Mail className="h-4 w-4" />} label="Correo" value={client.email} />
              <InfoItem icon={<Phone className="h-4 w-4" />} label="Teléfono" value={client.phone} />
              <InfoItem icon={<User className="h-4 w-4" />} label="Representante" value={client.representative_name} />
              <InfoItem icon={<Globe className="h-4 w-4" />} label="Slug" value={client.slug} />
              <InfoItem
                icon={<Globe className="h-4 w-4" />}
                label="Subdominio"
                value={client.subdomain || `${client.slug}.innovaservicesav.com`}
              />
            </div>
          </section>
<section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
  <h2 className="text-2xl font-bold text-slate-900">Administrador principal</h2>
  <div className="mt-6 grid grid-cols-1 gap-4">
    <InfoItem icon={<User className="h-4 w-4" />} label="Nombre" value={client.admin_name} />
    <InfoItem icon={<Mail className="h-4 w-4" />} label="Correo" value={client.admin_email} />
    <InfoItem icon={<User className="h-4 w-4" />} label="Rol" value={client.admin_role} />
  </div>
</section>
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Ubicación y notas</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem icon={<Globe className="h-4 w-4" />} label="País" value={client.country} />
              <InfoItem icon={<Globe className="h-4 w-4" />} label="Ciudad" value={client.city} />
              <InfoItem icon={<Globe className="h-4 w-4" />} label="Código postal" value={client.postal_code} />
              <InfoItem icon={<Building2 className="h-4 w-4" />} label="Dirección" value={client.address} />
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2 text-sm font-medium text-slate-500">Notas internas</div>
              <div className="text-slate-900">{client.notes || 'Sin notas'}</div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Estado comercial</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-sm font-medium text-slate-500">Estado</div>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusBadge(client.tenant_status)}`}>
                  {statusText(client.tenant_status)}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-sm font-medium text-slate-500">Pago</div>
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${paymentBadge(client.payment_status)}`}>
                  {paymentText(client.payment_status)}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 text-sm font-medium text-slate-500">Mensualidad</div>
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-blue-100 px-3 py-2 text-sm font-semibold text-blue-700">
                    {client.currency || 'GTQ'}
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {Number(client.monthly_fee || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <CalendarDays className="h-4 w-4" />
                  Próximo cobro
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {client.next_due_date || 'Sin definir'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <Wallet className="h-4 w-4" />
                  Moneda
                </div>
                <div className="text-base font-semibold text-slate-900">
                  {client.currency || 'GTQ'}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}