'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import { createSystemAction } from '@/lib/legal/system-actions';
import { eventSchema, EventFormData } from './schema';
import { ActionResult } from './types';


/**
 * Crear un nuevo evento
 */
export async function createEvent(data: EventFormData): Promise<ActionResult> {
  try {
    const profile = await requireVertical('legal');

    const parsed = eventSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    const cleanData = {
      tenant_id: profile.tenant_id,
      case_id: parsed.data.case_id,
      titulo: parsed.data.titulo.trim(),
      descripcion: parsed.data.descripcion?.trim() || null,
      tipo: parsed.data.tipo,
      fecha_hora: parsed.data.fecha_hora,
      duracion_min: parsed.data.duracion_min ?? 60,
      lugar: parsed.data.lugar?.trim() || null,
      created_by: profile.id,
    };

    const { data: inserted, error } = await supabase
      .from('legal_events')
      .insert(cleanData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return { success: false, error: 'No se pudo crear el evento' };
    }

    await actualizarProximaActuacion(parsed.data.case_id);

    revalidatePath('/legal/calendar');
    revalidatePath(`/legal/cases/${parsed.data.case_id}`);
    revalidatePath('/legal/dashboard');

    return {
      success: true,
      message: 'Evento creado',
      eventId: inserted.id,
    };
  } catch (err) {
    console.error('Unexpected error in createEvent:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Actualizar un evento existente
 */
export async function updateEvent(
  id: string,
  data: EventFormData
): Promise<ActionResult> {
  try {
    await requireVertical('legal');

    const parsed = eventSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    const cleanData = {
      case_id: parsed.data.case_id,
      titulo: parsed.data.titulo.trim(),
      descripcion: parsed.data.descripcion?.trim() || null,
      tipo: parsed.data.tipo,
      fecha_hora: parsed.data.fecha_hora,
      duracion_min: parsed.data.duracion_min ?? 60,
      lugar: parsed.data.lugar?.trim() || null,
    };

    const { error } = await supabase
      .from('legal_events')
      .update(cleanData)
      .eq('id', id);

    if (error) {
      console.error('Error updating event:', error);
      return { success: false, error: 'No se pudo actualizar el evento' };
    }

    await actualizarProximaActuacion(parsed.data.case_id);

    revalidatePath('/legal/calendar');
    revalidatePath(`/legal/cases/${parsed.data.case_id}`);
    revalidatePath('/legal/dashboard');

    return { success: true, message: 'Evento actualizado' };
  } catch (err) {
    console.error('Unexpected error in updateEvent:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Marcar un evento como completado + crear actuación automática
 */
export async function completeEvent(id: string): Promise<ActionResult> {
  try {
    const profile = await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data: event, error: fetchError } = await supabase
      .from('legal_events')
      .select('case_id, titulo, tipo, fecha_hora, lugar')
      .eq('id', id)
      .single();

    if (fetchError || !event) {
      return { success: false, error: 'Evento no encontrado' };
    }

    const { error } = await supabase
      .from('legal_events')
      .update({
        completado: true,
        completado_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: 'No se pudo marcar como completado' };
    }

    // Crear actuación automática
   
    let descripcion = `${event.titulo}`;
    if (event.lugar) descripcion += `\n📍 Lugar: ${event.lugar}`;
    descripcion += `\n✓ Completado`;

    await createSystemAction({
      tenantId: profile.tenant_id,
      caseId: event.case_id,
      tipo: 'EVENTO_COMPLETADO',
      descripcion,
      eventId: id,
      profileId: profile.id,
    });

    await supabase
      .from('legal_cases')
      .update({ ultima_actuacion: new Date().toISOString() })
      .eq('id', event.case_id);

    await actualizarProximaActuacion(event.case_id);

    revalidatePath('/legal/calendar');
    revalidatePath(`/legal/cases/${event.case_id}`);
    revalidatePath('/legal/dashboard');
    revalidatePath('/legal/actions');

    return { success: true, message: 'Evento marcado como completado' };
  } catch (err) {
    console.error('Unexpected error in completeEvent:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Reabrir un evento completado
 */
export async function uncompleteEvent(id: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data: event } = await supabase
      .from('legal_events')
      .select('case_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('legal_events')
      .update({
        completado: false,
        completado_at: null,
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: 'No se pudo reabrir el evento' };
    }

    if (event?.case_id) {
      await actualizarProximaActuacion(event.case_id);
      revalidatePath(`/legal/cases/${event.case_id}`);
    }

    revalidatePath('/legal/calendar');
    revalidatePath('/legal/dashboard');

    return { success: true, message: 'Evento reabierto' };
  } catch (err) {
    console.error('Unexpected error in uncompleteEvent:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Eliminar un evento permanentemente
 */
export async function deleteEvent(id: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data: event } = await supabase
      .from('legal_events')
      .select('case_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('legal_events')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: 'No se pudo eliminar el evento' };
    }

    if (event?.case_id) {
      await actualizarProximaActuacion(event.case_id);
      revalidatePath(`/legal/cases/${event.case_id}`);
    }

    revalidatePath('/legal/calendar');
    revalidatePath('/legal/dashboard');

    return { success: true, message: 'Evento eliminado' };
  } catch (err) {
    console.error('Unexpected error in deleteEvent:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Helper: actualiza proxima_actuacion del expediente
 */
async function actualizarProximaActuacion(caseId: string) {
  const supabase = await createServerSupabase();
  const ahora = new Date().toISOString();

  const { data: proximoEvento } = await supabase
    .from('legal_events')
    .select('fecha_hora')
    .eq('case_id', caseId)
    .eq('completado', false)
    .gte('fecha_hora', ahora)
    .order('fecha_hora', { ascending: true })
    .limit(1)
    .maybeSingle();

  await supabase
    .from('legal_cases')
    .update({
      proxima_actuacion: proximoEvento?.fecha_hora ?? null,
    })
    .eq('id', caseId);
}