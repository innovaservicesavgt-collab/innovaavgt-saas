
import Link from 'next/link';
import { BarChart3, Building2, CreditCard, Settings } from 'lucide-react';

function Card({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </Link>
  );
}

export default function SuperadminHomePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-4xl font-bold tracking-tight text-slate-900">
          Dashboard Superadmin
        </h2>
        <p className="mt-2 text-base text-slate-500">
          Administra clientes, pagos, reportes y configuración general del SaaS.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Clientes"
          description="Crear, editar y revisar empresas registradas."
          href="/superadmin/clients"
          icon={<Building2 className="h-6 w-6" />}
        />
        <Card
          title="Pagos"
          description="Control de cobros, mensualidades y vencimientos."
          href="/superadmin/payments"
          icon={<CreditCard className="h-6 w-6" />}
        />
        <Card
          title="Reportes"
          description="Resumen general del estado comercial del sistema."
          href="/superadmin/reports"
          icon={<BarChart3 className="h-6 w-6" />}
        />
        <Card
          title="Configuración"
          description="Parámetros globales del panel administrativo."
          href="/superadmin/settings"
          icon={<Settings className="h-6 w-6" />}
        />
      </section>
    </div>
  );
}