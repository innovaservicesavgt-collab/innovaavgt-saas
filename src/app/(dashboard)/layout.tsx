import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { HeaderBar } from '@/components/layout/header-bar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  const supabase = await createServerSupabase();

  let tenantName = '';
  let tenantSlug = '';
  if (user.tenantId) {
    const { data: t } = await supabase.from('tenants').select('name, slug, primary_color').eq('id', user.tenantId).single();
    if (t) { tenantName = t.name; tenantSlug = t.slug; }
  }

  const userData = {
    name: user.profile.first_name + ' ' + user.profile.last_name,
    email: user.profile.email,
    role: user.roleName,
    tenantName,
    tenantSlug,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar user={userData} />
      <div className="lg:pl-64">
        <HeaderBar user={userData} />
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
