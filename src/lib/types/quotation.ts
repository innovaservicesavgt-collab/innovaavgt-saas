// Tipos de cotizacion

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type DiscountType = 'percent' | 'amount';

export type Quotation = {
  id: string;
  tenant_id: string;
  patient_id: string;
  quotation_number: string | null;
  status: QuotationStatus;
  notes: string | null;
  subtotal: number | null;
  discount_type: DiscountType | null;
  discount_value: number | null;
  discount_percent: number | null;
  discount_amount: number | null;
  total: number | null;
  total_amount: number | null;
  valid_until: string | null;
  terms: string | null;
  internal_notes: string | null;
  issued_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  treatment_plan_id: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type QuotationItem = {
  id: string;
  quotation_id: string;
  service_id: string | null;
  description: string;
  quantity: number | null;
  unit_price: number;
  total: number;
  tooth_numbers: string[] | null;
  notes: string | null;
  sort_order: number | null;
};

export type QuotationWithPatient = Quotation & {
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  } | null;
  items_count: number;
};

// Helper: extraer titulo y descripcion del campo notes (formato: 'TITULO\n\nDescripcion')
export function parseQuotationNotes(notes: string | null): { title: string; description: string } {
  if (!notes) return { title: 'Sin titulo', description: '' };
  const parts = notes.split('\n\n');
  const title = parts[0] || 'Sin titulo';
  const description = parts.slice(1).join('\n\n');
  return { title, description };
}

// Configuracion visual de estados
export const QUOTATION_STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  draft: {
    label: 'Borrador',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
  sent: {
    label: 'Enviada',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  accepted: {
    label: 'Aceptada',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  rejected: {
    label: 'Rechazada',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  expired: {
    label: 'Vencida',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  cancelled: {
    label: 'Cancelada',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
};

export function getStatusConfig(status: string | null) {
  if (!status) return QUOTATION_STATUS_CONFIG.draft;
  return (
    QUOTATION_STATUS_CONFIG[status as QuotationStatus] ||
    QUOTATION_STATUS_CONFIG.draft
  );
}
