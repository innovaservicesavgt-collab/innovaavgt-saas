'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ArrowRight,
  Phone,
  Mail,
  AlertCircle,
  CalendarCheck,
  Calendar,
  X,
  Filter,
  ShieldPlus,
} from 'lucide-react';
import type { PatientRow } from '@/app/(dental)/dental/patients/page';

type Filter = 'all' | 'active' | 'alerts' | 'upcoming' | 'no-visits';

type Props = {
  patients: PatientRow[];
};

export function PatientsClient({ patients }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return patients.filter((p) => {
      // Filtro de texto
      if (q) {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const phone = (p.phone || '').toLowerCase();
        const email = (p.email || '').toLowerCase();
        if (!fullName.includes(q) && !phone.includes(q) && !email.includes(q)) {
          return false;
        }
      }

      // Filtro categórico
      switch (filter) {
        case 'active':
          return p.is_active !== false;
        case 'alerts':
          return Boolean(
            (p.allergies && p.allergies.trim().length > 0) ||
            (p.medical_notes && p.medical_notes.trim().length > 0)
          );
        case 'upcoming':
          return p.next_appointment_date !== null;
        case 'no-visits':
          return p.last_visit_date === null;
        default:
          return true;
      }
    });
  }, [patients, query, filter]);

  const hasActiveFilters = filter !== 'all' || query.length > 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header de búsqueda y filtros */}
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-10 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtros tipo chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="h-3.5 w-3.5" />
              Filtrar:
            </span>
            <FilterChip label="Todos" count={patients.length} active={filter === 'all'} onClick={() => setFilter('all')} />
            <FilterChip
              label="Activos"
              count={patients.filter((p) => p.is_active !== false).length}
              active={filter === 'active'}
              onClick={() => setFilter('active')}
            />
            <FilterChip
              label="Con alertas"
              count={patients.filter((p) => (p.allergies && p.allergies.trim().length > 0) || (p.medical_notes && p.medical_notes.trim().length > 0)).length}
              active={filter === 'alerts'}
              onClick={() => setFilter('alerts')}
              variant="amber"
            />
            <FilterChip
              label="Con cita próxima"
              count={patients.filter((p) => p.next_appointment_date !== null).length}
              active={filter === 'upcoming'}
              onClick={() => setFilter('upcoming')}
              variant="emerald"
            />
            <FilterChip
              label="Sin visitas"
              count={patients.filter((p) => p.last_visit_date === null).length}
              active={filter === 'no-visits'}
              onClick={() => setFilter('no-visits')}
              variant="slate"
            />

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setFilter('all');
                  setQuery('');
                }}
                className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                <X className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido */}
      {filtered.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} totalPatients={patients.length} />
      ) : (
        <>
          {/* Vista mobile: cards apiladas */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {filtered.map((p) => (
              <PatientCardMobile key={p.id} patient={p} />
            ))}
          </div>

          {/* Vista desktop: tabla */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Paciente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Edad</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Última visita</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Próxima cita</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <PatientRowDesktop key={p.id} patient={p} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-6 py-3 text-xs text-slate-500">
            Mostrando {filtered.length} de {patients.length} pacientes
          </div>
        </>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────
function FilterChip({
  label,
  count,
  active,
  onClick,
  variant = 'default',
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  variant?: 'default' | 'amber' | 'emerald' | 'slate';
}) {
  const activeClasses = {
    default: 'bg-slate-900 text-white',
    amber: 'bg-amber-500 text-white',
    emerald: 'bg-emerald-600 text-white',
    slate: 'bg-slate-600 text-white',
  }[variant];

  const inactiveClasses = 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50';

  const counterActive = 'bg-white/25 text-white';
  const counterInactive = 'bg-slate-100 text-slate-600';

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active ? activeClasses : inactiveClasses
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          active ? counterActive : counterInactive
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function calculateAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} años`;
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff > 0 && diff < 7) return `Hace ${diff} días`;
  if (diff > 0 && diff < 30) return `Hace ${Math.floor(diff / 7)} sem.`;
  if (diff > 0 && diff < 365) return `Hace ${Math.floor(diff / 30)} meses`;
  if (diff > 0) return `Hace ${Math.floor(diff / 365)} años`;
  // Futuro
  if (diff === -1) return 'Mañana';
  if (diff > -7) return `En ${Math.abs(diff)} días`;
  if (diff > -30) return `En ${Math.floor(Math.abs(diff) / 7)} sem.`;
  return d.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' });
}

function hasAlerts(p: PatientRow): boolean {
  return Boolean(
    (p.allergies && p.allergies.trim().length > 0) ||
    (p.medical_notes && p.medical_notes.trim().length > 0)
  );
}

function PatientRowDesktop({ patient: p }: { patient: PatientRow }) {
  const age = calculateAge(p.date_of_birth);
  const alerts = hasAlerts(p);

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-3 align-middle">
        <Link href={`/dental/patients/${p.id}`} className="flex items-center gap-3 min-w-0">
          {p.photo_url ? (
            <img
              src={p.photo_url}
              alt={`${p.first_name} ${p.last_name}`}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
              {getInitials(p.first_name, p.last_name)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">
                {p.first_name} {p.last_name}
              </p>
              {alerts && (
                <span title={p.allergies || p.medical_notes || ''} className="shrink-0">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs">
              {p.is_active === false ? (
                <span className="text-rose-600 font-medium">Inactivo</span>
              ) : (
                <span className="text-emerald-600 font-medium">Activo</span>
              )}
              {p.insurance_provider && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 truncate flex items-center gap-1">
                    <ShieldPlus className="h-3 w-3" />
                    {p.insurance_provider}
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-6 py-3 align-middle">
        <div className="space-y-0.5 text-xs">
          {p.phone && (
            <div className="flex items-center gap-1.5 text-slate-700">
              <Phone className="h-3 w-3 text-slate-400" />
              <span className="truncate">{p.phone}</span>
            </div>
          )}
          {p.email && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Mail className="h-3 w-3 text-slate-400" />
              <span className="truncate max-w-[160px]">{p.email}</span>
            </div>
          )}
          {!p.phone && !p.email && (
            <span className="text-slate-400 italic">Sin contacto</span>
          )}
        </div>
      </td>
      <td className="px-6 py-3 align-middle text-sm text-slate-700">
        {age || <span className="text-slate-400 italic">—</span>}
      </td>
      <td className="px-6 py-3 align-middle text-sm">
        {p.last_visit_date ? (
          <span className="text-slate-700">{formatRelativeDate(p.last_visit_date)}</span>
        ) : (
          <span className="text-slate-400 italic">Sin visitas</span>
        )}
      </td>
      <td className="px-6 py-3 align-middle text-sm">
        {p.next_appointment_date ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
            <CalendarCheck className="h-3 w-3" />
            {formatRelativeDate(p.next_appointment_date)}
          </span>
        ) : (
          <span className="text-slate-400 italic text-xs">Sin agendar</span>
        )}
      </td>
      <td className="px-6 py-3 align-middle text-right">
        <Link
          href={`/dental/patients/${p.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Ver
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </td>
    </tr>
  );
}

function PatientCardMobile({ patient: p }: { patient: PatientRow }) {
  const age = calculateAge(p.date_of_birth);
  const alerts = hasAlerts(p);

  return (
    <Link
      href={`/dental/patients/${p.id}`}
      className="block px-4 py-4 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {p.photo_url ? (
          <img
            src={p.photo_url}
            alt={`${p.first_name} ${p.last_name}`}
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
            {getInitials(p.first_name, p.last_name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">
              {p.first_name} {p.last_name}
            </p>
            {alerts && <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            {age && <span className="text-slate-600">{age}</span>}
            {p.phone && (
              <>
                {age && <span className="text-slate-300">·</span>}
                <span className="text-slate-600 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {p.phone}
                </span>
              </>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {p.next_appointment_date ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                <CalendarCheck className="h-3 w-3" />
                {formatRelativeDate(p.next_appointment_date)}
              </span>
            ) : p.last_visit_date ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                <Calendar className="h-3 w-3" />
                Última: {formatRelativeDate(p.last_visit_date)}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Sin visitas</span>
            )}
          </div>
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 mt-1" />
      </div>
    </Link>
  );
}

function EmptyState({ hasFilters, totalPatients }: { hasFilters: boolean; totalPatients: number }) {
  if (hasFilters) {
    return (
      <div className="px-6 py-16 text-center">
        <Search className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">Sin resultados</p>
        <p className="mt-1 text-xs text-slate-500">
          Ningún paciente coincide con tus filtros actuales
        </p>
      </div>
    );
  }

  if (totalPatients === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <ShieldPlus className="h-7 w-7 text-emerald-600" />
        </div>
        <p className="mt-4 text-base font-bold text-slate-900">
          Aún no hay pacientes
        </p>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          Empieza agregando el primer paciente a tu clínica para gestionar citas, expedientes y tratamientos.
        </p>
        <Link
          href="/dental/patients/new"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <ShieldPlus className="h-4 w-4" />
          Crear primer paciente
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-slate-500">No hay pacientes en esta vista</p>
    </div>
  );
}