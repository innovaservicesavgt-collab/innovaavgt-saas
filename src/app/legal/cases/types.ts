import { Materia } from './constants';

export type LegalCase = {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  numero_interno: string;
  numero_judicial: string | null;
  materia: Materia;
  tipo_proceso: string | null;
  estado_procesal: string | null;
  client_id: string;
  parte_contraria: string | null;
  organo_jurisdiccional: string | null;
  abogado_responsable_id: string;
  fecha_inicio: string;
  ultima_actuacion: string | null;
  proxima_actuacion: string | null;
  observaciones: string | null;
  archivado: boolean;
  created_at: string;
  updated_at: string;
};

// Expediente con datos relacionados (cliente + abogado) para mostrar en tabla
export type LegalCaseWithRelations = LegalCase & {
  client: {
    id: string;
    nombre: string;
    tipo_persona: string;
  } | null;
  abogado: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
};

export type ActionResult =
  | { success: true; message: string; caseId?: string; numero?: string }
  | { success: false; error: string };