import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { AcceptWizard } from '@/components/quotations/accept-wizard';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AcceptQuotationPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const supabase = await createServerSupabase();

  const { data: quotation, error } = await supabase
    .from('quotations')
    .select('id, quotation_number, notes, total_amount, total, status, treatment_plan_id, patients (id, first_name, last_name, phone)')
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (error || !quotation) notFound();

  // Si ya tiene plan creado, redirigir al detalle del plan
  if (quotation.treatment_plan_id) {
    redirect('/dental/treatments/' + quotation.treatment_plan_id);
  }

  const notesText = (quotation.notes as string) || 'Plan de tratamiento';
  const parts = notesText.split('\n\n');
  const title = parts[0] || 'Plan de tratamiento';
  const total = Number(quotation.total_amount || quotation.total || 0);

  const patient = quotation.patients as unknown as { id: string; first_name: string; last_name: string; phone: string | null } | null;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <Link
        href={'/dental/quotations/' + id}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a la cotizacion
      </Link>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Aceptar cotizacion
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configura la forma de pago. Se generara un plan de tratamiento con su cronograma de cuotas.
        </p>
      </header>

      <AcceptWizard
        quotationId={id}
        quotationNumber={quotation.quotation_number || ''}
        title={title}
        total={total}
        patientName={patient ? patient.first_name + ' ' + patient.last_name : 'Sin paciente'}
        patientPhone={patient?.phone || null}
      />
    </div>
  );
}
