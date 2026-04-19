import { createServerSupabase } from '@/lib/supabase/server';
import { ActionsPageClient } from './components/actions-page-client';
import { LegalActionWithRelations } from './types';

export default async function LegalActionsPage() {
  const supabase = await createServerSupabase();

  const { data: actions } = await supabase
    .from('legal_actions')
    .select(`
      *,
      case:legal_cases (
        id,
        numero_interno,
        materia,
        client:legal_clients (id, nombre)
      ),
      registrada_por_profile:profiles!registrada_por (
        first_name,
        last_name
      )
    `)
    .order('fecha', { ascending: false });

  const { data: cases } = await supabase
    .from('legal_cases')
    .select(`
      id,
      numero_interno,
      client:legal_clients (nombre)
    `)
    .eq('archivado', false)
    .order('numero_interno', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Actuaciones</h1>
        <p className="text-gray-600 mt-1">
          Bitácora cronológica de todos los expedientes
        </p>
      </div>

      <ActionsPageClient
        initialActions={(actions as unknown as LegalActionWithRelations[]) || []}
        cases={(cases as unknown as CaseOption[]) || []}
      />
    </div>
  );
}

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};