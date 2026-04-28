import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { DocumentsClient } from '@/components/documents/documents-client';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientDocumentsPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const supabase = await createServerSupabase();

  const { data: patient } = await supabase
    .from('patients')
    .select('id, first_name, last_name, phone, document_number')
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (!patient) notFound();

  const { data: prescriptions } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('patient_id', id)
    .eq('tenant_id', profile.tenant.id)
    .order('created_at', { ascending: false });

  const { data: consents } = await supabase
    .from('consents')
    .select('*')
    .eq('patient_id', id)
    .eq('tenant_id', profile.tenant.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Link
        href={'/dental/patients/' + id}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al expediente
      </Link>

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Documentos clinicos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {patient.first_name} {patient.last_name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={'/dental/patients/' + id + '/documents/prescriptions/new'}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva receta
          </Link>
          <Link
            href={'/dental/patients/' + id + '/documents/consents/new'}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo consentimiento
          </Link>
        </div>
      </header>

      <DocumentsClient
        prescriptions={(prescriptions || []) as unknown as never}
        consents={(consents || []) as unknown as never}
      />
    </div>
  );
}
