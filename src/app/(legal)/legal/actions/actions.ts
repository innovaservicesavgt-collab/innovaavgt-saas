'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import { actionSchema, ActionFormData } from './schema';
import { ActionResult } from './types';

/**
 * Crear una actuación manual (el abogado la registra)
 */
export async function createAction(data: ActionFormData): Promise<ActionResult> {
  try {
    const profile = await requireVertical('legal');

    const parsed = actionSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    const { data: inserted, error } = await supabase
      .from('legal_actions')
      .insert({
        tenant_id: profile.tenant_id,
        case_id: parsed.data.case_id,
        fecha: parsed.data.fecha,
        tipo: parsed.data.tipo,
        descripcion: parsed.data.descripcion.trim(),
        registrada_por: profile.id,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating action:', error);
      return { success: false, error: 'No se pudo registrar la actuación' };
    }

    await supabase
      .from('legal_cases')
      .update({ ultima_actuacion: parsed.data.fecha })
      .eq('id', parsed.data.case_id);

    revalidatePath('/legal/actions');
    revalidatePath(`/legal/cases/${parsed.data.case_id}`);

    return {
      success: true,
      message: 'Actuación registrada',
      actionId: inserted.id,
    };
  } catch (err) {
    console.error('Unexpected error in createAction:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Actualizar una actuación manual
 */
export async function updateAction(
  id: string,
  data: ActionFormData
): Promise<ActionResult> {
  try {
    await requireVertical('legal');

    const parsed = actionSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from('legal_actions')
      .update({
        fecha: parsed.data.fecha,
        tipo: parsed.data.tipo,
        descripcion: parsed.data.descripcion.trim(),
      })
      .eq('id', id)
      .is('event_id', null)
      .is('document_id', null);

    if (error) {
      console.error('Error updating action:', error);
      return { success: false, error: 'No se pudo actualizar la actuación' };
    }

    revalidatePath('/legal/actions');
    revalidatePath(`/legal/cases/${parsed.data.case_id}`);

    return { success: true, message: 'Actuación actualizada' };
  } catch (err) {
    console.error('Unexpected error in updateAction:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Eliminar actuación (solo las manuales)
 */
export async function deleteAction(id: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data: action, error: fetchError } = await supabase
      .from('legal_actions')
      .select('case_id, event_id, document_id')
      .eq('id', id)
      .single();

    if (fetchError || !action) {
      return { success: false, error: 'Actuación no encontrada' };
    }

    if (action.event_id || action.document_id) {
      return {
        success: false,
        error: 'Las actuaciones automáticas no se pueden eliminar manualmente',
      };
    }

    const { error } = await supabase
      .from('legal_actions')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: 'No se pudo eliminar la actuación' };
    }

    revalidatePath('/legal/actions');
    revalidatePath(`/legal/cases/${action.case_id}`);

    return { success: true, message: 'Actuación eliminada' };
  } catch (err) {
    console.error('Unexpected error in deleteAction:', err);
    return { success: false, error: 'Error inesperado' };
  }
}