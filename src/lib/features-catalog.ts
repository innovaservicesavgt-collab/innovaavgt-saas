/**
 * Catálogo central de features del SaaS.
 *
 * Define qué features existen, a qué vertical pertenecen, en qué grupo
 * visual van en el editor, su etiqueta legible y descripción.
 *
 * Esta es la fuente única de verdad. Si agregas una feature nueva:
 *  1. Agrégala aquí
 *  2. Actualiza el JSONB del plan correspondiente en la tabla `plans`
 *  3. Úsala en tu código con `tenant_has_feature()` o `hasFeature()`
 */

import type { VerticalCode } from '@/lib/verticals';

export type FeatureKey = string;

export type FeatureType = 'boolean' | 'number';

export type FeatureDefinition = {
  /** Llave que se guarda en plans.features (JSONB) */
  key: FeatureKey;
  /** Etiqueta visible en el editor */
  label: string;
  /** Descripción corta para tooltip o subtítulo */
  description?: string;
  /** boolean: checkbox · number: input numérico (ej: límites mensuales) */
  type: FeatureType;
  /** A qué vertical aplica esta feature */
  applies_to: ('legal' | 'dental' | 'all')[];
  /**
   * Si true, NO se puede desactivar desde el editor (es parte del core del plan).
   * Útil para módulos esenciales que siempre vienen con el SaaS.
   */
  is_core?: boolean;
  /** Solo en planes premium (visual: muestra etiqueta "Premium") */
  is_premium?: boolean;
};

export type FeatureGroup = {
  id: string;
  label: string;
  description?: string;
  /** Emoji visual del grupo */
  icon: string;
  /** Aplica solo si el plan es de este vertical, o `all` para mostrarlo siempre */
  vertical: VerticalCode | 'all';
  features: FeatureDefinition[];
};

