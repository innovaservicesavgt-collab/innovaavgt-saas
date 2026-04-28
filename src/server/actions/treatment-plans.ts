'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { calculateInstallments } from '@/lib/installments';

// ─── Schemas ─────────────────────────────────────────────
const acceptQuotationSchema = z.object({
  quotation_id: z.string().uuid(),
  payment_terms: z.enum(['full', 'installments']),
  num_installments: z.number().int().min(1).max(36).optional(),
  installment_frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
  start_date: z.string().min(1),
  initial_payment: z.number().min(0).optional().nullable(),
  payment_method: z.enum(['cash', 'card', 'transfer', 'mixed']).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type AcceptQuotationInput = z.input<typeof acceptQuotationSchema>;

// ─── acceptQuotationAndCreatePlan ────────────────────────
export async function acceptQuotationAndCreatePlan(
  input: AcceptQuotationInput
) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = acceptQuotationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || 'Datos invalidos',
    };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  // 1. Cargar la cotizacion
  const { data: quotation, error: qError } = await supabase
    .from('quotations')
    .select('id, tenant_id, patient_id, total_amount, total, notes, status, treatment_plan_id')
    .eq('id', data.quotation_id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (qError || !quotation) {
    return { ok: false as const, error: 'Cotizacion no encontrada' };
  }

  if (quotation.status === 'accepted' && quotation.treatment_plan_id) {
    return {
      ok: false as const,
      error: 'Esta cotizacion ya fue aceptada',
    };
  }

  // 2. Extraer titulo y descripcion del campo notes (formato: TITULO\n\nDescripcion)
  const notesText = (quotation.notes as string) || 'Plan de tratamiento';
  const parts = notesText.split('\n\n');
  const title = parts[0] || 'Plan de tratamiento';
  const description = parts.slice(1).join('\n\n') || null;

  // 3. Calcular monto final
  const finalAmount = Number(quotation.total_amount || quotation.total || 0);
  if (finalAmount <= 0) {
    return { ok: false as const, error: 'La cotizacion tiene total cero' };
  }

  // 4. Calcular cuotas si aplica
  let installments: { number: number; due_date: string; amount: number }[] = [];
  let installmentAmount: number | null = null;
  let expectedEndDate: string | null = null;

  if (data.payment_terms === 'installments') {
    if (!data.num_installments || !data.installment_frequency) {
      return {
        ok: false as const,
        error: 'Faltan datos de las cuotas',
      };
    }

    installments = calculateInstallments({
      total: finalAmount,
      numInstallments: data.num_installments,
      frequency: data.installment_frequency,
      startDate: data.start_date,
      initialPayment: data.initial_payment || undefined,
    });

    if (installments.length === 0) {
      return { ok: false as const, error: 'Error al calcular cuotas' };
    }

    installmentAmount = installments[1]?.amount || installments[0]?.amount || null;
    expectedEndDate = installments[installments.length - 1].due_date;
  } else {
    // Pago unico
    installments = [
      {
        number: 1,
        due_date: data.start_date,
        amount: finalAmount,
      },
    ];
    installmentAmount = finalAmount;
    expectedEndDate = data.start_date;
  }

  // 5. Crear el plan de tratamiento
  const planPayload: Record<string, unknown> = {
    tenant_id: profile.tenant.id,
    patient_id: quotation.patient_id,
    quotation_id: quotation.id,
    title,
    total_amount: finalAmount,
    discount_amount: 0,
    final_amount: finalAmount,
    paid_amount: 0,
    payment_terms: data.payment_terms,
    num_installments: installments.length,
    start_date: data.start_date,
    status: 'active',
  };

  if (description) planPayload.description = description;
  if (data.payment_terms === 'installments') {
    planPayload.installment_frequency = data.installment_frequency;
    if (installmentAmount !== null) planPayload.installment_amount = installmentAmount;
  }
  if (expectedEndDate) planPayload.expected_end_date = expectedEndDate;
  if (data.payment_method) planPayload.payment_method = data.payment_method;
  if (data.notes) planPayload.notes = data.notes;

  console.log('[acceptQuotation] plan payload:', planPayload);

  const { data: createdPlan, error: planError } = await supabase
    .from('treatment_plans')
    .insert(planPayload)
    .select('id')
    .single();

  if (planError || !createdPlan) {
    console.error('[acceptQuotation] plan error:', planError);
    return {
      ok: false as const,
      error: 'Error al crear plan: ' + (planError?.message || ''),
    };
  }

  // 6. Crear las cuotas en payment_schedules
  const schedulesToInsert = installments.map((inst) => ({
    treatment_plan_id: createdPlan.id,
    installment_number: inst.number,
    due_date: inst.due_date,
    amount: inst.amount,
    amount_paid: 0,
    status: 'pending',
  }));

  const { error: schedError } = await supabase
    .from('payment_schedules')
    .insert(schedulesToInsert);

  if (schedError) {
    console.error('[acceptQuotation] schedules error:', schedError);
    // Rollback: borrar el plan creado
    await supabase.from('treatment_plans').delete().eq('id', createdPlan.id);
    return {
      ok: false as const,
      error: 'Error al crear cuotas: ' + schedError.message,
    };
  }

  // 7. Marcar cotizacion como aceptada y vincular el plan
  const { error: updError } = await supabase
    .from('quotations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      treatment_plan_id: createdPlan.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quotation.id)
    .eq('tenant_id', profile.tenant.id);

  if (updError) {
    console.error('[acceptQuotation] update quotation error:', updError);
    // No es fatal, el plan ya esta creado
  }

  revalidatePath('/dental/quotations');
  revalidatePath('/dental/quotations/' + quotation.id);
  revalidatePath('/dental/treatments');
  revalidatePath('/dental/dashboard');

  return {
    ok: true as const,
    plan_id: createdPlan.id as string,
    schedules_count: installments.length,
  };
}
