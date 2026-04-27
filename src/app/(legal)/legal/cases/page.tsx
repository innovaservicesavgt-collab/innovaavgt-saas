import { createServerSupabase } from '@/lib/supabase/server';
import { CasesPageClient } from './components/cases-page-client';
import type { LegalCaseWithRelations } from './types';
import {
  getJuzgados,
  getFiscalias,
  getTiposProceso,
} from '@/app/(legal)/legal/catalogs/actions';

export default async function LegalCasesPage() {
  const supabase = await createServerSupabase();

  // Cargar todo en paralelo
  const [
    casesRes,
    clientsRes,
    abogadosRes,
    juzgados,
    fiscalias,
    tiposProceso,
  ] = await Promise.all([
    supabase
      .from('legal_cases')
      .select(`
        *,
        client:legal_clients (id, nombre, tipo_persona),
        abogado:profiles!abogado_responsable_id (id, first_name, last_name)
      `)
      .order('created_at', { ascending: false }),

    supabase
      .from('legal_clients')
      .select('id, nombre, tipo_persona, dpi, nit')
      .eq('activo', true)
      .order('nombre'),

    supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role:roles(name)')
      .eq('is_active', true)
      .order('first_name'),

    getJuzgados(),
    getFiscalias(),
    getTiposProceso(),
  ]);

  if (casesRes.error) {
    console.error('Error loading cases:', casesRes.error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expedientes</h1>
        <p className="text-gray-600 mt-1">GestiÃ³n de casos jurÃ­dicos</p>
      </div>

      <CasesPageClient
        initialCases={(casesRes.data as LegalCaseWithRelations[]) || []}
        clients={clientsRes.data || []}
        abogados={abogadosRes.data || []}
        juzgados={juzgados}
        fiscalias={fiscalias}
        tiposProceso={tiposProceso}
      />
    </div>
  );
}