import { supabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  business_type: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  email: string;
  phone: string | null;
  plan: string;
  is_active: boolean;
  timezone: string;
  currency: string;
  settings: Record<string, unknown>;
}

const tenantCache = new Map<string, { tenant: Tenant; timestamp: number }>();
const CACHE_TTL = 60_000;

export async function resolveTenant(): Promise<Tenant | null> {
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug');
  const isTenant = headersList.get('x-is-tenant') === 'true';

  if (!isTenant || !slug) return null;

  const cached = tenantCache.get(slug);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.tenant;
  }

  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  const tenant = data as Tenant;
  tenantCache.set(slug, { tenant, timestamp: Date.now() });
  return tenant;
}

export async function requireTenant(): Promise<Tenant> {
  const tenant = await resolveTenant();
  if (!tenant) throw new Error('Tenant not found or inactive');
  return tenant;
}
