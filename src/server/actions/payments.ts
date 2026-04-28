'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';

// ─── Schemas ─────────────────────────────────────────────
const registerPaymentSchema = z.object({
  treatment_plan_id: z.string().uuid(),
  payment_schedule_id: z.string().uuid(),
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  payment_method: z.enum(['cash', 'card', 'transfer', 'mixed']),
  paid_at: z.string().min(1),
  reference_number: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type RegisterPaymentInput = z.input<typeof registerPaymentSchema>;

const voidPaymentSchema = z.object({
  payment_id: z.string().uuid(),
  reason: z.string().max(500).optional().nullable(),
});

// ─── Helpers ─────────────────────────────────────────────
function clean(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

// ─── registerPayment ─────────────────────────────────────
export async function registerPayment(input: RegisterPaymentInput) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = registerPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message || 'Datos invalidos',
    };
  }

  const data = parsed.data;
  const supabase = await createServerSupabase();

  // 1. Verificar que el plan existe y obtener patient_id
  const { data: plan, error: planError } = await supabase
    .from('treatment_plans')
    .select('id, tenant_id, patient_id, final_amount, paid_amount, status')
    .eq('id', data.treatment_plan_id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (planError || !plan) {
    return { ok: false as const, error: 'Plan no encontrado' };
  }

  // 2. Verificar la cuota
  const { data: schedule, error: schedError } = await supabase
    .from('payment_schedules')
    .select('id, treatment_plan_id, amount, amount_paid, status, installment_number')
    .eq('id', data.payment_schedule_id)
    .eq('treatment_plan_id', data.treatment_plan_id)
    .single();

  if (schedError || !schedule) {
    return { ok: false as const, error: 'Cuota no encontrada' };
  }

  if (schedule.status === 'paid') {
    return { ok: false as const, error: 'Esta cuota ya esta pagada' };
  }

  if (schedule.status === 'cancelled') {
    return { ok: false as const, error: 'Esta cuota fue cancelada' };
  }

  // 3. Validar que no se pague mas que el saldo de la cuota
  const remainingOnSchedule = Number(schedule.amount) - Number(schedule.amount_paid || 0);
  if (data.amount > remainingOnSchedule + 0.01) {
    return {
      ok: false as const,
      error: 'El monto excede el saldo de la cuota (Q' + remainingOnSchedule.toFixed(2) + ')',
    };
  }

  // 4. Generar numero de recibo
  const { data: receiptData } = await supabase.rpc('generate_receipt_number', {
    p_tenant_id: profile.tenant.id,
  });
  const receiptNumber = (receiptData as string | null) || null;

  // 5. Insertar pago
  const paymentPayload: Record<string, unknown> = {
    tenant_id: profile.tenant.id,
    patient_id: plan.patient_id,
    treatment_plan_id: plan.id,
    payment_schedule_id: schedule.id,
    amount: data.amount,
    payment_method: data.payment_method,
    status: 'paid',
    paid_at: new Date(data.paid_at + 'T12:00:00').toISOString(),
  };

  if (receiptNumber) paymentPayload.receipt_number = receiptNumber;
  const cleanRef = clean(data.reference_number);
  if (cleanRef) paymentPayload.reference_number = cleanRef;
  const cleanNotes = clean(data.notes);
  if (cleanNotes) paymentPayload.notes = cleanNotes;

  console.log('[registerPayment] payload:', paymentPayload);

  const { data: created, error: payError } = await supabase
    .from('payments')
    .insert(paymentPayload)
    .select('id, receipt_number')
    .single();

  if (payError || !created) {
    console.error('[registerPayment] insert error:', payError);
    return {
      ok: false as const,
      error: 'Error al registrar pago: ' + (payError?.message || ''),
    };
  }

  // Los triggers SQL actualizan automaticamente:
  // - payment_schedules.amount_paid
  // - payment_schedules.status (paid/partial/pending)
  // - treatment_plans.paid_amount

  revalidatePath('/dental/treatments');
  revalidatePath('/dental/treatments/' + plan.id);
  revalidatePath('/dental/dashboard');

  return {
    ok: true as const,
    payment_id: created.id as string,
    receipt_number: (created.receipt_number as string) || receiptNumber || '',
  };
}

// ─── voidPayment ─────────────────────────────────────────
export async function voidPayment(input: z.input<typeof voidPaymentSchema>) {
  const profile = await getCurrentProfile();
  if (!profile?.tenant) {
    return { ok: false as const, error: 'No autorizado' };
  }

  const parsed = voidPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: 'ID invalido' };
  }

  const supabase = await createServerSupabase();

  // Cargar pago para obtener treatment_plan_id (para revalidar)
  const { data: payment } = await supabase
    .from('payments')
    .select('id, treatment_plan_id, status')
    .eq('id', parsed.data.payment_id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (!payment) {
    return { ok: false as const, error: 'Pago no encontrado' };
  }

  if (payment.status !== 'paid') {
    return { ok: false as const, error: 'Este pago ya esta anulado' };
  }

  // Actualizar status a 'void' (los triggers actualizan los totales)
  const updateData: Record<string, unknown> = {
    status: 'void',
  };
  if (parsed.data.reason) updateData.notes = parsed.data.reason;

  const { error } = await supabase
    .from('payments')
    .update(updateData)
    .eq('id', parsed.data.payment_id)
    .eq('tenant_id', profile.tenant.id);

  if (error) {
    console.error('[voidPayment] error:', error);
    return { ok: false as const, error: 'Error al anular pago: ' + error.message };
  }

  revalidatePath('/dental/treatments');
  if (payment.treatment_plan_id) {
    revalidatePath('/dental/treatments/' + payment.treatment_plan_id);
  }

  return { ok: true as const };
}
