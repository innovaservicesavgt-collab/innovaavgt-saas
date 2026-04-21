// ============================================================
// TYPES — Auditoría
// ============================================================

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export type AuditTableName =
  | 'legal_clients'
  | 'legal_cases'
  | 'legal_events'
  | 'legal_documents'
  | 'legal_actions'
  | 'legal_fee_agreements'
  | 'legal_fee_installments'
  | 'legal_payments'
  | 'legal_expenses';

export type AuditLogEntry = {
  id: string;
  tenant_id: string;
  user_id: string | null;
  user_email: string | null;
  table_name: AuditTableName;
  record_id: string | null;
  action: AuditAction;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

// Log enriquecido con info del usuario (perfil)
export type AuditLogEntryEnriched = AuditLogEntry & {
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};