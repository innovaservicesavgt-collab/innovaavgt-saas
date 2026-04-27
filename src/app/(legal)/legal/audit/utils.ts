import type { AuditAction, AuditTableName } from './types';

// ============================================================
// LABELS de tablas (nombre técnico → nombre amigable)
// ============================================================

export const TABLE_LABELS: Record<AuditTableName, string> = {
  legal_clients: 'Cliente',
  legal_cases: 'Expediente',
  legal_events: 'Evento de agenda',
  legal_documents: 'Documento',
  legal_actions: 'Actuación',
  legal_fee_agreements: 'Acuerdo de honorarios',
  legal_fee_installments: 'Cuota',
  legal_payments: 'Pago',
  legal_expenses: 'Gasto',
};

// ============================================================
// LABELS de campos (nombre técnico → nombre amigable en español)
// ============================================================

export const FIELD_LABELS: Record<string, string> = {
  // Comunes
  nombre: 'Nombre',
  tipo_persona: 'Tipo de persona',
  dpi: 'DPI',
  nit: 'NIT',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
  direccion: 'Dirección',
  activo: 'Estado activo',
  observaciones: 'Observaciones',

  // Expediente
  numero_interno: 'Número interno',
  numero_judicial: 'Número judicial',
  materia: 'Materia',
  tipo_proceso: 'Tipo de proceso',
  estado_procesal: 'Estado procesal',
  client_id: 'Cliente',
  parte_contraria: 'Parte contraria',
  organo_jurisdiccional: 'Órgano jurisdiccional',
  abogado_responsable_id: 'Abogado responsable',
  fecha_inicio: 'Fecha de inicio',
  ultima_actuacion: 'Última actuación',
  proxima_actuacion: 'Próxima actuación',
  archivado: 'Archivado',
  juzgado_id: 'Juzgado',
  fiscalia_id: 'Fiscalía',
  tipo_proceso_id: 'Tipo de proceso (catálogo)',

  // Eventos
  titulo: 'Título',
  descripcion: 'Descripción',
  fecha: 'Fecha',
  hora_inicio: 'Hora de inicio',
  hora_fin: 'Hora de fin',
  tipo_evento: 'Tipo de evento',
  lugar: 'Lugar',
  enviar_recordatorio: 'Recordatorio activo',

  // Finanzas
  modalidad: 'Modalidad',
  monto_total: 'Monto total',
  moneda: 'Moneda',
  estado: 'Estado',
  concepto: 'Concepto',
  numero_cuota: 'Número de cuota',
  fecha_vencimiento: 'Fecha de vencimiento',
  monto: 'Monto',
  monto_pagado: 'Monto pagado',
  fecha_pago: 'Fecha de pago',
  metodo_pago: 'Método de pago',
  referencia: 'Referencia',
  tipo_gasto_id: 'Tipo de gasto',
  recuperable: 'Recuperable',
  cobrado: 'Cobrado',
  fecha_cobrado: 'Fecha cobrado',

  // Documentos
  titulo_documento: 'Título',
  tipo_documento: 'Tipo de documento',
  storage_path: 'Archivo',
  file_size: 'Tamaño',
  mime_type: 'Tipo MIME',

  // Actuaciones
  tipo_actuacion: 'Tipo de actuación',
};

// ============================================================
// Traducir nombre de campo
// ============================================================

export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field;
}

// ============================================================
// Traducir nombre de tabla
// ============================================================

export function getTableLabel(table: AuditTableName): string {
  return TABLE_LABELS[table] || table;
}

// ============================================================
// Acción legible en español
// ============================================================

export function getActionLabel(
  action: AuditAction,
  tableName: AuditTableName
): string {
  const noun = getTableLabel(tableName).toLowerCase();

  switch (action) {
    case 'INSERT':
      return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} creado`;
    case 'UPDATE':
      return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} editado`;
    case 'DELETE':
      return `${noun.charAt(0).toUpperCase()}${noun.slice(1)} eliminado`;
    default:
      return action;
  }
}

// ============================================================
// Colores según acción
// ============================================================

export function getActionColor(action: AuditAction): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  switch (action) {
    case 'INSERT':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: 'text-green-600',
      };
    case 'UPDATE':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: 'text-blue-600',
      };
    case 'DELETE':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: 'text-red-600',
      };
  }
}

// ============================================================
// Nombre completo del usuario
// ============================================================

export function getUserDisplayName(
  userEmail: string | null,
  profile?: { first_name: string | null; last_name: string | null } | null
): string {
  if (profile) {
    const fullName = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
    if (fullName) return fullName;
  }
  return userEmail || 'Usuario desconocido';
}

// ============================================================
// Formatear valor de campo para mostrar (JSONB → string)
// ============================================================

export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '(vacío)';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'string') {
    // Si es un UUID, acortar
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      return value.slice(0, 8) + '...';
    }
    // Si es fecha ISO, formato corto
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.split('T')[0];
    }
    return value;
  }
  if (typeof value === 'number') return value.toString();
  return JSON.stringify(value);
}