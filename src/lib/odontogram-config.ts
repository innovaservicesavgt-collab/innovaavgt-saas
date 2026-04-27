import type { ToothStatus, FaceTreatment } from './types/odontogram';

// Configuracion visual de estados de pieza
export const TOOTH_STATUS_CONFIG: Record<
  ToothStatus,
  { label: string; color: string; description: string }
> = {
  present: {
    label: 'Sana / presente',
    color: '#ffffff',
    description: 'Pieza presente sin tratamientos',
  },
  missing: {
    label: 'Ausente',
    color: '#94a3b8',
    description: 'Pieza ausente',
  },
  extraction: {
    label: 'Indicada para extraccion',
    color: '#fca5a5',
    description: 'Requiere extraccion',
  },
  implant: {
    label: 'Implante',
    color: '#a78bfa',
    description: 'Implante dental',
  },
  crown: {
    label: 'Corona',
    color: '#fbbf24',
    description: 'Corona completa',
  },
  provisional: {
    label: 'Provisional',
    color: '#fdba74',
    description: 'Restauracion provisional',
  },
  unerupted: {
    label: 'No erupcionada',
    color: '#cbd5e1',
    description: 'Pieza sin erupcionar',
  },
  fractured: {
    label: 'Fracturada',
    color: '#f87171',
    description: 'Pieza con fractura',
  },
};

// Configuracion visual de tratamientos por cara
export const FACE_TREATMENT_CONFIG: Record<
  FaceTreatment,
  { label: string; color: string; symbol: string }
> = {
  caries: {
    label: 'Caries',
    color: '#dc2626',
    symbol: 'C',
  },
  resin: {
    label: 'Resina compuesta',
    color: '#2563eb',
    symbol: 'R',
  },
  amalgam: {
    label: 'Amalgama',
    color: '#475569',
    symbol: 'A',
  },
  sealant: {
    label: 'Sellante',
    color: '#10b981',
    symbol: 'S',
  },
  endodontic: {
    label: 'Endodoncia',
    color: '#7c3aed',
    symbol: 'E',
  },
  inlay: {
    label: 'Incrustacion',
    color: '#0891b2',
    symbol: 'I',
  },
  fracture: {
    label: 'Fractura',
    color: '#ea580c',
    symbol: 'F',
  },
  restoration_to_replace: {
    label: 'Restauracion a reemplazar',
    color: '#f59e0b',
    symbol: 'X',
  },
};

// Helpers
export function getStatusColor(status: ToothStatus): string {
  return TOOTH_STATUS_CONFIG[status]?.color || '#ffffff';
}

export function getTreatmentColor(treatment: FaceTreatment): string {
  return FACE_TREATMENT_CONFIG[treatment]?.color || '#64748b';
}

export function getStatusLabel(status: ToothStatus): string {
  return TOOTH_STATUS_CONFIG[status]?.label || status;
}

export function getTreatmentLabel(treatment: FaceTreatment): string {
  return FACE_TREATMENT_CONFIG[treatment]?.label || treatment;
}