// ─────────────────────────────────────────────────────────────────
// CATÁLOGO COMPLETO
// ─────────────────────────────────────────────────────────────────
export const FEATURE_GROUPS: FeatureGroup[] = [
  // ═══════════════════════════════════════════════════════════════
  // GRUPOS COMUNES (aplican a todos los verticales)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'reports_audit',
    label: 'Reportes y auditoría',
    description: 'Reportes administrativos y registros de actividad',
    icon: '📊',
    vertical: 'all',
    features: [
      {
        key: 'reports_basic',
        label: 'Reportes básicos',
        description: 'Reportes operativos diarios y mensuales',
        type: 'boolean',
        applies_to: ['all'],
      },
      {
        key: 'reports_advanced',
        label: 'Reportes avanzados',
        description: 'Reportes ejecutivos, comparativos y exportación',
        type: 'boolean',
        applies_to: ['all'],
      },
      {
        key: 'audit_logs',
        label: 'Logs de auditoría',
        description: 'Historial de acciones por usuario',
        type: 'boolean',
        applies_to: ['all'],
      },
    ],
  },
  {
    id: 'integration_premium',
    label: 'Integraciones y Premium',
    description: 'Funciones avanzadas para clientes empresa',
    icon: '⭐',
    vertical: 'all',
    features: [
      {
        key: 'api_access',
        label: 'Acceso API',
        description: 'Llaves de API para integraciones externas',
        type: 'boolean',
        applies_to: ['all'],
        is_premium: true,
      },
      {
        key: 'sso',
        label: 'Single Sign-On (SSO)',
        description: 'Autenticación corporativa SAML/OIDC',
        type: 'boolean',
        applies_to: ['all'],
        is_premium: true,
      },
      {
        key: 'white_label',
        label: 'Marca blanca',
        description: 'Personalización completa de marca y dominio',
        type: 'boolean',
        applies_to: ['all'],
        is_premium: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // GRUPOS DENTALES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'dental_core',
    label: 'Módulos clínicos básicos',
    description: 'Funcionalidades esenciales para una clínica dental',
    icon: '🦷',
    vertical: 'dental',
    features: [
      {
        key: 'patients',
        label: 'Pacientes',
        description: 'Registro y gestión de pacientes',
        type: 'boolean',
        applies_to: ['dental'],
        is_core: true,
      },
      {
        key: 'appointments',
        label: 'Agenda y citas',
        description: 'Calendario por doctor, sucursal y box',
        type: 'boolean',
        applies_to: ['dental'],
        is_core: true,
      },
      {
        key: 'services',
        label: 'Catálogo de servicios',
        description: 'Tratamientos con códigos ADA',
        type: 'boolean',
        applies_to: ['dental'],
        is_core: true,
      },
      {
        key: 'professionals',
        label: 'Gestión de profesionales',
        type: 'boolean',
        applies_to: ['dental'],
        is_core: true,
      },
      {
        key: 'medical_history',
        label: 'Expediente clínico',
        description: 'Historia médica + antecedentes + alergias',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'clinical_evolutions',
        label: 'Evoluciones clínicas',
        description: 'Notas SOAP por visita',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'odontogram',
        label: 'Odontograma',
        description: 'Diagrama dental interactivo con piezas y caras',
        type: 'boolean',
        applies_to: ['dental'],
      },
    ],
  },
  {
    id: 'dental_treatments',
    label: 'Tratamientos y pagos',
    description: 'Planes de tratamiento, presupuestos y cobranza',
    icon: '💰',
    vertical: 'dental',
    features: [
      {
        key: 'treatment_plans',
        label: 'Planes de tratamiento',
        description: 'Fases con piezas y servicios',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'budgets',
        label: 'Presupuestos',
        description: 'Generación de presupuestos con aprobación',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'payments',
        label: 'Pagos y saldos',
        description: 'Abonos, cuotas, recibos y estado de cuenta',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'commissions',
        label: 'Comisiones por odontólogo',
        type: 'boolean',
        applies_to: ['dental'],
      },
    ],
  },
  {
    id: 'dental_documents',
    label: 'Documentos clínicos',
    description: 'Recetas, consentimientos y plantillas',
    icon: '📄',
    vertical: 'dental',
    features: [
      {
        key: 'prescriptions',
        label: 'Recetas médicas',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'consents_basic',
        label: 'Consentimientos informados',
        description: 'Plantillas básicas con firma digital',
        type: 'boolean',
        applies_to: ['dental'],
      },
    ],
  },
  {
    id: 'dental_operations',
    label: 'Operación y finanzas',
    description: 'Caja, gastos, inventario y proveedores',
    icon: '🏪',
    vertical: 'dental',
    features: [
      {
        key: 'cash_register',
        label: 'Control de caja',
        description: 'Apertura/cierre de turno con cuadre',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'expenses',
        label: 'Control de gastos',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'inventory',
        label: 'Inventario de insumos',
        description: 'Stock con alertas de mínimo',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'lab_orders',
        label: 'Laboratorios externos',
        description: 'Órdenes a laboratorios dentales',
        type: 'boolean',
        applies_to: ['dental'],
      },
    ],
  },
  {
    id: 'dental_clinical_advanced',
    label: 'Clínico avanzado',
    description: 'Especialidades y módulos premium',
    icon: '🔬',
    vertical: 'dental',
    features: [
      {
        key: 'periodontogram',
        label: 'Periodontograma',
        description: '6 mediciones por diente, sangrado, movilidad',
        type: 'boolean',
        applies_to: ['dental'],
        is_premium: true,
      },
      {
        key: 'orthodontics',
        label: 'Ortodoncia',
        description: 'Controles, aparatología y cefalometría',
        type: 'boolean',
        applies_to: ['dental'],
        is_premium: true,
      },
    ],
  },
  {
    id: 'dental_automation',
    label: 'Automatización y captación',
    description: 'Recordatorios, portal de pacientes y campañas',
    icon: '📱',
    vertical: 'dental',
    features: [
      {
        key: 'patient_portal',
        label: 'Portal de pacientes',
        description: 'Login para ver citas, presupuestos y pagar',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'whatsapp_reminders',
        label: 'Recordatorios por WhatsApp',
        description: 'Confirmación automática de citas',
        type: 'boolean',
        applies_to: ['dental'],
      },
      {
        key: 'whatsapp_monthly_limit',
        label: 'Límite mensual de WhatsApp',
        description: 'Cantidad de mensajes incluidos por mes (vacío = ilimitado)',
        type: 'number',
        applies_to: ['dental'],
      },
      {
        key: 'email_campaigns',
        label: 'Campañas por email',
        type: 'boolean',
        applies_to: ['dental'],
        is_premium: true,
      },
      {
        key: 'nps_surveys',
        label: 'Encuestas NPS',
        description: 'Evaluación de satisfacción tras la cita',
        type: 'boolean',
        applies_to: ['dental'],
        is_premium: true,
      },
    ],
  },
  {
    id: 'dental_ai',
    label: 'Funciones con IA',
    description: 'Inteligencia artificial aplicada (futuro)',
    icon: '🤖',
    vertical: 'dental',
    features: [
      {
        key: 'ai_features',
        label: 'Funciones con IA',
        description: 'Análisis de radiografías, notas por voz, simulador',
        type: 'boolean',
        applies_to: ['dental'],
        is_premium: true,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // GRUPOS LEGALES
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'legal_core',
    label: 'Módulos jurídicos básicos',
    icon: '⚖️',
    vertical: 'legal',
    features: [
      {
        key: 'cases',
        label: 'Expedientes',
        type: 'boolean',
        applies_to: ['legal'],
        is_core: true,
      },
      {
        key: 'calendar',
        label: 'Agenda y plazos',
        type: 'boolean',
        applies_to: ['legal'],
        is_core: true,
      },
      {
        key: 'documents',
        label: 'Gestor de documentos',
        type: 'boolean',
        applies_to: ['legal'],
        is_core: true,
      },
      {
        key: 'clients',
        label: 'Clientes',
        type: 'boolean',
        applies_to: ['legal'],
        is_core: true,
      },
      {
        key: 'actuations',
        label: 'Actuaciones',
        type: 'boolean',
        applies_to: ['legal'],
      },
      {
        key: 'honorarios',
        label: 'Honorarios',
        type: 'boolean',
        applies_to: ['legal'],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Devuelve los grupos relevantes para un vertical.
 * Incluye los grupos del vertical + los grupos `all`.
 */
export function getGroupsForVertical(vertical: VerticalCode): FeatureGroup[] {
  return FEATURE_GROUPS.filter(
    (g) => g.vertical === vertical || g.vertical === 'all'
  );
}

/**
 * Devuelve TODAS las features (planas) que aplican a un vertical.
 */
export function getAllFeaturesForVertical(
  vertical: VerticalCode
): FeatureDefinition[] {
  return getGroupsForVertical(vertical).flatMap((g) => g.features);
}

/**
 * Construye el objeto de features con valores default (todo desactivado salvo core).
 * Útil al crear un plan nuevo.
 */
export function getDefaultFeatures(
  vertical: VerticalCode
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const feature of getAllFeaturesForVertical(vertical)) {
    if (feature.type === 'boolean') {
      result[feature.key] = feature.is_core ?? false;
    }
  }
  return result;
}

/**
 * Encuentra la definición de una feature por su key.
 */
export function findFeature(key: string): FeatureDefinition | null {
  for (const group of FEATURE_GROUPS) {
    const found = group.features.find((f) => f.key === key);
    if (found) return found;
  }
  return null;
}