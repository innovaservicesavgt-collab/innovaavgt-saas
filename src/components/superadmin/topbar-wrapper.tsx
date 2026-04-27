'use client';

import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  CircleHelp,
} from 'lucide-react';

// Mapa de rutas → título mostrado en el topbar
const TITLES: { match: (path: string) => boolean; title: string }[] = [
  { match: (p) => p === '/superadmin', title: 'Dashboard' },
  { match: (p) => p.startsWith('/superadmin/clients'), title: 'Clientes' },
  { match: (p) => p.startsWith('/superadmin/plans'), title: 'Planes' },
  { match: (p) => p.startsWith('/superadmin/payments'), title: 'Pagos' },
  { match: (p) => p.startsWith('/superadmin/reports'), title: 'Reportes' },
  { match: (p) => p.startsWith('/superadmin/settings'), title: 'Configuración' },
];

function getTitle(pathname: string): string {
  const found = TITLES.find((t) => t.match(pathname));
  return found?.title || 'Superadmin';
}

type Props = {
  userName: string;
  userEmail: string;
};

export default function SuperadminTopbar({ userName, userEmail }: Props) {
  const pathname = usePathname();
  const title = getTitle(pathname);

  // Iniciales para el avatar
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('') || 'A';

  return (
    <header className="border-b border-slate-200 bg-[#31486F] px-6 py-5 text-white md:px-8">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
        </div>

        <div className="flex items-center gap-5">
          <button
            type="button"
            className="hidden items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10 md:flex"
          >
            <CircleHelp className="h-5 w-5" />
            <span>Soporte</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="relative rounded-2xl p-2 transition hover:bg-white/10"
            aria-label="Notificaciones"
          >
            <Bell className="h-6 w-6 text-white" />
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              1
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-sm font-bold text-slate-700">
              {initials}
            </div>
            <div className="hidden md:block">
              <div className="font-semibold text-white">{userName}</div>
              {userEmail && (
                <div className="text-xs text-slate-300">{userEmail}</div>
              )}
            </div>
            <ChevronDown className="hidden h-4 w-4 text-white md:block" />
          </div>
        </div>
      </div>
    </header>
  );
}