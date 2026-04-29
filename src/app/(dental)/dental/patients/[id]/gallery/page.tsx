import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { GalleryClient } from '@/components/gallery/gallery-client';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientGalleryPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const supabase = await createServerSupabase();

  const { data: patient } = await supabase
    .from('patients')
    .select('id, first_name, last_name')
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (!patient) notFound();

  const { data: photos } = await supabase
    .from('patient_photos')
    .select('*')
    .eq('patient_id', id)
    .eq('tenant_id', profile.tenant.id)
    .eq('is_deleted', false)
    .order('taken_at', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <Link
        href={'/dental/patients/' + id}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al expediente
      </Link>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Galeria clinica
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {patient.first_name} {patient.last_name}
        </p>
      </header>

      <GalleryClient
        patientId={id}
        photos={(photos || []) as unknown as never}
      />
    </div>
  );
}
