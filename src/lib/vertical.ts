import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/tenant';

/**
 * Requiere que el usuario esté autenticado y que su tenant tenga el vertical indicado.
 * Si no, redirige al login o al dashboard correcto.
 * 
 * Uso: al inicio de un Server Component de la ruta protegida.
 * 
 * Ejemplo:
 *   const profile = await requireVertical('legal');
 *   // aquí ya sabes que el usuario es de un tenant legal
 */
export async function requireVertical(vertical: 'dental' | 'legal') {
  const profile = await getCurrentProfile();

  // Sin sesión → al login
  if (!profile) {
    redirect('/login');
  }

  // Sin tenant asociado (raro, pero posible) → al login
  if (!profile.tenant) {
    redirect('/login?error=no_tenant');
  }

  // Tenant inactivo → al login con mensaje
  if (!profile.tenant.is_active) {
    redirect('/login?error=tenant_inactive');
  }

  // Vertical incorrecto → redirige al dashboard del vertical correcto
  if (profile.tenant.vertical !== vertical) {
    const correctPath = profile.tenant.vertical === 'legal' 
      ? '/legal/dashboard' 
      : '/dashboard';
    redirect(correctPath);
  }

  return profile;
}

/**
 * Solo chequea, no redirige. Útil para lógica condicional en componentes.
 */
export async function hasVertical(vertical: 'dental' | 'legal'): Promise<boolean> {
  const profile = await getCurrentProfile();
  return profile?.tenant?.vertical === vertical;
}