import { Moneda, ModalidadHonorario } from './constants';

// ============================================================
// FEE AGREEMENT
// ============================================================

export type LegalFeeAgreement = {
  id: string;
  tenant_id: string;
  case_id: string;
  monto_total: number;
  moneda: Moneda;
  modalidad: ModalidadHonorario;
  numero_cuotas: number | null;
  estado: 'VIGENTE' | 'PAGADO' | 'MORA' | 'CANCELADO';
  notas: string | null;
  fecha_acuerdo: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================================
// FEE INSTALLMENT (cuota)
// ============================================================

export type LegalFeeInstallment = {
  id: string;
  tenant_id: string;
  agreement_id: string;
  numero: number;
  concepto: string | null;
  monto: number;
  fecha_vencimiento: string;
  estado: 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'PARCIAL';
  monto_pagado: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================================
// AGREEMENT CON CUOTAS Y TOTALES CALCULADOS
// ============================================================

export type AgreementStats = {
  totalPagado: number;
  totalPendiente: number;
  porcentajePagado: number;
  cuotasPagadas: number;
  cuotasPendientes: number;
  cuotasVencidas: number;
  proximaCuota: LegalFeeInstallment | null;
};

export type FeeAgreementWithInstallments = LegalFeeAgreement & {
  installments: LegalFeeInstallment[];
  stats: AgreementStats;
};

// ============================================================
// ACTION RESULT
// ============================================================

export type ActionResult =
  | { success: true; message: string; agreementId?: string }
  | { success: false; error: string };

// ============================================================
// INPUT PARA CREAR ACUERDO
// ============================================================

export type InstallmentInput = {
  numero: number;
  concepto?: string;
  monto: number;
  fecha_vencimiento: string;
};

export type CreateAgreementInput = {
  case_id: string;
  monto_total: number;
  moneda: Moneda;
  modalidad: ModalidadHonorario;
  numero_cuotas?: number;
  installments?: InstallmentInput[];
  notas?: string;
  fecha_acuerdo?: string;
};
export type LegalPayment = {
  id: string;
  tenant_id: string;
  case_id: string;
  installment_id: string | null;
  monto: number;
  moneda: Moneda;
  fecha_pago: string;
  metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'DEPOSITO' | 'TARJETA' | 'OTRO';
  referencia: string | null;
  comprobante_document_id: string | null;
  notas: string | null;
  created_by: string | null;
  created_at: string;
};

export type LegalPaymentWithRelations = LegalPayment & {
  installment: {
    numero: number;
    concepto: string | null;
  } | null;
  created_by_profile: {
    first_name: string;
    last_name: string;
  } | null;
};

export type CreatePaymentInput = {
  case_id: string;
  installment_id?: string | null;
  monto: number;
  moneda: Moneda;
  fecha_pago: string;
  metodo: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'DEPOSITO' | 'TARJETA' | 'OTRO';
  referencia?: string;
  notas?: string;
};
// ============================================================
// CATÁLOGO DE TIPOS DE GASTO
// ============================================================

export type TipoGastoCatalog = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria:
    | 'TIMBRE'
    | 'COPIAS'
    | 'HONORARIOS_3RO'
    | 'TRANSPORTE'
    | 'TASA_JUDICIAL'
    | 'INSCRIPCION'
    | 'OTRO';
  recuperable_default: boolean;
  orden: number;
};

// ============================================================
// EXPENSE
// ============================================================

export type LegalExpense = {
  id: string;
  tenant_id: string;
  case_id: string;
  tipo_gasto_id: string;
  monto: number;
  moneda: Moneda;
  fecha: string;
  descripcion: string | null;
  recuperable: boolean;
  cobrado: boolean;
  fecha_cobrado: string | null;
  comprobante_document_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type LegalExpenseWithRelations = LegalExpense & {
  tipo_gasto: TipoGastoCatalog | null;
  created_by_profile: {
    first_name: string;
    last_name: string;
  } | null;
};

export type CreateExpenseInput = {
  case_id: string;
  tipo_gasto_id: string;
  monto: number;
  moneda: Moneda;
  fecha: string;
  descripcion?: string;
  recuperable: boolean;
  cobrado?: boolean;
  fecha_cobrado?: string | null;
};

export type ExpenseStats = {
  totalGastado: number;
  totalRecuperable: number;
  totalCobrado: number;
  totalPendienteCobro: number;
  totalNoRecuperable: number;
  cantidad: number;
};
// ============================================================
// DASHBOARD FINANCIERO
// ============================================================

export type ReceivableItem = {
  type: 'installment' | 'expense';
  id: string;
  caseId: string;
  caseNumber: string;
  clientId: string | null;
  clientName: string | null;
  concepto: string;
  monto: number;
  moneda: Moneda;
  fechaVencimiento: string | null;
  diasVencido: number; // 0 si no vencido, positivo si vencido
  estado: 'VIGENTE' | 'VENCIDO' | 'POR_COBRAR';
};

export type TopDeudor = {
  clientId: string;
  clientName: string;
  totalAdeudado: number;
  moneda: Moneda;
  cantidadItems: number;
  diasVencidoPromedio: number;
};

export type FinancesDashboardData = {
  totalPorCobrarGTQ: number;
  totalPorCobrarUSD: number;
  totalVencidoGTQ: number;
  totalVencidoUSD: number;
  cobradoMesActualGTQ: number;
  cobradoMesActualUSD: number;
  cobradoMesAnteriorGTQ: number;
  cobradoMesAnteriorUSD: number;
  cantidadCuotasVencidas: number;
  cantidadGastosPorCobrar: number;
  topDeudores: TopDeudor[];
};