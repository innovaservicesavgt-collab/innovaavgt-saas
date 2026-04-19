import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { CaseTabsWrapper } from './components/case-tabs-wrapper';
import { LegalCaseWithRelations } from '../types';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  // Cargar expediente con relaciones
  const { data: caseData, error } = await supabase
    .from('legal_cases')
    .select(`
      *,
      client:legal_clients (id, nombre, tipo_persona),
      abogado:profiles!abogado_responsable_id (id, first_name, last_name)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !caseData) {
    notFound();
  }

  // Cargar listas para el modal de edición
  const { data: clients } = await supabase
    .from('legal_clients')
    .select('id, nombre, tipo_persona, dpi, nit')
    .eq('activo', true)
    .order('nombre');

  const { data: abogados } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('is_active', true)
    .order('first_name');

  return (
    <CaseTabsWrapper
      caseData={caseData as LegalCaseWithRelations}
      clients={clients || []}
      abogados={abogados || []}
    />
  );
}