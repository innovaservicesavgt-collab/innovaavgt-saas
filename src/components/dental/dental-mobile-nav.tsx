'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  CalendarClock,
  Users,
  Menu,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Tab = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const TABS: Tab[] = [
  { name: 'Inicio',     href: '/dental/dashboard',    icon: LayoutDashboard },
  { name: 'Calendario', href: '/dental/calendar',     icon: Calendar },
  { name: 'Citas',      href: '/dental/appointments', icon: CalendarClock },
  { name: 'Pacientes',  href: '/dental/patients',     icon: Users },
  { name: 'Más',        href: '/dental/services',     icon: Menu },
];

export function DentalMobileNav() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/dental/dashboard') {
      return pathname === '/dental/dashboard' || pathname === '/dental';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 px-1 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                'flex flex-col items-center py-2 px-2 text-xs font-medium transition-colors ' +
                (active ? 'text-emerald-600' : 'text-slate-400')
              }
            >
              <Icon
                className="w-5 h-5 mb-0.5"
                strokeWidth={active ? 2.25 : 1.75}
              />
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}