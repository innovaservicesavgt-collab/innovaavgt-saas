export type MedicalHistoryData = {
  medical_history?: {
    diseases?: string | null;
    surgeries?: string | null;
    current_medications?: string | null;
    structured_allergies?: string[] | null;
    is_pregnant?: boolean | null;
    blood_pressure?: string | null;
    other?: string | null;
  };
  dental_history?: {
    last_visit_elsewhere?: string | null;
    previous_treatments?: string | null;
    complications?: string | null;
  };
  habits?: {
    smoker?: boolean | null;
    alcohol?: 'no' | 'ocasional' | 'frecuente' | null;
    bruxism?: boolean | null;
    other?: string | null;
  };
  evolution_notes?: EvolutionNote[];
};

export type EvolutionNote = {
  id: string;
  date: string;
  author: string;
  content: string;
};

export type PatientMetadata = MedicalHistoryData & Record<string, unknown>;