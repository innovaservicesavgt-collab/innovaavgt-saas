import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { Bell, ChevronDown, CircleHelp, BarChart3, Building2, CreditCard, LayoutDashboard, Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

function Sidebar() {
  const items = [
    { href: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/superadmin/clients', label: 'Clientes', icon: Building2 },
    { href: '/superadmin/payments', label: 'Pagos', icon: CreditCard },
    { href: '/superadmin/reports', label: 'Reportes', icon: BarChart3 },
    { href: '/superadmin/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="hidden min-h-screen w-[290px] shrink-0 bg-[#243B63] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15">
            <ShieldCheck className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white">Panel Superadmin</div>
            <div className="mt-1 text-sm text-slate-300">Servicios Innova</div>
          </div>
        </div>
      </div>

      <nav className="px-4 py-6">
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.href === '/superadmin/clients';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-[17px] font-medium transition ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 text-slate-200" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="border-b border-slate-200 bg-[#31486F] px-6 py-5 text-white md:px-8">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Panel Clientes</h1>
        </div>

        <div className="flex items-center gap-5">
          <button className="hidden items-center gap-2 rounded-2xl px-3 py-2 text-sm text-slate-100 hover:bg-white/10 md:flex">
            <CircleHelp className="h-5 w-5" />
            <span>Soporte</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <button className="relative rounded-2xl p-2 hover:bg-white/10">
            <Bell className="h-6 w-6 text-white" />
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              1
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200" />
            <div className="hidden md:block">
              <div className="font-semibold text-white">Admin</div>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-white md:block" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_superadmin')
    .eq('id', auth.user.id)
    .single();

  if (error || !profile?.is_superadmin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#EEF2F7] text-slate-900 lg:flex">
      <Sidebar />
      <div className="min-h-screen flex-1">
        <Topbar />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}