'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import { clientSchema, ClientFormData } from './schema';
import { ActionResult } from './types';

/**
 * Crear un nuevo cliente legal
 */
export async function createClient(data: ClientFormData): Promise<ActionResult> {
  try {
    // Guard: solo usuarios con vertical=legal
    const profile = await requireVertical('legal');

    // Validar datos
    const parsed = clientSchema.safeParse(data);
    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos' 
      };
    }

    const supabase = await createServerSupabase();

    // Limpiar strings vacíos → null
    const cleanData = {
      nombre: parsed.data.nombre.trim(),
      tipo_persona: parsed.data.tipo_persona,
      dpi: parsed.data.dpi?.trim() || null,
      nit: parsed.data.nit?.trim() || null,
      telefono: parsed.data.telefono?.trim() || null,
      email: parsed.data.email?.trim() || null,
      direccion: parsed.data.direccion?.trim() || null,
      observaciones: parsed.data.observaciones?.trim() || null,
      tenant_id: profile.tenant_id,
      created_by: profile.id,
    };

    const { data: inserted, error } = await supabase
      .from('legal_clients')
      .insert(cleanData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating legal client:', error);
      return { success: false, error: 'No se pudo crear el cliente' };
    }

    revalidatePath('/legal/clients');
    return { 
      success: true, 
      message: 'Cliente creado exitosamente',
      clientId: inserted.id 
    };
  } catch (err) {
    console.error('Unexpected error in createClient:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Actualizar un cliente existente
 */
export async function updateClient(
  id: string, 
  data: ClientFormData
): Promise<ActionResult> {
  try {
    await requireVertical('legal');

    const parsed = clientSchema.safeParse(data);
    if (!parsed.success) {
      return { 
        success: false, 
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos' 
      };
    }

    const supabase = await createServerSupabase();

    const cleanData = {
      nombre: parsed.data.nombre.trim(),
      tipo_persona: parsed.data.tipo_persona,
      dpi: parsed.data.dpi?.trim() || null,
      nit: parsed.data.nit?.trim() || null,
      telefono: parsed.data.telefono?.trim() || null,
      email: parsed.data.email?.trim() || null,
      direccion: parsed.data.direccion?.trim() || null,
      observaciones: parsed.data.observaciones?.trim() || null,
    };

    const { error } = await supabase
      .from('legal_clients')
      .update(cleanData)
      .eq('id', id);

    if (error) {
      console.error('Error updating legal client:', error);
      return { success: false, error: 'No se pudo actualizar el cliente' };
    }

    revalidatePath('/legal/clients');
    return { success: true, message: 'Cliente actualizado' };
  } catch (err) {
    console.error('Unexpected error in updateClient:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Eliminar (soft delete) un cliente
 * No borramos realmente, solo marcamos activo=false
 * Porque puede tener expedientes asociados
 */
export async function deleteClient(id: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    // Verificar si tiene expedientes asociados
    const { count } = await supabase
      .from('legal_cases')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', id);

    if (count && count > 0) {
      // Si tiene expedientes, solo desactivar (soft delete)
      const { error } = await supabase
        .from('legal_clients')
        .update({ activo: false })
        .eq('id', id);

      if (error) {
        return { success: false, error: 'No se pudo desactivar el cliente' };
      }

      revalidatePath('/legal/clients');
      return { 
        success: true, 
        message: `Cliente desactivado (tiene ${count} expediente(s) asociado(s))` 
      };
    }

    // Si no tiene expedientes, borrar completamente
    const { error } = await supabase
      .from('legal_clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting legal client:', error);
      return { success: false, error: 'No se pudo eliminar el cliente' };
    }

    revalidatePath('/legal/clients');
    return { success: true, message: 'Cliente eliminado' };
  } catch (err) {
    console.error('Unexpected error in deleteClient:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Reactivar un cliente desactivado
 */
export async function reactivateClient(id: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from('legal_clients')
      .update({ activo: true })
      .eq('id', id);

    if (error) {
      return { success: false, error: 'No se pudo reactivar el cliente' };
    }

    revalidatePath('/legal/clients');
    return { success: true, message: 'Cliente reactivado' };
  } catch (err) {
    console.error('Unexpected error in reactivateClient:', err);
    return { success: false, error: 'Error inesperado' };
  }
}