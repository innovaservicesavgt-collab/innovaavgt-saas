import { createServerSupabase } from '@/lib/supabase/server';
import { CaseActionsTabClient } from './case-actions-tab-client';
import { LegalActionWithRelations } from '@/app/(legal)/legal/actions/types';

type Props = {
  caseId: string;
};

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};

export async function CaseActionsTab({ caseId }: Props) {
  const supabase = await createServerSupabase();

  const { data: actions } = await supabase
    .from('legal_actions')
    .select(`
      *,
      registrada_por_profile:profiles!registrada_por (
        first_name,
        last_name
      )
    `)
    .eq('case_id', caseId)
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
    <CaseActionsTabClient
      actions={(actions as unknown as LegalActionWithRelations[]) || []}
      cases={(cases as unknown as CaseOption[]) || []}
      caseId={caseId}
    />
  );
}