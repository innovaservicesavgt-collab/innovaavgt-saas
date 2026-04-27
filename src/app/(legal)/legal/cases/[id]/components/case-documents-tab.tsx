import { createServerSupabase } from '@/lib/supabase/server';
import { DocumentsTabClient } from './documents-tab-client';
import { LegalDocumentWithCase } from '@/app/legal/documents/types';

type Props = {
  caseId: string;
  caseNumber: string;
};

export async function CaseDocumentsTab({ caseId, caseNumber }: Props) {
  const supabase = await createServerSupabase();

  const { data: documents } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

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
    <DocumentsTabClient
      documents={(documents as unknown as LegalDocumentWithCase[]) || []}
      cases={(cases as unknown as CaseOption[]) || []}
      caseId={caseId}
      caseNumber={caseNumber}
    />
  );
}

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};