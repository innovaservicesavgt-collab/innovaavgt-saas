import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { PatientDetailClient } from '@/components/patients/patient-detail-client';
import { ArrowLeft } from 'lucide-react';

export type PatientFull = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  phone_secondary: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  document_type: string | null;
  document_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  blood_type: string | null;
  allergies: string | null;
  medical_notes: string | null;
  source: string | null;
  tags: string[] | null;
  is_active: boolean | null;
  photo_url: string | null;
  responsible_name: string | null;
  responsible_phone: string | null;
  responsible_relationship: string | null;
  occupation: string | null;
  insurance_provider: string | null;
  insurance_number: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export type AppointmentForPatient = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  reason: string | null;
  price: number | null;
  professionals: {
    first_name: string;
    last_name: string;
    title: string | null;
  } | null;
  services: { name: string } | null;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createServerSupabase();

  // 1. Cargar paciente
  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !patient) notFound();

  // 2. Cargar todas las citas del paciente
  const { data: appointments } = await supabase
    .from('appointments')
    .select(
      'id, appointment_date, start_time, end_time, status, reason, price, professionals(first_name, last_name, title), services(name)'
    )
    .eq('patient_id', id)
    .order('appointment_date', { ascending: false })
    .order('start_time', { ascending: false });

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Link
        href="/dental/patients"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pacientes
      </Link>

      <PatientDetailClient
        patient={patient as PatientFull}
        appointments={(appointments || []) as unknown as AppointmentForPatient[]}
      />
    </div>
  );
}