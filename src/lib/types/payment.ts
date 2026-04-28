// Tipos de pagos

export type PaymentStatus = 'paid' | 'void' | 'pending';
export type PaymentMethodType = 'cash' | 'card' | 'transfer' | 'mixed';

export type Payment = {
  id: string;
  tenant_id: string;
  patient_id: string;
  appointment_id: string | null;
  treatment_id: string | null;
  treatment_plan_id: string | null;
  payment_schedule_id: string | null;
  amount: number;
  payment_method: PaymentMethodType | null;
  status: PaymentStatus | null;
  notes: string | null;
  receipt_number: string | null;
  reference_number: string | null;
  receipt_url: string | null;
  created_by: string | null;
  paid_at: string | null;
  created_at: string | null;
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethodType, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  mixed: 'Mixto',
};

export function paymentMethodLabel(m: string | null): string {
  if (!m) return '-';
  return PAYMENT_METHOD_LABEL[m as PaymentMethodType] || m;
}
