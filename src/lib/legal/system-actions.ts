'use server';

import { createServerSupabase } from '@/lib/supabase/server';


type CreateSystemActionParams = {
  tenantId: string;
  caseId: string;
  tipo: string;
  descripcion: string;
  eventId?: string;
  documentId?: string;
  profileId?: string;
};

type SystemActionResult =
  | { success: true; actionId: string }
  | { success: false; error: string };

/**
 * Crea una actuación automática del sistema.
 * Se usa desde eventos (al completar) y documentos (al subir).
 */
export async function createSystemAction(
  params: CreateSystemActionParams
): Promise<SystemActionResult> {
  try {
    const supabase = await createServerSupabase();

    const { data: inserted, error } = await supabase
      .from('legal_actions')
      .insert({
        tenant_id: params.tenantId,
        case_id: params.caseId,
        fecha: new Date().toISOString(),
        tipo: params.tipo,
        descripcion: params.descripcion,
        event_id: params.eventId ?? null,
        document_id: params.documentId ?? null,
        registrada_por: params.profileId ?? null,
      })
      .select('id')
      .single();

    if (error || !inserted) {
      console.error('Error creating system action:', error);
      return { success: false, error: 'No se pudo registrar actuación automática' };
    }

    return {
      success: true,
      actionId: inserted.id,
    };
  } catch (err) {
    console.error('Unexpected error in createSystemAction:', err);
    return { success: false, error: 'Error inesperado' };
  }
}