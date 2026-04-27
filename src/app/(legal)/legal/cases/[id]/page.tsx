import { notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { CaseTabsWrapper } from './components/case-tabs-wrapper';
import type { LegalCaseWithRelations } from '../types';
import {
  getJuzgados,
  getFiscalias,
  getTiposProceso,
} from '@/app/legal/catalogs/actions';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  // Query principal del expediente con joins
  const { data: caseData, error: caseError } = await supabase
    .from('legal_cases')
    .select(`
      *,
      client:legal_clients (id, nombre, tipo_persona),
      abogado:profiles!abogado_responsable_id (id, first_name, last_name),
      juzgado:legal_catalog_juzgados!juzgado_id (
        id, nombre, nombre_corto, departamento, municipio, materia, instancia
      ),
      fiscalia:legal_catalog_fiscalias!fiscalia_id (
        id, nombre, nombre_corto, departamento, municipio, tipo
      ),
      tipo_proceso_catalogo:legal_catalog_tipos_proceso!tipo_proceso_id (
        id, nombre, via_procesal, descripcion
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (caseError) {
    console.error('Error loading case:', caseError);
  }

  if (!caseData) {
    notFound();
  }

  // Cargar listas y catálogos en paralelo
  const [clientsRes, abogadosRes, juzgados, fiscalias, tiposProceso] =
    await Promise.all([
      supabase
        .from('legal_clients')
        .select('id, nombre, tipo_persona, dpi, nit')
        .eq('activo', true)
        .order('nombre'),

      supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('is_active', true)
        .order('first_name'),

      getJuzgados(),
      getFiscalias(),
      getTiposProceso(),
    ]);

  return (
    <CaseTabsWrapper
      caseData={caseData as unknown as LegalCaseWithRelations}
      clients={clientsRes.data || []}
      abogados={abogadosRes.data || []}
      juzgados={juzgados}
      fiscalias={fiscalias}
      tiposProceso={tiposProceso}
    />
  );
}