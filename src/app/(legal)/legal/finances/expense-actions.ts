'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import { expenseSchema } from './expense-schema';
import type {
  ActionResult,
  CreateExpenseInput,
  LegalExpenseWithRelations,
  TipoGastoCatalog,
} from './types';

// ============================================================
// OBTENER CATÁLOGO DE TIPOS DE GASTO
// ============================================================

export async function getTiposGasto(): Promise<TipoGastoCatalog[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data } = await supabase
      .from('legal_catalog_tipos_gasto')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    return (data as TipoGastoCatalog[]) || [];
  } catch (err) {
    console.error('Error getting tipos de gasto:', err);
    return [];
  }
}

// ============================================================
// CREAR GASTO
// ============================================================

export async function createExpense(
  input: CreateExpenseInput
): Promise<ActionResult> {
  try {
    const profile = await requireVertical('legal');

    const parsed = expenseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    const { error: insertError } = await supabase
      .from('legal_expenses')
      .insert({
        tenant_id: profile.tenant_id,
        case_id: parsed.data.case_id,
        tipo_gasto_id: parsed.data.tipo_gasto_id,
        monto: parsed.data.monto,
        moneda: parsed.data.moneda,
        fecha: parsed.data.fecha,
        descripcion: parsed.data.descripcion?.trim() || null,
        recuperable: parsed.data.recuperable,
        cobrado: parsed.data.cobrado || false,
        fecha_cobrado: parsed.data.cobrado ? parsed.data.fecha_cobrado : null,
        created_by: profile.id,
      });

    if (insertError) {
      console.error('Error creating expense:', insertError);
      return { success: false, error: 'No se pudo registrar el gasto' };
    }

    revalidatePath(`/legal/cases/${parsed.data.case_id}`);

    return {
      success: true,
      message: 'Gasto registrado exitosamente',
    };
  } catch (err) {
    console.error('Unexpected error in createExpense:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================================
// ACTUALIZAR GASTO
// ============================================================

export async function updateExpense(
  expenseId: string,
  input: CreateExpenseInput
): Promise<ActionResult> {
  try {
    await requireVertical('legal');

    const parsed = expenseSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    const { error } = await supabase
      .from('legal_expenses')
      .update({
        tipo_gasto_id: parsed.data.tipo_gasto_id,
        monto: parsed.data.monto,
        moneda: parsed.data.moneda,
        fecha: parsed.data.fecha,
        descripcion: parsed.data.descripcion?.trim() || null,
        recuperable: parsed.data.recuperable,
        cobrado: parsed.data.cobrado || false,
        fecha_cobrado: parsed.data.cobrado ? parsed.data.fecha_cobrado : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', expenseId);

    if (error) {
      console.error('Error updating expense:', error);
      return { success: false, error: 'No se pudo actualizar el gasto' };
    }

    revalidatePath(`/legal/cases/${parsed.data.case_id}`);

    return { success: true, message: 'Gasto actualizado' };
  } catch (err) {
    console.error('Unexpected error in updateExpense:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================================
// ELIMINAR GASTO
// ============================================================

export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data: expense } = await supabase
      .from('legal_expenses')
      .select('case_id')
      .eq('id', expenseId)
      .single();

    if (!expense) {
      return { success: false, error: 'Gasto no encontrado' };
    }

    const { error } = await supabase
      .from('legal_expenses')
      .delete()
      .eq('id', expenseId);

    if (error) {
      return { success: false, error: 'No se pudo eliminar el gasto' };
    }

    revalidatePath(`/legal/cases/${expense.case_id}`);

    return { success: true, message: 'Gasto eliminado' };
  } catch (err) {
    console.error('Unexpected error in deleteExpense:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================================
// MARCAR COMO COBRADO (toggle rápido)
// ============================================================

export async function toggleCobrado(
  expenseId: string,
  cobrado: boolean
): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data: expense } = await supabase
      .from('legal_expenses')
      .select('case_id, recuperable')
      .eq('id', expenseId)
      .single();

    if (!expense) {
      return { success: false, error: 'Gasto no encontrado' };
    }

    if (cobrado && !expense.recuperable) {
      return {
        success: false,
        error: 'Este gasto no es recuperable',
      };
    }

    const hoy = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('legal_expenses')
      .update({
        cobrado,
        fecha_cobrado: cobrado ? hoy : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', expenseId);

    if (error) {
      return { success: false, error: 'No se pudo actualizar el estado' };
    }

    revalidatePath(`/legal/cases/${expense.case_id}`);

    return {
      success: true,
      message: cobrado ? 'Marcado como cobrado' : 'Marcado como pendiente',
    };
  } catch (err) {
    console.error('Unexpected error in toggleCobrado:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================================
// OBTENER GASTOS DE UN EXPEDIENTE
// ============================================================

export async function getExpensesByCase(
  caseId: string
): Promise<LegalExpenseWithRelations[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data } = await supabase
      .from('legal_expenses')
      .select(`
        *,
        tipo_gasto:legal_catalog_tipos_gasto (*),
        created_by_profile:profiles!created_by (first_name, last_name)
      `)
      .eq('case_id', caseId)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    return (data as unknown as LegalExpenseWithRelations[]) || [];
  } catch (err) {
    console.error('Error getting expenses:', err);
    return [];
  }
}