'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import { caseSchema, CaseFormData } from './schema';
import { ActionResult } from './types';
import { materiaPrefix, Materia } from './constants';

/**
 * Genera un número interno único en formato: AÑO-MAT-NNNN
 * Ejemplo: 2026-PEN-0001, 2026-CIV-0025
 */
async function generarNumeroInterno(
  tenantId: string,
  materia: Materia
): Promise<string> {
  const supabase = await createServerSupabase();
  const year = new Date().getFullYear();
  const prefix = `${year}-${materiaPrefix(materia)}`;

  // Buscar el último correlativo de ese prefijo en este tenant
  const { data: ultimo } = await supabase
    .from('legal_cases')
    .select('numero_interno')
    .eq('tenant_id', tenantId)
    .like('numero_interno', `${prefix}-%`)
    .order('numero_interno', { ascending: false })
    .limit(1)
    .maybeSingle();

  let siguiente = 1;
  if (ultimo?.numero_interno) {
    const partes = ultimo.numero_interno.split('-');
    const ultimoCorrelativo = parseInt(partes[2] ?? '0', 10);
    if (!isNaN(ultimoCorrelativo)) {
      siguiente = ultimoCorrelativo + 1;
    }
  }

  return `${prefix}-${String(siguiente).padStart(4, '0')}`;
}

/**
 * Crear un nuevo expediente
 */
export async function createCase(data: CaseFormData): Promise<ActionResult> {
  try {
    const profile = await requireVertical('legal');

    const parsed = caseSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    // Generar número interno único
    const numeroInterno = await generarNumeroInterno(
      profile.tenant_id,
      parsed.data.materia
    );

    const cleanData = {
      tenant_id: profile.tenant_id,
      numero_interno: numeroInterno,
      numero_judicial: parsed.data.numero_judicial?.trim() || null,
      materia: parsed.data.materia,
      tipo_proceso: parsed.data.tipo_proceso?.trim() || null,
      estado_procesal: parsed.data.estado_procesal?.trim() || null,
      client_id: parsed.data.client_id,
      parte_contraria: parsed.data.parte_contraria?.trim() || null,
      organo_jurisdiccional: parsed.data.organo_jurisdiccional?.trim() || null,
      abogado_responsable_id: parsed.data.abogado_responsable_id,
      fecha_inicio: parsed.data.fecha_inicio,
      proxima_actuacion: parsed.data.proxima_actuacion || null,
      observaciones: parsed.data.observaciones?.trim() || null,
    };

    const { data: inserted, error } = await supabase
      .from('legal_cases')
      .insert(cleanData)
      .select('id, numero_interno')
      .single();

    if (error) {
      console.error('Error creating case:', error);
      return { success: false, error: 'No se pudo crear el expediente' };
    }

    revalidatePath('/legal/cases');
    return {
      success: true,
      message: `Expediente ${inserted.numero_interno} creado`,
      caseId: inserted.id,
      numero: inserted.numero_interno,
    };
  } catch (err) {
    console.error('Unexpected error in createCase:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Actualizar un expediente existente
 */
export async function updateCase(
  id: string,
  data: CaseFormData
): Promise<ActionResult> {
  try {
    await requireVertical('legal');

    const parsed = caseSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    const cleanData = {
      numero_judicial: parsed.data.numero_judicial?.trim() || null,
      materia: parsed.data.materia,
      tipo_proceso: parsed.data.tipo_proceso?.trim() || null,
      estado_procesal: parsed.data.estado_procesal?.trim() || null,
      client_id: parsed.data.client_id,
      parte_contraria: parsed.data.parte_contraria?.trim() || null,
      organo_jurisdiccional: parsed.data.organo_jurisdiccional?.trim() || null,
      abogado_responsable_id: parsed.data.abogado_responsable_id,
      fecha_inicio: parsed.data.fecha_inicio,
      proxima_actuacion: parsed.data.proxima_actuacion || null,
      observaciones: parsed.data.observaciones?.trim() || null,
    };

    const { error } = await supabase
      .from('legal_cases')
      .update(cleanData)
      .eq('id', id);

    if (error) {
      console.error('Error updating case:', error);
      return { success: false, error: 'No se pudo actualizar el expediente' };
    }

    revalidatePath('/legal/cases');
    return { success: true, message: 'Expediente actualizado' };
  } catch (err) {
    console.error('Unexpected error in updateCase:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Archivar un expediente (no se borra, se marca archivado=true)
 */
export async function archiveCase(id: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from('legal_cases')
      .update({ archivado: true })
      .eq('id', id);

    if (error) {
      return { success: false, error: 'No se pudo archivar el expediente' };
    }

    revalidatePath('/legal/cases');
    return { success: true, message: 'Expediente archivado' };
  } catch (err) {
    console.error('Unexpected error in archiveCase:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Reactivar un expediente archivado
 */
export async function unarchiveCase(id: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from('legal_cases')
      .update({ archivado: false })
      .eq('id', id);

    if (error) {
      return { success: false, error: 'No se pudo reactivar el expediente' };
    }

    revalidatePath('/legal/cases');
    return { success: true, message: 'Expediente reactivado' };
  } catch (err) {
    console.error('Unexpected error in unarchiveCase:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Eliminar un expediente (SOLO si no tiene datos asociados)
 * Usar con precaución. Preferir archiveCase en la mayoría de casos.
 */
export async function deleteCase(id: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    // Contar datos asociados
    const { count: docsCount } = await supabase
      .from('legal_documents')
      .select('*', { count: 'exact', head: true })
      .eq('case_id', id);

    const { count: eventsCount } = await supabase
      .from('legal_events')
      .select('*', { count: 'exact', head: true })
      .eq('case_id', id);

    if ((docsCount ?? 0) > 0 || (eventsCount ?? 0) > 0) {
      return {
        success: false,
        error: `No se puede eliminar: tiene ${docsCount ?? 0} documento(s) y ${eventsCount ?? 0} evento(s). Mejor archívalo.`,
      };
    }

    const { error } = await supabase
      .from('legal_cases')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: 'No se pudo eliminar el expediente' };
    }

    revalidatePath('/legal/cases');
    return { success: true, message: 'Expediente eliminado' };
  } catch (err) {
    console.error('Unexpected error in deleteCase:', err);
    return { success: false, error: 'Error inesperado' };
  }
}