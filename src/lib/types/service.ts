export type Service = {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  currency: string | null;
  category: string | null;
  color: string | null;
  is_active: boolean | null;
  requires_confirmation: boolean | null;
  buffer_minutes: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export const DENTAL_CATEGORIES = [
  { value: 'diagnostico', label: 'Diagnóstico', color: '#3b82f6' },
  { value: 'profilaxis', label: 'Profilaxis y limpieza', color: '#10b981' },
  { value: 'restauraciones', label: 'Restauraciones', color: '#f59e0b' },
  { value: 'endodoncia', label: 'Endodoncia', color: '#7c3aed' },
  { value: 'periodoncia', label: 'Periodoncia', color: '#06b6d4' },
  { value: 'cirugia', label: 'Cirugía oral', color: '#ef4444' },
  { value: 'protesis', label: 'Prótesis', color: '#a855f7' },
  { value: 'ortodoncia', label: 'Ortodoncia', color: '#ec4899' },
  { value: 'estetica', label: 'Estética dental', color: '#f43f5e' },
  { value: 'pediatria', label: 'Odontopediatría', color: '#14b8a6' },
  { value: 'implantologia', label: 'Implantología', color: '#0ea5e9' },
  { value: 'urgencias', label: 'Urgencias', color: '#dc2626' },
  { value: 'otra', label: 'Otra', color: '#64748b' },
] as const;

export type DentalCategory = (typeof DENTAL_CATEGORIES)[number]['value'];

export function getCategoryLabel(value: string | null): string {
  if (!value) return 'Sin categoría';
  return (
    DENTAL_CATEGORIES.find((c) => c.value === value)?.label || value
  );
}

export function getCategoryColor(value: string | null): string {
  if (!value) return '#64748b';
  return (
    DENTAL_CATEGORIES.find((c) => c.value === value)?.color || '#64748b'
  );
}