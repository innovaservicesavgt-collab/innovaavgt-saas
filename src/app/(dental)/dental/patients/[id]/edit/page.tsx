import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { PatientEditForm } from '@/components/patients/patient-edit-form';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientEditPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: patient, error } = await supabase
    .from('patients')
    .select(
      'id, first_name, last_name, email, phone, phone_secondary, date_of_birth, gender, address, city, document_type, document_number, emergency_contact_name, emergency_contact_phone, blood_type, allergies, medical_notes, occupation, insurance_provider, insurance_number, responsible_name, responsible_phone, responsible_relationship, is_active'
    )
    .eq('id', id)
    .single();

  if (error || !patient) notFound();

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Link
        href={`/dental/patients/${id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al paciente
      </Link>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Editar paciente
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {patient.first_name} {patient.last_name}
        </p>
      </header>

      <PatientEditForm patient={patient} />
    </div>
  );
}