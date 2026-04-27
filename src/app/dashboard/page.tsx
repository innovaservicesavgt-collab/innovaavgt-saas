import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/tenant';

/**
 * Router maestro: /dashboard redirige al dashboard de la vertical
 * del tenant del usuario autenticado.
 *
 * Esto permite que URLs viejas tipo "/dashboard" sigan funcionando
 * y al mismo tiempo evita que distintas verticales colisionen.
 */
export default async function DashboardRouter() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect('/login');
  }

  if (!profile.tenant) {
    redirect('/login?error=no_tenant');
  }

  if (!profile.tenant.is_active) {
    redirect('/login?error=tenant_inactive');
  }

  switch (profile.tenant.vertical) {
    case 'legal':
      redirect('/legal/dashboard');
    case 'dental':
      redirect('/dental/dashboard');
    default:
      redirect('/dental/dashboard');
  }
}