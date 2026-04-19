import { createServerSupabase } from '@/lib/supabase/server';
import { DocumentsPageClient } from './components/documents-page-client';
import { LegalDocumentWithCase } from './types';

export default async function LegalDocumentsPage() {
  const supabase = await createServerSupabase();

  // Cargar todos los documentos con expediente y cliente
  const { data: documents } = await supabase
    .from('legal_documents')
    .select(`
      *,
      case:legal_cases (
        id,
        numero_interno,
        client:legal_clients (id, nombre)
      )
    `)
    .order('created_at', { ascending: false });

  // Cargar expedientes activos para el modal de upload
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
        <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
        <p className="text-gray-600 mt-1">
          Biblioteca documental: memoriales, oficios, resoluciones, pruebas
        </p>
      </div>

      <DocumentsPageClient
        documents={(documents as LegalDocumentWithCase[]) || []}
        cases={(cases as any) || []}
      />
    </div>
  );
}