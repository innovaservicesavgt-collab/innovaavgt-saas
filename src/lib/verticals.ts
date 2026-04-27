/**
 * Configuración visual y metadatos de cada vertical del SaaS.
 *
 * IMPORTANTE: Este archivo es DIFERENTE de `src/lib/vertical.ts` (singular).
 *  - vertical.ts  → guards de auth (requireVertical, hasVertical)
 *  - verticals.ts → config visual (badges, colores, íconos, paths)
 *
 * Uso:
 *   import { getVertical, VERTICALS } from '@/lib/verticals';
 *   const config = getVertical('dental');
 */
import type { LucideIcon } from 'lucide-react';
import { Scale, Stethoscope } from 'lucide-react';

// Por ahora el código solo opera legal y dental.
// La BD acepta más (medical, veterinary, generic) para expansión futura.
export type VerticalCode = 'legal' | 'dental';

export type VerticalConfig = {
  code: VerticalCode;
  label: string;
  labelPlural: string;
  icon: LucideIcon;
  emoji: string;
  description: string;
  brandName: string;
  dashboardPath: string;
  /** Clases Tailwind pre-compuestas — NO concatenes dinámicamente */
  color: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    ring: string;
    dot: string;
  };
};

export const VERTICALS: Record<VerticalCode, VerticalConfig> = {
  legal: {
    code: 'legal',
    label: 'Legal',
    labelPlural: 'Despachos legales',
    icon: Scale,
    emoji: '⚖️',
    description: 'Gestión de expedientes, plazos y clientes para despachos jurídicos',
    brandName: 'InnovaLegal',
    dashboardPath: '/dental/dashboard',
    color: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      badge: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
      ring: 'ring-blue-500',
      dot: 'bg-blue-500',
    },
  },
  dental: {
    code: 'dental',
    label: 'Dental',
    labelPlural: 'Clínicas dentales',
    icon: Stethoscope,
    emoji: '🦷',
    description: 'Pacientes, agenda, odontograma, tratamientos y pagos para clínicas dentales',
    brandName: 'InnovaDental',
    dashboardPath: '/dental/dashboard',
    color: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      ring: 'ring-emerald-500',
      dot: 'bg-emerald-500',
    },
  },
};

export const VERTICAL_CODES = Object.keys(VERTICALS) as VerticalCode[];

/**
 * Devuelve la config de un vertical. Si el código no es válido,
 * cae al default (legal) para evitar errores en runtime.
 */
export function getVertical(
  code: VerticalCode | string | null | undefined
): VerticalConfig {
  if (code && code in VERTICALS) {
    return VERTICALS[code as VerticalCode];
  }
  return VERTICALS.legal;
}

/**
 * Helper rápido para mostrar solo el label sin cargar la config completa.
 */
export function verticalLabel(
  code: VerticalCode | string | null | undefined
): string {
  return getVertical(code).label;
}

/**
 * Valida que un string sea un VerticalCode válido (útil en forms).
 */
export function isValidVertical(value: unknown): value is VerticalCode {
  return typeof value === 'string' && value in VERTICALS;
}