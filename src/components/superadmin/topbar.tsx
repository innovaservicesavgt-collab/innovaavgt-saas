import { Bell, ChevronDown, CircleHelp } from 'lucide-react';

export default function SuperadminTopbar() {
  return (
    <header className="border-b border-slate-200 bg-[#31456F] px-6 py-5 text-white md:px-10">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Panel Superadmin
          </h1>
          <p className="mt-1 text-sm text-slate-200">
            Administración general de clientes, pagos y configuración del SaaS.
          </p>
        </div>

        <div className="flex items-center gap-5">
          <button className="hidden items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-100 transition hover:bg-white/10 md:flex">
            <CircleHelp className="h-5 w-5" />
            <span>Soporte</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <button className="relative rounded-2xl p-2 transition hover:bg-white/10">
            <Bell className="h-6 w-6 text-white" />
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              1
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-[#31456F]">
              K
            </div>
            <div className="hidden md:block">
              <div className="font-semibold text-white">Admin</div>
              <div className="text-xs text-slate-200">Superadministrador</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}