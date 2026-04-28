// Tipos del plan de tratamiento

export type TreatmentPlanStatus = 'active' | 'completed' | 'cancelled' | 'paused';
export type PaymentTerms = 'full' | 'installments';
export type InstallmentFrequency = 'weekly' | 'biweekly' | 'monthly';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';
export type ScheduleStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export type TreatmentPlan = {
  id: string;
  tenant_id: string;
  patient_id: string;
  quotation_id: string | null;
  professional_id: string | null;
  title: string;
  description: string | null;
  total_amount: number;
  discount_amount: number | null;
  final_amount: number;
  paid_amount: number | null;
  payment_terms: PaymentTerms;
  num_installments: number | null;
  installment_frequency: InstallmentFrequency | null;
  installment_amount: number | null;
  payment_method: PaymentMethod | null;
  start_date: string | null;
  expected_end_date: string | null;
  status: TreatmentPlanStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PaymentSchedule = {
  id: string;
  treatment_plan_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  amount_paid: number | null;
  status: ScheduleStatus;
  paid_at: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const PLAN_STATUS_CONFIG: Record<
  TreatmentPlanStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  active: {
    label: 'Activo',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  completed: {
    label: 'Completado',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  paused: {
    label: 'Pausado',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
};

export const SCHEDULE_STATUS_CONFIG: Record<
  ScheduleStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: 'Pendiente',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
  paid: {
    label: 'Pagada',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  partial: {
    label: 'Pago parcial',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  overdue: {
    label: 'Vencida',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  cancelled: {
    label: 'Cancelada',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
};
