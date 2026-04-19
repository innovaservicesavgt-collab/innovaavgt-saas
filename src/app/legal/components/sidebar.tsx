'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Users,
  FileText,
  BookOpen,
  LogOut,
  Scale,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/legal/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/legal/cases', icon: Briefcase, label: 'Expedientes' },
  { href: '/legal/calendar', icon: Calendar, label: 'Agenda' },
  { href: '/legal/clients', icon: Users, label: 'Clientes' },
  { href: '/legal/documents', icon: FileText, label: 'Documentos' },
  { href: '/legal/actions', icon: BookOpen, label: 'Actuaciones' },
];

export function LegalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 leading-tight">
              Gestión Jurídica
            </div>
            <div className="text-xs text-gray-500">Módulo Legal</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}