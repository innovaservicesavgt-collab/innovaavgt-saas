import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { PrescriptionForm } from '@/components/documents/prescription-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewPrescriptionPage({ params }: PageProps) {
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

  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, first_name, last_name, title')
    .eq('tenant_id', profile.tenant.id)
    .eq('is_active', true);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Link
        href={'/dental/patients/' + id + '/documents'}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a documentos
      </Link>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Nueva receta medica
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {patient.first_name} {patient.last_name}
        </p>
      </header>

      <PrescriptionForm
        patientId={id}
        professionals={professionals || []}
      />
    </div>
  );
}
