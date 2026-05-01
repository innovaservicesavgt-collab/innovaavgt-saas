import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { getServiceTemplates } from '@/server/actions/onboarding';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default async function OnboardingPage() {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    redirect('/login');
  }

  // Si ya completo onboarding, redirect
  if ((profile.tenant as { is_onboarding_complete?: boolean }).is_onboarding_complete) {
    const vertical = profile.tenant.vertical;
    redirect(vertical === 'legal' ? '/legal/dashboard' : '/dental/dashboard');
  }

  const supabase = await createServerSupabase();

  // Cargar el tenant completo (para precargar datos)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, address, phone, logo_url, primary_color, secondary_color, vertical, onboarding_step')
    .eq('id', profile.tenant.id)
    .single();

  // Cargar el profesional ya creado (si existe)
  const { data: existingProfessional } = await supabase
    .from('professionals')
    .select('*')
    .eq('tenant_id', profile.tenant.id)
    .eq('profile_id', profile.id)
    .maybeSingle();

  // Cargar plantillas de servicios
  const templates = await getServiceTemplates(profile.tenant.vertical || 'dental');

  return (
    <OnboardingWizard
      tenant={tenant as never}
      profileEmail={profile.email}
      profileFirstName={profile.first_name}
      profileLastName={profile.last_name}
      existingProfessional={(existingProfessional as never) || null}
      serviceTemplates={templates as never}
      vertical={profile.tenant.vertical || 'dental'}
    />
  );
}
