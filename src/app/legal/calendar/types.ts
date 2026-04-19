import { TipoEvento } from './constants';

export type LegalEvent = {
  id: string;
  tenant_id: string;
  case_id: string;
  titulo: string;
  descripcion: string | null;
  tipo: TipoEvento;
  fecha_hora: string;
  duracion_min: number | null;
  lugar: string | null;
  completado: boolean;
  completado_at: string | null;
  recordatorio_3d_enviado: boolean;
  recordatorio_1d_enviado: boolean;
  recordatorio_hoy_enviado: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type LegalEventWithCase = LegalEvent & {
  case: {
    id: string;
    numero_interno: string;
    materia: string;
    client: {
      id: string;
      nombre: string;
    } | null;
  } | null;
};

export type ActionResult =
  | { success: true; message: string; eventId?: string }
  | { success: false; error: string };