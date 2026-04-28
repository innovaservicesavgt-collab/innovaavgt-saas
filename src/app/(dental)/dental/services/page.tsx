import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { ServiceForm } from '@/components/services/service-form';
import type { Service } from '@/lib/types/service';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditServicePage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const supabase = await createServerSupabase();

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !service) notFound();

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Link
        href="/dental/services"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a servicios
      </Link>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Editar servicio
        </h1>
        <p className="mt-1 text-sm text-slate-500">{service.name}</p>
      </header>

      <ServiceForm mode="edit" service={service as Service} />
    </div>
  );
}