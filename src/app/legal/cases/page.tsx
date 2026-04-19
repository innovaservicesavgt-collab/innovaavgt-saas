import { createServerSupabase } from '@/lib/supabase/server';
import { CasesPageClient } from './components/cases-page-client';
import { LegalCaseWithRelations } from './types';

export default async function LegalCasesPage() {
  const supabase = await createServerSupabase();

  // Cargar expedientes con cliente y abogado relacionados
  const { data: cases, error: casesError } = await supabase
    .from('legal_cases')
    .select(`
      *,
      client:legal_clients (id, nombre, tipo_persona),
      abogado:profiles!abogado_responsable_id (id, first_name, last_name)
    `)
    .order('created_at', { ascending: false });

  if (casesError) {
    console.error('Error loading cases:', casesError);
  }

  // Cargar clientes activos para el selector del formulario
  const { data: clients } = await supabase
    .from('legal_clients')
    .select('id, nombre, tipo_persona, dpi, nit')
    .eq('activo', true)
    .order('nombre');

  // Cargar abogados del tenant (profiles con rol admin o professional)
  const { data: abogados } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role:roles(name)')
    .eq('is_active', true)
    .order('first_name');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Expedientes</h1>
        <p className="text-gray-600 mt-1">Gestión de casos jurídicos</p>
      </div>

      <CasesPageClient
        initialCases={(cases as LegalCaseWithRelations[]) || []}
        clients={clients || []}
        abogados={abogados || []}
      />
    </div>
  );
}