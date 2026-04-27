'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react';

const items = [
  { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/superadmin/clients', label: 'Clientes', icon: Building2 },
  { href: '/superadmin/plans', label: 'Planes', icon: Package },
  { href: '/superadmin/payments', label: 'Pagos', icon: CreditCard },
  { href: '/superadmin/reports', label: 'Reportes', icon: BarChart3 },
  { href: '/superadmin/settings', label: 'Configuración', icon: Settings },
];

export default function SuperadminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-80 flex-col bg-[#223458] text-white lg:flex">
      <div className="border-b border-white/10 px-7 py-7">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20">
            <ShieldCheck className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Servicios Innova
            </h2>
            <p className="mt-1 text-sm text-slate-300">Panel Superadmin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-5 py-6">
        <div className="space-y-2">
          {items.map((item) => {
            // Fix del matcher: evita que "/superadmin" marque todas las rutas hijas
            const active =
              item.href === '/superadmin'
                ? pathname === '/superadmin'
                : pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-[17px] font-medium transition ${
                  active
                    ? 'bg-white/12 text-white shadow-sm'
                    : 'text-slate-200 hover:bg-white/8 hover:text-white'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    active ? 'text-blue-300' : 'text-slate-300 group-hover:text-blue-300'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}