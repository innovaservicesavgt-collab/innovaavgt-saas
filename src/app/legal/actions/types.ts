export type LegalAction = {
  id: string;
  tenant_id: string;
  case_id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  event_id: string | null;
  document_id: string | null;
  registrada_por: string | null;
  created_at: string;
};

export type LegalActionWithRelations = LegalAction & {
  case: {
    id: string;
    numero_interno: string;
    materia: string;
    client: {
      id: string;
      nombre: string;
    } | null;
  } | null;
  registrada_por_profile: {
    first_name: string;
    last_name: string;
  } | null;
};

export type ActionResult =
  | { success: true; message: string; actionId?: string }
  | { success: false; error: string };