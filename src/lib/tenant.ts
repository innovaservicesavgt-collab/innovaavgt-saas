import { createServerSupabase } from '@/lib/supabase/server';
import { cache } from 'react';
import type { VerticalCode } from '@/lib/verticals';

export type TenantPlan = {
  id: string;
  code: string;
  name: string;
  monthly_price: number;
  currency: string;
  /** Features activadas por el plan (JSONB de la tabla plans) */
  features: Record<string, unknown>;
};

export type TenantInfo = {
  id: string;
  name: string;
  vertical: VerticalCode;
  business_type: string | null;
  slug: string;
  is_active: boolean;
  // Campos agregados en Sprint 1
  timezone: string;
  default_currency: string;
  default_language: string;
  brand_name: string | null;
  brand_logo_url: string | null;
  brand_primary_color: string | null;
  plan: TenantPlan | null;
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
 * Devuelve el usuario autenticado con profile, tenant y rol.
 * Usa React cache() para deduplicar queries en el mismo render.
 */
export const getCurrentProfile = cache(
  async (): Promise<ProfileWithTenant | null> => {
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
          is_active,
          timezone,
          default_currency,
          default_language,
          brand_name,
          brand_logo_url,
          brand_primary_color,
          plan:plans (
            id,
            code,
            name,
            monthly_price,
            currency,
            features
          )
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
  }
);

export const getCurrentTenant = cache(
  async (): Promise<TenantInfo | null> => {
    const profile = await getCurrentProfile();
    return profile?.tenant ?? null;
  }
);

export async function getCurrentVertical(): Promise<VerticalCode | null> {
  const tenant = await getCurrentTenant();
  return tenant?.vertical ?? null;
}

/**
 * Verifica si el tenant actual tiene una feature activa en su plan.
 *
 * Uso en Server Components:
 *   if (await hasFeature('odontogram')) { ... }
 *
 * Uso en Client Components:
 *   Pasa las features desde un Server Component via props.
 */
export async function hasFeature(feature: string): Promise<boolean> {
  const tenant = await getCurrentTenant();
  if (!tenant?.plan?.features) return false;
  return tenant.plan.features[feature] === true;
}

/**
 * Versión sincrónica para Client Components que ya recibieron
 * el objeto de features como prop.
 */
export function hasFeatureSync(
  features: Record<string, unknown> | null | undefined,
  feature: string
): boolean {
  if (!features) return false;
  return features[feature] === true;
}