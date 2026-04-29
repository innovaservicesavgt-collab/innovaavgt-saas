import Link from 'next/link';
import { Plus, Briefcase, CheckCircle2, DollarSign, FolderTree } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { ServicesClient } from '@/components/services/services-client';
import type { Service } from '@/lib/types/service';

export default async function ServicesPage() {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const supabase = await createServerSupabase();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', profile.tenant.id)
    .order('name', { ascending: true });

  const list = (services || []) as unknown as Service[];

  // KPIs
  const total = list.length;
  const active = list.filter((s) => s.is_active).length;
  const avgPrice = list.length > 0
    ? list.reduce((sum, s) => sum + Number(s.price || 0), 0) / list.length
    : 0;
  const categories = new Set(list.map((s) => s.category).filter(Boolean)).size;

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Servicios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Catalogo de tratamientos y servicios de la clinica
          </p>
        </div>
        <Link
          href="/dental/services/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nuevo servicio
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Total servicios"
          value={total.toString()}
          icon={<Briefcase className="h-4 w-4" />}
          color="blue"
        />
        <Kpi
          label="Activos"
          value={active.toString()}
          sub={total > 0 ? Math.round((active / total) * 100) + '% del total' : ''}
          icon={<CheckCircle2 className="h-4 w-4" />}
          color="emerald"
        />
        <Kpi
          label="Precio promedio"
          value={'Q' + avgPrice.toLocaleString('es-GT', { maximumFractionDigits: 0 })}
          sub="Por servicio"
          icon={<DollarSign className="h-4 w-4" />}
          color="violet"
        />
        <Kpi
          label="Categorias"
          value={categories.toString()}
          sub="En uso"
          icon={<FolderTree className="h-4 w-4" />}
          color="amber"
        />
      </div>

      <ServicesClient services={list} />
    </div>
  );
}

function Kpi({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: 'blue' | 'emerald' | 'amber' | 'violet'; }) {
  const cls = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  }[color];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={'flex h-7 w-7 items-center justify-center rounded-lg ring-1 ' + cls}>
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-500">{sub}</div>}
    </div>
  );
}
