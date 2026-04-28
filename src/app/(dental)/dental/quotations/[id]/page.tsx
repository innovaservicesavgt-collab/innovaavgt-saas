import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { QuotationDetail } from '@/components/quotations/quotation-detail';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function QuotationDetailPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const supabase = await createServerSupabase();

  const { data: quotation, error } = await supabase
    .from('quotations')
    .select('*, patients (id, first_name, last_name, phone, email, document_number, address)')
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (error || !quotation) notFound();

  const { data: items } = await supabase
    .from('quotation_items')
    .select('*')
    .eq('quotation_id', id)
    .order('sort_order', { ascending: true });

  return (
    <QuotationDetail
      quotation={quotation as unknown as never}
      items={(items || []) as unknown as never}
      tenantName={profile.tenant.brand_name || profile.tenant.name || 'ClinicaPrueba'}
    />
  );
}
