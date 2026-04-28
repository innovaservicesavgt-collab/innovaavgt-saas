'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Edit,
  ToggleRight,
  ToggleLeft,
  Clock,
  DollarSign,
  Tag,
  Inbox,
  CircleAlert,
} from 'lucide-react';
import {
  DENTAL_CATEGORIES,
  getCategoryLabel,
  getCategoryColor,
  type Service,
} from '@/lib/types/service';
import { toggleServiceActive } from '@/server/actions/services';

type Props = {
  services: Service[];
};

type ActiveFilter = 'all' | 'active' | 'inactive';

export function ServicesClient({ services }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (activeFilter === 'active' && s.is_active === false) return false;
      if (activeFilter === 'inactive' && s.is_active !== false) return false;
      if (category !== 'all' && s.category !== category) return false;
      if (!q) return true;
      const haystack = [
        s.name || '',
        s.description || '',
        getCategoryLabel(s.category),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [services, search, category, activeFilter]);

  const handleToggle = (s: Service) => {
    startTransition(async () => {
      const res = await toggleServiceActive({
        id: s.id,
        is_active: s.is_active === false,
      });
      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }
      toast.success(
        s.is_active === false ? 'Servicio activado' : 'Servicio desactivado'
      );
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-2">
          {/* Buscador */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {/* Categoría */}
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Todas las categorías</option>
              {DENTAL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="all">Todos</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <Filter className="h-3 w-3" />
          {filtered.length} de {services.length} servicios
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <EmptyState hasFilters={search.length > 0 || category !== 'all' || activeFilter !== 'all'} />
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <ServiceRow
              key={s.id}
              service={s}
              onToggle={() => handleToggle(s)}
              disabled={isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceRow({
  service,
  onToggle,
  disabled,
}: {
  service: Service;
  onToggle: () => void;
  disabled: boolean;
}) {
  const isActive = service.is_active !== false;
  const catLabel = getCategoryLabel(service.category);
  const catColor = getCategoryColor(service.category);

  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        {/* Indicador de color */}
        <div
          className="h-10 w-10 rounded-xl flex-shrink-0 hidden sm:flex items-center justify-center"
          style={{ backgroundColor: (service.color || '#10B981') + '20' }}
        >
          <Tag className="h-5 w-5" style={{ color: service.color || '#10B981' }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-900 truncate">{service.name}</h3>
            {!isActive && (
              <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                Inactivo
              </span>
            )}
            {service.requires_confirmation && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                Requiere confirmación
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {service.category && (
              <span
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5"
                style={{ backgroundColor: catColor + '20', color: catColor }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                {catLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {service.duration_minutes} min
              {service.buffer_minutes && service.buffer_minutes > 0
                ? ` (+${service.buffer_minutes} buffer)`
                : ''}
            </span>
          </div>

          {service.description && (
            <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">
              {service.description}
            </p>
          )}
        </div>

        {/* Precio */}
        <div className="flex sm:flex-col sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 shrink-0">
          <div className="flex items-baseline gap-0.5">
            <DollarSign className="h-3 w-3 text-slate-400" />
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {service.price
                ? `Q${Number(service.price).toLocaleString('es-GT', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : '—'}
            </span>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-1">
            <Link
              href={`/dental/services/${service.id}/edit`}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={onToggle}
              disabled={disabled}
              className={`rounded-lg p-1.5 transition disabled:opacity-50 ${
                isActive
                  ? 'text-emerald-600 hover:bg-emerald-50'
                  : 'text-slate-400 hover:bg-slate-100'
              }`}
              title={isActive ? 'Desactivar' : 'Activar'}
            >
              {isActive ? (
                <ToggleRight className="h-5 w-5" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      {hasFilters ? (
        <>
          <CircleAlert className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-900">
            Sin coincidencias
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Prueba cambiando los filtros o el término de búsqueda
          </p>
        </>
      ) : (
        <>
          <Inbox className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-900">
            Aún no tienes servicios
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Crea tu catálogo de tratamientos. Se usan en citas y cotizaciones.
          </p>
          <Link
            href="/dental/services/new"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Crear primer servicio
          </Link>
        </>
      )}
    </div>
  );
}