'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import { feeAgreementSchema } from './schema';
import {
  ActionResult,
  CreateAgreementInput,
  FeeAgreementWithInstallments,
  LegalFeeAgreement,
  LegalFeeInstallment,
  AgreementStats,
} from './types';

// ============================================================
// CREAR O ACTUALIZAR ACUERDO DE HONORARIOS
// ============================================================

/**
 * Crea un nuevo acuerdo de honorarios.
 * Si ya existe uno para el expediente, devuelve error (usar updateAgreement).
 */
export async function createAgreement(
  input: CreateAgreementInput
): Promise<ActionResult> {
  try {
    const profile = await requireVertical('legal');

    const parsed = feeAgreementSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    // Verificar que no exista acuerdo previo
    const { data: existing } = await supabase
      .from('legal_fee_agreements')
      .select('id')
      .eq('case_id', parsed.data.case_id)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: 'Este expediente ya tiene un acuerdo de honorarios. Edítalo en su lugar.',
      };
    }

    // Crear el acuerdo
    const { data: agreement, error: agreementError } = await supabase
      .from('legal_fee_agreements')
      .insert({
        tenant_id: profile.tenant_id,
        case_id: parsed.data.case_id,
        monto_total: parsed.data.monto_total,
        moneda: parsed.data.moneda,
        modalidad: parsed.data.modalidad,
        numero_cuotas:
          parsed.data.modalidad === 'UNICO' ? null : parsed.data.numero_cuotas,
        notas: parsed.data.notas?.trim() || null,
        fecha_acuerdo: parsed.data.fecha_acuerdo,
        created_by: profile.id,
        estado: 'VIGENTE',
      })
      .select('id')
      .single();

    if (agreementError || !agreement) {
      console.error('Error creating agreement:', agreementError);
      return {
        success: false,
        error: 'No se pudo crear el acuerdo de honorarios',
      };
    }

    // Insertar cuotas si aplica
    if (
      parsed.data.modalidad !== 'UNICO' &&
      parsed.data.installments &&
      parsed.data.installments.length > 0
    ) {
      const installmentsData = parsed.data.installments.map((inst) => ({
        tenant_id: profile.tenant_id,
        agreement_id: agreement.id,
        numero: inst.numero,
        concepto: inst.concepto?.trim() || null,
        monto: inst.monto,
        fecha_vencimiento: inst.fecha_vencimiento,
        estado: 'PENDIENTE' as const,
      }));

      const { error: instError } = await supabase
        .from('legal_fee_installments')
        .insert(installmentsData);

      if (instError) {
        // Rollback manual
        await supabase.from('legal_fee_agreements').delete().eq('id', agreement.id);
        console.error('Error creating installments:', instError);
        return {
          success: false,
          error: 'No se pudieron crear las cuotas',
        };
      }
    }

    revalidatePath(`/legal/cases/${parsed.data.case_id}`);

    return {
      success: true,
      message: 'Acuerdo de honorarios creado',
      agreementId: agreement.id,
    };
  } catch (err) {
    console.error('Unexpected error in createAgreement:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Actualiza un acuerdo existente.
 * Estrategia: borra las cuotas antiguas y crea nuevas (siempre que no tengan pagos).
 */
export async function updateAgreement(
  agreementId: string,
  input: CreateAgreementInput
): Promise<ActionResult> {
  try {
    const profile = await requireVertical('legal');

    const parsed = feeAgreementSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    // Verificar que no hay pagos asociados a cuotas
    const { data: paymentsLinked } = await supabase
      .from('legal_payments')
      .select('id')
      .eq('case_id', parsed.data.case_id)
      .not('installment_id', 'is', null)
      .limit(1);

    const hasPayments = !!(paymentsLinked && paymentsLinked.length > 0);

    if (hasPayments) {
      return {
        success: false,
        error:
          'No se puede modificar la estructura porque ya hay pagos registrados. Solo puedes editar notas.',
      };
    }

    // Actualizar el acuerdo
    const { error: updateError } = await supabase
      .from('legal_fee_agreements')
      .update({
        monto_total: parsed.data.monto_total,
        moneda: parsed.data.moneda,
        modalidad: parsed.data.modalidad,
        numero_cuotas:
          parsed.data.modalidad === 'UNICO' ? null : parsed.data.numero_cuotas,
        notas: parsed.data.notas?.trim() || null,
        fecha_acuerdo: parsed.data.fecha_acuerdo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agreementId);

    if (updateError) {
      console.error('Error updating agreement:', updateError);
      return { success: false, error: 'No se pudo actualizar el acuerdo' };
    }

    // Borrar cuotas anteriores
    await supabase
      .from('legal_fee_installments')
      .delete()
      .eq('agreement_id', agreementId);

    // Crear cuotas nuevas si aplica
    if (
      parsed.data.modalidad !== 'UNICO' &&
      parsed.data.installments &&
      parsed.data.installments.length > 0
    ) {
      const installmentsData = parsed.data.installments.map((inst) => ({
        tenant_id: profile.tenant_id,
        agreement_id: agreementId,
        numero: inst.numero,
        concepto: inst.concepto?.trim() || null,
        monto: inst.monto,
        fecha_vencimiento: inst.fecha_vencimiento,
        estado: 'PENDIENTE' as const,
      }));

      const { error: instError } = await supabase
        .from('legal_fee_installments')
        .insert(installmentsData);

      if (instError) {
        console.error('Error updating installments:', instError);
        return { success: false, error: 'No se pudieron actualizar las cuotas' };
      }
    }

    revalidatePath(`/legal/cases/${parsed.data.case_id}`);

    return {
      success: true,
      message: 'Acuerdo actualizado',
    };
  } catch (err) {
    console.error('Unexpected error in updateAgreement:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

/**
 * Eliminar acuerdo (solo si no tiene pagos).
 */
export async function deleteAgreement(
  agreementId: string
): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    // Obtener case_id antes de borrar
    const { data: agreement } = await supabase
      .from('legal_fee_agreements')
      .select('case_id')
      .eq('id', agreementId)
      .single();

    if (!agreement) {
      return { success: false, error: 'Acuerdo no encontrado' };
    }

    // Verificar que no hay pagos
    const { count } = await supabase
      .from('legal_payments')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', agreement.case_id);

    if (count && count > 0) {
      return {
        success: false,
        error: 'No se puede eliminar porque ya tiene pagos registrados',
      };
    }

    // Borrar (CASCADE se encarga de las cuotas)
    const { error } = await supabase
      .from('legal_fee_agreements')
      .delete()
      .eq('id', agreementId);

    if (error) {
      return { success: false, error: 'No se pudo eliminar el acuerdo' };
    }

    revalidatePath(`/legal/cases/${agreement.case_id}`);

    return { success: true, message: 'Acuerdo eliminado' };
  } catch (err) {
    console.error('Unexpected error in deleteAgreement:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================================
// LECTURA: obtener acuerdo con cuotas y stats
// ============================================================

/**
 * Obtiene el acuerdo de honorarios de un expediente con sus cuotas
 * y estadísticas calculadas.
 */
export async function getAgreementByCase(
  caseId: string
): Promise<FeeAgreementWithInstallments | null> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    // Traer el acuerdo
    const { data: agreement } = await supabase
      .from('legal_fee_agreements')
      .select('*')
      .eq('case_id', caseId)
      .maybeSingle();

    if (!agreement) return null;

    // Traer cuotas
    const { data: installments } = await supabase
      .from('legal_fee_installments')
      .select('*')
      .eq('agreement_id', agreement.id)
      .order('numero', { ascending: true });

    const installmentsList = (installments as LegalFeeInstallment[]) || [];

    // Calcular stats
    const stats = calculateStats(agreement as LegalFeeAgreement, installmentsList);

    return {
      ...(agreement as LegalFeeAgreement),
      installments: installmentsList,
      stats,
    };
  } catch (err) {
    console.error('Unexpected error in getAgreementByCase:', err);
    return null;
  }
}

// ============================================================
// HELPERS
// ============================================================

function calculateStats(
  agreement: LegalFeeAgreement,
  installments: LegalFeeInstallment[]
): AgreementStats {
  const ahora = new Date();

  // Para pago único: el acuerdo mismo es la "cuota"
  if (agreement.modalidad === 'UNICO') {
    const totalPagado = agreement.estado === 'PAGADO' ? agreement.monto_total : 0;
    return {
      totalPagado,
      totalPendiente: agreement.monto_total - totalPagado,
      porcentajePagado:
        agreement.monto_total > 0 ? (totalPagado / agreement.monto_total) * 100 : 0,
      cuotasPagadas: agreement.estado === 'PAGADO' ? 1 : 0,
      cuotasPendientes: agreement.estado === 'PAGADO' ? 0 : 1,
      cuotasVencidas: 0,
      proximaCuota: null,
    };
  }

  // Para CUOTAS y POR_ETAPA
  let totalPagado = 0;
  let cuotasPagadas = 0;
  let cuotasPendientes = 0;
  let cuotasVencidas = 0;
  let proximaCuota: LegalFeeInstallment | null = null;

  for (const inst of installments) {
    totalPagado += Number(inst.monto_pagado || 0);

    if (inst.estado === 'PAGADA') {
      cuotasPagadas++;
    } else {
      cuotasPendientes++;
      const venc = new Date(inst.fecha_vencimiento);
      if (venc < ahora && inst.estado !== 'PAGADA') {
        cuotasVencidas++;
      }
      // La próxima cuota es la más cercana sin pagar
      if (!proximaCuota || venc < new Date(proximaCuota.fecha_vencimiento)) {
        proximaCuota = inst;
      }
    }
  }

  const totalPendiente = Number(agreement.monto_total) - totalPagado;
  const porcentajePagado =
    Number(agreement.monto_total) > 0
      ? (totalPagado / Number(agreement.monto_total)) * 100
      : 0;

  return {
    totalPagado,
    totalPendiente: Math.max(0, totalPendiente),
    porcentajePagado: Math.min(100, porcentajePagado),
    cuotasPagadas,
    cuotasPendientes,
    cuotasVencidas,
    proximaCuota,
  };
}