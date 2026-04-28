import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ClipboardSignature, User, Hash, Stethoscope, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { ConsentDetail } from '@/components/documents/consent-detail';

type PageProps = { params: Promise<{ id: string }> };

export default async function ConsentDetailPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;
  const supabase = await createServerSupabase();

  const { data: consent, error } = await supabase
    .from('consents')
    .select('*, patients (id, first_name, last_name, document_number, phone, address), professionals (first_name, last_name, title, specialty)')
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (error || !consent) notFound();

  return (
    <ConsentDetail
      consent={consent as unknown as never}
      tenantName={profile.tenant.brand_name || profile.tenant.name || 'Clinica'}
    />
  );
}
