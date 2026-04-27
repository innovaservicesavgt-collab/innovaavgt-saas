export type LegalClient = {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  nombre: string;
  tipo_persona: 'NATURAL' | 'JURIDICA';
  dpi: string | null;
  nit: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  observaciones: string | null;
  activo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActionResult = 
  | { success: true; message: string; clientId?: string }
  | { success: false; error: string };