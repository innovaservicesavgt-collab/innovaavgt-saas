// Tipos de receta medica

export type PrescriptionStatus = 'active' | 'cancelled' | 'expired';

export type Medication = {
  name: string;
  presentation: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

export type Prescription = {
  id: string;
  tenant_id: string;
  patient_id: string;
  professional_id: string | null;
  appointment_id: string | null;
  treatment_plan_id: string | null;
  prescription_number: string | null;
  diagnosis: string | null;
  medications: Medication[];
  recommendations: string | null;
  next_visit_date: string | null;
  notes: string | null;
  status: PrescriptionStatus;
  issued_at: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const FREQUENCY_OPTIONS = [
  'Cada 4 horas',
  'Cada 6 horas',
  'Cada 8 horas',
  'Cada 12 horas',
  'Una vez al dia',
  'Dos veces al dia',
  'Tres veces al dia',
  'Antes de cada comida',
  'Despues de cada comida',
  'Al acostarse',
  'Segun necesidad',
];

export const DURATION_OPTIONS = [
  '1 dia',
  '3 dias',
  '5 dias',
  '7 dias',
  '10 dias',
  '14 dias',
  '21 dias',
  '30 dias',
  'Hasta terminar el tratamiento',
  'Permanente',
];

export const COMMON_DENTAL_MEDS = [
  { name: 'Amoxicilina', presentation: '500 mg capsulas' },
  { name: 'Amoxicilina + Acido Clavulanico', presentation: '875 mg / 125 mg' },
  { name: 'Clindamicina', presentation: '300 mg capsulas' },
  { name: 'Metronidazol', presentation: '500 mg tabletas' },
  { name: 'Ibuprofeno', presentation: '400 mg tabletas' },
  { name: 'Ibuprofeno', presentation: '600 mg tabletas' },
  { name: 'Naproxeno', presentation: '500 mg tabletas' },
  { name: 'Acetaminofen / Paracetamol', presentation: '500 mg tabletas' },
  { name: 'Diclofenaco', presentation: '50 mg tabletas' },
  { name: 'Ketorolaco', presentation: '10 mg tabletas' },
  { name: 'Clorhexidina', presentation: 'Enjuague bucal 0.12%' },
  { name: 'Lidocaina', presentation: 'Gel topico 2%' },
];
