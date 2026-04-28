import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { QuotationWizard } from '@/components/quotations/quotation-wizard';

type PageProps = {
  searchParams: Promise<{ patient_id?: string }>;
};

export default async function NewQuotationPage({ searchParams }: PageProps) {
  await requireAuth();
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;

  const params = await searchParams;
  const supabase = await createServerSupabase();

  // Cargar pacientes activos
  const { data: patients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, phone, date_of_birth')
    .eq('tenant_id', profile.tenant.id)
    .eq('is_active', true)
    .order('first_name', { ascending: true });

  // Cargar profesionales activos
  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, first_name, last_name, title, specialty')
    .eq('tenant_id', profile.tenant.id)
    .eq('is_active', true)
    .order('first_name', { ascending: true });

  // Cargar servicios activos
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, price, duration_minutes, category, color')
    .eq('tenant_id', profile.tenant.id)
    .eq('is_active', true)
    .order('name', { ascending: true });

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Link
        href="/dental/quotations"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a cotizaciones
      </Link>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Nueva cotizacion
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Crea un presupuesto profesional con multiples tratamientos, descuentos y terminos.
        </p>
      </header>

      <QuotationWizard
        patients={patients || []}
        professionals={professionals || []}
        services={services || []}
        preselectedPatientId={params.patient_id || null}
      />
    </div>
  );
}
