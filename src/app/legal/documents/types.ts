import { TipoDocumento } from './constants';

export type LegalDocument = {
  id: string;
  tenant_id: string;
  case_id: string;
  nombre: string;
  tipo: TipoDocumento;
  storage_path: string;
  tamano_bytes: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
};

export type LegalDocumentWithCase = LegalDocument & {
  case: {
    id: string;
    numero_interno: string;
    client: {
      id: string;
      nombre: string;
    } | null;
  } | null;
  uploaded_by_profile?: {
    first_name: string;
    last_name: string;
  } | null;
};

export type ActionResult =
  | { success: true; message: string; url?: string; documentId?: string }
  | { success: false; error: string };