// Tipos de fotos clinicas

export type PhotoCategory =
  | 'general'
  | 'before'
  | 'during'
  | 'after'
  | 'xray'
  | 'intraoral'
  | 'smile'
  | 'microscope'
  | 'study_model'
  | 'document';

export type PatientPhoto = {
  id: string;
  tenant_id: string;
  patient_id: string;
  appointment_id: string | null;
  treatment_plan_id: string | null;
  professional_id: string | null;
  storage_path: string;
  storage_url: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  category: PhotoCategory;
  tooth_numbers: string[] | null;
  taken_at: string | null;
  notes: string | null;
  is_deleted: boolean;
  uploaded_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const CATEGORY_CONFIG: Record<
  PhotoCategory,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  general: { label: 'General', emoji: 'GEN', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
  before: { label: 'Antes', emoji: 'ANT', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  during: { label: 'Durante', emoji: 'DUR', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  after: { label: 'Despues', emoji: 'POST', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  xray: { label: 'Radiografia', emoji: 'RX', color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  intraoral: { label: 'Intraoral', emoji: 'IO', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  smile: { label: 'Sonrisa', emoji: 'SMILE', color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-200' },
  microscope: { label: 'Microscopio', emoji: 'MIC', color: 'text-cyan-700', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  study_model: { label: 'Modelo', emoji: 'MOD', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  document: { label: 'Documento', emoji: 'DOC', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
};

export const CATEGORY_OPTIONS: { value: PhotoCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'before', label: 'Antes (pre-tratamiento)' },
  { value: 'during', label: 'Durante (en proceso)' },
  { value: 'after', label: 'Despues (post-tratamiento)' },
  { value: 'xray', label: 'Radiografia' },
  { value: 'intraoral', label: 'Foto intraoral' },
  { value: 'smile', label: 'Sonrisa (estetica)' },
  { value: 'microscope', label: 'Microscopio' },
  { value: 'study_model', label: 'Modelo de estudio' },
  { value: 'document', label: 'Documento clinico' },
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const STORAGE_BUCKET = 'patient-files';
