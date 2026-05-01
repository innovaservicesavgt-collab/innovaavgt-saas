import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { SettingsClient } from '@/components/settings/settings-client';

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

export const metadata = { title: 'Configuracion - InnovaAVGT' };

export default async function SettingsPage({ searchParams }: PageProps) {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile?.tenant) redirect('/login');

  if (profile.role?.name !== 'admin' && !profile.is_superadmin) {
    redirect('/dental/dashboard');
  }

  const { tab: rawTab } = await searchParams;
  const validTabs = ['general', 'branding', 'plan', 'team', 'services'];
  const initialTab = validTabs.includes(rawTab || '') ? (rawTab as 'general' | 'branding' | 'plan' | 'team' | 'services') : 'general';

  const supabase = await createServerSupabase();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, address, phone, email, logo_url, brand_logo_url, primary_color, secondary_color, vertical, plan_id, plan')
    .eq('id', profile.tenant.id)
    .single();

  const { data: planData } = await supabase
    .from('plans')
    .select('id, code, name, monthly_price, currency, trial_days, max_users, max_branches, max_patients, storage_mb, features')
    .eq('id', tenant?.plan_id)
    .maybeSingle();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status, billing_cycle, trial_ends_at, current_period_start, current_period_end, locked_price, currency')
    .eq('tenant_id', profile.tenant.id)
    .maybeSingle();

  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, title, first_name, last_name, specialty, email, phone, license_number, photo_url, is_active, color')
    .eq('tenant_id', profile.tenant.id)
    .order('created_at', { ascending: true });

  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, category, price, currency, duration_minutes, buffer_minutes, color, is_active, requires_confirmation')
    .eq('tenant_id', profile.tenant.id)
    .order('category', { ascending: true });

  return (
    <SettingsClient
      initialTab={initialTab}
      tenant={(tenant as never) || { id: '', name: '', slug: '', address: null, phone: null, email: null, logo_url: null, primary_color: null, secondary_color: null }}
      plan={(planData as never) || null}
      subscription={(subscription as never) || null}
      professionals={(professionals as never) || []}
      services={(services as never) || []}
      vertical={profile.tenant.vertical || 'dental'}
    />
  );
}
