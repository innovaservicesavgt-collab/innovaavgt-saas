import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/tenant';
import { DentalSidebar } from '@/components/dental/dental-sidebar';
import { DentalMobileNav } from '@/components/dental/dental-mobile-nav';
import { HeaderBar } from '@/components/layout/header-bar';

/**
 * Layout para el route group (dental).
 *
 * Responsabilidades:
 *  1. Verifica que el usuario esté autenticado.
 *  2. Verifica que el tenant del usuario sea de vertical 'dental'.
 *     Si es de otra vertical, redirige al dashboard correspondiente.
 *  3. Renderiza sidebar, header y mobile nav específicos de dental.
 *
 * Las URLs servidas por este layout son /dental/dashboard, /dental/patients, etc.
 * (el route group "(dental)" no aparece en la URL)
 */
export default async function DentalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  // 1. Sin sesión → al login
  if (!profile) {
    redirect('/login');
  }

  // 2. Sin tenant asociado
  if (!profile.tenant) {
    redirect('/login?error=no_tenant');
  }

  // 3. Tenant inactivo
  if (!profile.tenant.is_active) {
    redirect('/login?error=tenant_inactive');
  }

  // 4. Vertical incorrecto → redirige al dashboard de su vertical
  if (profile.tenant.vertical !== 'dental') {
    if (profile.tenant.vertical === 'legal') {
      redirect('/legal/dashboard');
    }
    // fallback: router maestro decide
    redirect('/dashboard');
  }

  // 5. Datos para componentes
  const userData = {
    name: `${profile.first_name} ${profile.last_name}`.trim() || 'Usuario',
    email: profile.email,
    role: profile.role?.display_name || profile.role?.name || 'Usuario',
    tenantName: profile.tenant.name,
    tenantSlug: profile.tenant.slug,
  };

  const planFeatures = profile.tenant.plan?.features ?? {};

  return (
    <div className="min-h-screen bg-slate-50">
      <DentalSidebar
        tenantName={profile.tenant.name}
        tenantBrandName={profile.tenant.brand_name}
        userRole={userData.role}
        planFeatures={planFeatures}
      />
      <div className="lg:pl-64">
        <HeaderBar user={userData} />
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
      </div>
      <DentalMobileNav />
    </div>
  );
}