'use client';
import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/dental/dashboard': 'Dashboard', '/dental/calendar': 'Calendario', '/dental/appointments': 'Citas',
  '/dental/appointments/new': 'Nueva cita', '/dental/patients': 'Pacientes', '/dental/patients/new': 'Nuevo paciente',
  '/dental/professionals': 'Profesionales', '/dental/professionals/new': 'Nuevo profesional',
  '/dental/services': 'Servicios', '/dental/services/new': 'Nuevo servicio',
  '/dental/quotations': 'Cotizaciones', '/dental/quotations/new': 'Nueva cotizacion',
  '/dental/settings': 'Configuracion',
};

interface HeaderBarProps { user: { name: string; role: string } }

export function HeaderBar({ user }: HeaderBarProps) {
  const pathname = usePathname();
  const title = titles[pathname] || Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] || 'Dashboard';

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-slate-700">{user.name}</p>
          <p className="text-xs text-slate-400">{user.role}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">{user.name.charAt(0)}</div>
      </div>
    </header>
  );
}
