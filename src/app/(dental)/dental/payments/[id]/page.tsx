import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/tenant';
import { PaymentReceipt } from '@/components/payments/payment-receipt';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PaymentReceiptPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile?.tenant) return null;
  const supabase = await createServerSupabase();

  // Cargar el pago
  const { data: payment, error } = await supabase
    .from('payments')
    .select('*, patients (id, first_name, last_name, phone, email, document_number, address)')
    .eq('id', id)
    .eq('tenant_id', profile.tenant.id)
    .single();

  if (error || !payment) notFound();

  // Cargar el plan asociado (si existe)
  let plan = null;
  if (payment.treatment_plan_id) {
    const { data: planData } = await supabase
      .from('treatment_plans')
      .select('id, title, final_amount, paid_amount, num_installments')
      .eq('id', payment.treatment_plan_id)
      .single();
    plan = planData;
  }

  // Cargar la cuota asociada (si existe)
  let schedule = null;
  if (payment.payment_schedule_id) {
    const { data: schedData } = await supabase
      .from('payment_schedules')
      .select('id, installment_number, due_date, amount, amount_paid, status')
      .eq('id', payment.payment_schedule_id)
      .single();
    schedule = schedData;
  }

  // Cargar todos los pagos previos del mismo plan para calcular acumulado
  let allPlanPayments: { amount: number; status: string | null }[] = [];
  if (payment.treatment_plan_id) {
    const { data: pays } = await supabase
      .from('payments')
      .select('amount, status, paid_at')
      .eq('treatment_plan_id', payment.treatment_plan_id)
      .eq('tenant_id', profile.tenant.id)
      .lte('paid_at', payment.paid_at || new Date().toISOString())
      .order('paid_at', { ascending: true });
    allPlanPayments = (pays || []) as { amount: number; status: string | null }[];
  }

  const accumulated = allPlanPayments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <PaymentReceipt
      payment={payment as unknown as never}
      plan={plan as unknown as never}
      schedule={schedule as unknown as never}
      accumulated={accumulated}
      tenantName={profile.tenant.brand_name || profile.tenant.name || 'Clinica'}
      tenantPhone={null}
      tenantAddress={null}
      cashierName={'Cajero'}
    />
  );
}
