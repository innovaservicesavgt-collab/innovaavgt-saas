'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import { paymentSchema } from './payment-schema';
import {
  ActionResult,
  CreatePaymentInput,
  LegalPaymentWithRelations,
} from './types';
import { createSystemAction } from '@/lib/legal/system-actions';

// ============================================================
// CREAR PAGO
// ============================================================

export async function createPayment(
  input: CreatePaymentInput
): Promise<ActionResult> {
  try {
    const profile = await requireVertical('legal');

    const parsed = paymentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    // Validar que el monto no exceda lo pendiente (si hay cuota asociada)
    if (parsed.data.installment_id) {
      const { data: installment } = await supabase
        .from('legal_fee_installments')
        .select('monto, monto_pagado')
        .eq('id', parsed.data.installment_id)
        .single();

      if (installment) {
        const pendienteCuota =
          Number(installment.monto) - Number(installment.monto_pagado || 0);
        if (parsed.data.monto > pendienteCuota + 0.01) {
          return {
            success: false,
            error: `El monto excede el pendiente de la cuota (${pendienteCuota.toFixed(
              2
            )})`,
          };
        }
      }
    }

    // Insertar el pago
    const { data: payment, error: insertError } = await supabase
      .from('legal_payments')
      .insert({
        tenant_id: profile.tenant_id,
        case_id: parsed.data.case_id,
        installment_id: parsed.data.installment_id || null,
        monto: parsed.data.monto,
        moneda: parsed.data.moneda,
        fecha_pago: parsed.data.fecha_pago,
        metodo: parsed.data.metodo,
        referencia: parsed.data.referencia?.trim() || null,
        notas: parsed.data.notas?.trim() || null,
        created_by: profile.id,
      })
      .select('id')
      .single();

    if (insertError || !payment) {
      console.error('Error creating payment:', insertError);
      return { success: false, error: 'No se pudo registrar el pago' };
    }

    // Actualizar cuota si aplica
    if (parsed.data.installment_id) {
      await recalculateInstallmentStatus(parsed.data.installment_id);
    }

    // Recalcular estado del acuerdo
    await recalculateAgreementStatus(parsed.data.case_id);

    // Crear actuación automática en la bitácora
    await createSystemAction({
      tenantId: profile.tenant_id,
      caseId: parsed.data.case_id,
      tipo: 'OTRO',
      descripcion: `💰 Pago recibido: ${parsed.data.monto.toFixed(2)} ${
        parsed.data.moneda
      } (${parsed.data.metodo})`,
      profileId: profile.id,
    });

    revalidatePath(`/legal/cases/${parsed.data.case_id}`);

    return {
      success: true,
      message: 'Pago registrado exitosamente',
    };
  } catch (err) {
    console.error('Unexpected error in createPayment:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================================
// ACTUALIZAR PAGO
// ============================================================

export async function updatePayment(
  paymentId: string,
  input: CreatePaymentInput
): Promise<ActionResult> {
  try {
    await requireVertical('legal');

    const parsed = paymentSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
      };
    }

    const supabase = await createServerSupabase();

    // Obtener el pago actual para saber qué cuota tenía
    const { data: oldPayment } = await supabase
      .from('legal_payments')
      .select('installment_id, case_id')
      .eq('id', paymentId)
      .single();

    if (!oldPayment) {
      return { success: false, error: 'Pago no encontrado' };
    }

    // Actualizar
    const { error: updateError } = await supabase
      .from('legal_payments')
      .update({
        installment_id: parsed.data.installment_id || null,
        monto: parsed.data.monto,
        moneda: parsed.data.moneda,
        fecha_pago: parsed.data.fecha_pago,
        metodo: parsed.data.metodo,
        referencia: parsed.data.referencia?.trim() || null,
        notas: parsed.data.notas?.trim() || null,
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return { success: false, error: 'No se pudo actualizar el pago' };
    }

    // Recalcular ambas cuotas (la vieja y la nueva si cambió)
    if (oldPayment.installment_id) {
      await recalculateInstallmentStatus(oldPayment.installment_id);
    }
    if (
      parsed.data.installment_id &&
      parsed.data.installment_id !== oldPayment.installment_id
    ) {
      await recalculateInstallmentStatus(parsed.data.installment_id);
    }

    await recalculateAgreementStatus(oldPayment.case_id);

    revalidatePath(`/legal/cases/${oldPayment.case_id}`);

    return { success: true, message: 'Pago actualizado' };
  } catch (err) {
    console.error('Unexpected error in updatePayment:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================================
// ELIMINAR PAGO
// ============================================================

export async function deletePayment(paymentId: string): Promise<ActionResult> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data: payment } = await supabase
      .from('legal_payments')
      .select('case_id, installment_id')
      .eq('id', paymentId)
      .single();

    if (!payment) {
      return { success: false, error: 'Pago no encontrado' };
    }

    const { error } = await supabase
      .from('legal_payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      return { success: false, error: 'No se pudo eliminar el pago' };
    }

    // Recalcular
    if (payment.installment_id) {
      await recalculateInstallmentStatus(payment.installment_id);
    }
    await recalculateAgreementStatus(payment.case_id);

    revalidatePath(`/legal/cases/${payment.case_id}`);

    return { success: true, message: 'Pago eliminado' };
  } catch (err) {
    console.error('Unexpected error in deletePayment:', err);
    return { success: false, error: 'Error inesperado' };
  }
}

// ============================================================
// OBTENER PAGOS DE UN EXPEDIENTE
// ============================================================

export async function getPaymentsByCase(
  caseId: string
): Promise<LegalPaymentWithRelations[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    const { data } = await supabase
      .from('legal_payments')
      .select(`
        *,
        installment:legal_fee_installments (numero, concepto),
        created_by_profile:profiles!created_by (first_name, last_name)
      `)
      .eq('case_id', caseId)
      .order('fecha_pago', { ascending: false })
      .order('created_at', { ascending: false });

    return (data as unknown as LegalPaymentWithRelations[]) || [];
  } catch (err) {
    console.error('Unexpected error in getPaymentsByCase:', err);
    return [];
  }
}

// ============================================================
// HELPERS INTERNOS
// ============================================================

/**
 * Recalcula estado y monto_pagado de una cuota.
 * Se llama cuando se crea/edita/elimina un pago.
 */
async function recalculateInstallmentStatus(installmentId: string): Promise<void> {
  const supabase = await createServerSupabase();

  // Traer info de la cuota
  const { data: installment } = await supabase
    .from('legal_fee_installments')
    .select('monto, fecha_vencimiento')
    .eq('id', installmentId)
    .single();

  if (!installment) return;

  // Sumar todos los pagos de esta cuota
  const { data: payments } = await supabase
    .from('legal_payments')
    .select('monto')
    .eq('installment_id', installmentId);

  const montoPagado = (payments || []).reduce(
    (acc, p) => acc + Number(p.monto),
    0
  );

  const montoTotal = Number(installment.monto);
  const vencida = new Date(installment.fecha_vencimiento) < new Date();

  let nuevoEstado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'PARCIAL';

  if (montoPagado >= montoTotal - 0.01) {
    nuevoEstado = 'PAGADA';
  } else if (montoPagado > 0) {
    nuevoEstado = 'PARCIAL';
  } else if (vencida) {
    nuevoEstado = 'VENCIDA';
  } else {
    nuevoEstado = 'PENDIENTE';
  }

  await supabase
    .from('legal_fee_installments')
    .update({
      monto_pagado: montoPagado,
      estado: nuevoEstado,
      updated_at: new Date().toISOString(),
    })
    .eq('id', installmentId);
}

/**
 * Recalcula estado del acuerdo basado en todas sus cuotas.
 * Para modalidad UNICO: marca PAGADO si la suma de pagos >= monto_total.
 */
async function recalculateAgreementStatus(caseId: string): Promise<void> {
  const supabase = await createServerSupabase();

  // Traer el acuerdo
  const { data: agreement } = await supabase
    .from('legal_fee_agreements')
    .select('id, monto_total, modalidad')
    .eq('case_id', caseId)
    .maybeSingle();

  if (!agreement) return;

  // Sumar TODOS los pagos del expediente
  const { data: payments } = await supabase
    .from('legal_payments')
    .select('monto')
    .eq('case_id', caseId);

  const totalPagado = (payments || []).reduce(
    (acc, p) => acc + Number(p.monto),
    0
  );

  const montoTotal = Number(agreement.monto_total);

  let nuevoEstado: 'VIGENTE' | 'PAGADO' | 'MORA' | 'CANCELADO';

  if (totalPagado >= montoTotal - 0.01) {
    nuevoEstado = 'PAGADO';
  } else {
    // Verificar si hay cuotas vencidas
    if (agreement.modalidad !== 'UNICO') {
      const { count: vencidasCount } = await supabase
        .from('legal_fee_installments')
        .select('id', { count: 'exact', head: true })
        .eq('agreement_id', agreement.id)
        .in('estado', ['VENCIDA', 'PARCIAL']);

      nuevoEstado = vencidasCount && vencidasCount > 0 ? 'MORA' : 'VIGENTE';
    } else {
      nuevoEstado = 'VIGENTE';
    }
  }

  await supabase
    .from('legal_fee_agreements')
    .update({
      estado: nuevoEstado,
      updated_at: new Date().toISOString(),
    })
    .eq('id', agreement.id);
}