import type { Materia } from './constants';

// ============================================================
// LEGAL CASE (con los nuevos campos de catálogos FASE 12)
// ============================================================

export type LegalCase = {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  numero_interno: string;
  numero_judicial: string | null;
  materia: Materia;

  // Campos legados (se mantienen por compatibilidad retro)
  tipo_proceso: string | null;
  estado_procesal: string | null;
  organo_jurisdiccional: string | null;

  // NUEVOS CAMPOS FASE 12 — referencias a catálogos
  juzgado_id: string | null;
  fiscalia_id: string | null;
  tipo_proceso_id: string | null;

  client_id: string;
  parte_contraria: string | null;
  abogado_responsable_id: string;
  fecha_inicio: string;
  ultima_actuacion: string | null;
  proxima_actuacion: string | null;
  observaciones: string | null;
  archivado: boolean;
  created_at: string;
  updated_at: string;
};

// ============================================================
// CASO CON RELACIONES (tabla + detalle)
// ============================================================

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

  // NUEVOS: datos de catálogos con municipio incluido
  juzgado?: {
    id: string;
    nombre: string;
    nombre_corto: string | null;
    departamento: string;
    municipio: string | null;
    materia: string;
    instancia: string;
  } | null;
  fiscalia?: {
    id: string;
    nombre: string;
    nombre_corto: string | null;
    departamento: string;
    municipio: string | null;
    tipo: string;
  } | null;
  tipo_proceso_catalogo?: {
    id: string;
    nombre: string;
    via_procesal: string | null;
    descripcion: string | null;
  } | null;
};

// ============================================================
// ACTION RESULT
// ============================================================

export type ActionResult =
  | { success: true; message: string; caseId?: string; numero?: string }
  | { success: false; error: string };