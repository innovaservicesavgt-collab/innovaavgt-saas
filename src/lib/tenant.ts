import { createServerSupabase } from '@/lib/supabase/server';
import { cache } from 'react';

export type TenantInfo = {
  id: string;
  name: string;
  vertical: 'dental' | 'legal';
  business_type: string;
  slug: string;
  is_active: boolean;
};

export type ProfileWithTenant = {
  id: string;
  tenant_id: string;
  role_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  is_superadmin: boolean;
  tenant: TenantInfo | null;
  role: {
    id: string;
    name: string;
    display_name: string;
  } | null;
};

/**
 * Devuelve el usuario autenticado con su profile, tenant y rol.
 * Retorna null si no hay sesión o si no tiene profile/tenant.
 * 
 * Usa React cache() para que no haga múltiples queries en el mismo render.
 */
export const getCurrentProfile = cache(async (): Promise<ProfileWithTenant | null> => {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      id,
      tenant_id,
      role_id,
      first_name,
      last_name,
      email,
      is_active,
      is_superadmin,
      tenant:tenants (
        id,
        name,
        vertical,
        business_type,
        slug,
        is_active
      ),
      role:roles (
        id,
        name,
        display_name
      )
    `)
    .eq('id', user.id)
    .single();

  if (error || !profile) return null;

  return profile as unknown as ProfileWithTenant;
});

/**
 * Devuelve solo el tenant actual, sin el profile completo.
 * Útil cuando solo necesitas saber el vertical o el nombre del despacho.
 */
export const getCurrentTenant = cache(async (): Promise<TenantInfo | null> => {
  const profile = await getCurrentProfile();
  return profile?.tenant ?? null;
});

/**
 * Devuelve el vertical del tenant actual, o null si no hay sesión.
 */
export async function getCurrentVertical(): Promise<'dental' | 'legal' | null> {
  const tenant = await getCurrentTenant();
  return tenant?.vertical ?? null;
}