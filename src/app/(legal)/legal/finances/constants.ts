import {
  DollarSign,
  CreditCard,
  Wallet,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================================
// MONEDAS
// ============================================================

export type Moneda = 'GTQ' | 'USD';

export const MONEDAS = [
  { value: 'GTQ', label: 'Quetzales', symbol: 'Q' },
  { value: 'USD', label: 'Dólares', symbol: '$' },
] as const;

export function getMonedaSymbol(moneda: string): string {
  return MONEDAS.find((m) => m.value === moneda)?.symbol ?? 'Q';
}

/**
 * Formatea un monto con su símbolo de moneda
 * Ej: formatMoney(1500.5, 'GTQ') => "Q1,500.50"
 */
export function formatMoney(amount: number | null | undefined, moneda: string = 'GTQ'): string {
  if (amount === null || amount === undefined) return '—';
  const symbol = getMonedaSymbol(moneda);
  return `${symbol}${amount.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ============================================================
// MODALIDADES DE HONORARIOS
// ============================================================

export type ModalidadHonorario = 'UNICO' | 'CUOTAS' | 'POR_ETAPA';

export type ModalidadInfo = {
  value: ModalidadHonorario;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

export const MODALIDADES: ModalidadInfo[] = [
  {
    value: 'UNICO',
    label: 'Pago único',
    description: 'El cliente paga el 100% en un solo momento',
    icon: Wallet,
    color: 'bg-blue-100 text-blue-700',
  },
  {
    value: 'CUOTAS',
    label: 'Por cuotas',
    description: 'Se divide el monto total en N cuotas con fechas de vencimiento',
    icon: Calendar,
    color: 'bg-purple-100 text-purple-700',
  },
  {
    value: 'POR_ETAPA',
    label: 'Por etapa procesal',
    description: 'Se cobra según las etapas del proceso (demanda, audiencia, sentencia...)',
    icon: Briefcase,
    color: 'bg-teal-100 text-teal-700',
  },
];

export function getModalidadInfo(modalidad: string): ModalidadInfo {
  return MODALIDADES.find((m) => m.value === modalidad) ?? MODALIDADES[0];
}

// ============================================================
// ESTADOS DE ACUERDO
// ============================================================

export const ESTADOS_ACUERDO = [
  {
    value: 'VIGENTE',
    label: 'Vigente',
    color: 'bg-blue-100 text-blue-700',
    icon: Clock,
  },
  {
    value: 'PAGADO',
    label: 'Pagado totalmente',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  {
    value: 'MORA',
    label: 'En mora',
    color: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
  },
  {
    value: 'CANCELADO',
    label: 'Cancelado',
    color: 'bg-gray-100 text-gray-700',
    icon: XCircle,
  },
] as const;

export function getEstadoAcuerdoInfo(estado: string) {
  return ESTADOS_ACUERDO.find((e) => e.value === estado) ?? ESTADOS_ACUERDO[0];
}

// ============================================================
// ESTADOS DE CUOTAS
// ============================================================

export const ESTADOS_CUOTA = [
  {
    value: 'PENDIENTE',
    label: 'Pendiente',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  {
    value: 'PAGADA',
    label: 'Pagada',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle2,
  },
  {
    value: 'VENCIDA',
    label: 'Vencida',
    color: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
  },
  {
    value: 'PARCIAL',
    label: 'Parcial',
    color: 'bg-blue-100 text-blue-700',
    icon: DollarSign,
  },
] as const;

export function getEstadoCuotaInfo(estado: string) {
  return ESTADOS_CUOTA.find((e) => e.value === estado) ?? ESTADOS_CUOTA[0];
}

// ============================================================
// METODOS DE PAGO
// ============================================================

export const METODOS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: Wallet },
  { value: 'TRANSFERENCIA', label: 'Transferencia', icon: CreditCard },
  { value: 'CHEQUE', label: 'Cheque', icon: CreditCard },
  { value: 'DEPOSITO', label: 'Depósito bancario', icon: CreditCard },
  { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
  { value: 'OTRO', label: 'Otro', icon: DollarSign },
] as const;