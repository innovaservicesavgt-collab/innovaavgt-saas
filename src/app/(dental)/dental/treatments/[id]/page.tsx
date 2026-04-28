import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { TreatmentPlanDetail } from '@/components/treatments/treatment-plan-detail';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TreatmentPlanDetailPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;
  const supabase = await createServerSupabase();

  const { data: plan, error } = await supabase
    .from('treatment_plans')
    .select('*, patients (id, first_name, last_name, phone, email, document_number)')
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (error || !plan) notFound();

  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('treatment_plan_id', id)
    .order('installment_number', { ascending: true });

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('treatment_plan_id', id)
    .eq('tenant_id', profile.tenant.id)
    .order('paid_at', { ascending: false });

  return (
    <TreatmentPlanDetail
      plan={plan as unknown as never}
      schedules={(schedules || []) as unknown as never}
      payments={(payments || []) as unknown as never}
      tenantName={profile.tenant.brand_name || profile.tenant.name || 'ClinicaPrueba'}
    />
  );
}
