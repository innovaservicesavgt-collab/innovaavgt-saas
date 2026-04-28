'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  CalendarClock,
  Users,
  UserCog,
  Briefcase,
  FileText,
  ClipboardList,
  Activity,
  Receipt,
  Wallet,
  Package,
  Building2,
  FlaskConical,
  TrendingUp,
  Settings,
  LogOut,
  Stethoscope,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /**
   * Feature flag requerida del plan. Si está definida y el plan
   * NO la tiene activa, el ítem NO se muestra.
   * Si es undefined, el ítem siempre se muestra.
   */
  feature?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// Estructura del menú dental — agrupado por área funcional
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'General',
    items: [
      { href: '/dental/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dental/calendar', label: 'Calendario', icon: Calendar },
      { href: '/dental/appointments', label: 'Citas', icon: CalendarClock, feature: 'appointments' },
    ],
  },
  {
    label: 'Pacientes',
    items: [
      { href: '/dental/patients', label: 'Pacientes', icon: Users, feature: 'patients' },
    ],
  },
  {
    label: 'Equipo y servicios',
    items: [
      { href: '/dental/professionals', label: 'Profesionales', icon: UserCog, feature: 'professionals' },
      { href: '/dental/services', label: 'Servicios', icon: Briefcase, feature: 'services' },
    ],
  },
  {
    label: 'Tratamientos y pagos',
    items: [
      { href: '/dental/quotations', label: 'Cotizaciones', icon: FileText },
      { href: '/dental/treatments', label: 'Tratamientos', icon: Activity, feature: 'treatment_plans' },
      { href: '/dental/payments', label: 'Pagos', icon: Wallet, feature: 'payments' },
  { href: '/dental/dashboard/cobranza', label: 'Cobranza', icon: TrendingUp },
    ],
  },
  {
    label: 'Operación',
    items: [
      { href: '/dental/cash', label: 'Caja', icon: Receipt, feature: 'cash_register' },
      { href: '/dental/inventory', label: 'Inventario', icon: Package, feature: 'inventory' },
      { href: '/dental/lab-orders', label: 'Laboratorios', icon: FlaskConical, feature: 'lab_orders' },
      { href: '/dental/branches', label: 'Sucursales', icon: Building2 },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { href: '/dental/reports', label: 'Reportes', icon: TrendingUp, feature: 'reports_basic' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/dental/settings', label: 'Configuración', icon: Settings },
    ],
  },
];

type Props = {
  tenantName: string;
  tenantBrandName?: string | null;
  userRole: string;
  /** Features activas del plan del tenant (desde plans.features) */
  planFeatures: Record<string, unknown>;
};

export function DentalSidebar({
  tenantName,
  tenantBrandName,
  userRole,
  planFeatures,
}: Props) {
  const pathname = usePathname();
  const displayName = tenantBrandName || tenantName || 'InnovaDental';

  /**
   * Determina si un ítem se debe mostrar según el plan del tenant.
   * - Sin feature definida → siempre se muestra
   * - Con feature definida → solo si está en planFeatures con valor true
   */
  const isItemVisible = (item: NavItem): boolean => {
    if (!item.feature) return true;
    return planFeatures[item.feature] === true;
  };

  /**
   * Determina si un ítem está activo (ruta actual).
   * El dashboard tiene matcher exacto para no chocar con sub-rutas.
   */
  const isActive = (href: string): boolean => {
    if (href === '/dental/dashboard') {
      return pathname === '/dental/dashboard' || pathname === '/dental';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-40">
      {/* Header del sidebar */}
      <div className="flex items-center gap-3 p-5 border-b border-slate-100">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
          <Stethoscope className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-slate-800 truncate">
            {displayName}
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">
            {userRole}
          </p>
        </div>
      </div>

      {/* Navegación agrupada */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.label} className="mb-5">
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ' +
                        (active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900')
                      }
                    >
                      <Icon
                        className={
                          'w-4 h-4 shrink-0 ' +
                          (active ? 'text-emerald-600' : 'text-slate-400')
                        }
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-100">
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-rose-500 hover:bg-rose-50 w-full transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}