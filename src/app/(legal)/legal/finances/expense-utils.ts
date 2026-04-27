// ============================================================
// UTILIDADES PURAS (no server-side, se pueden importar en cliente)
// ============================================================

import type {
  LegalExpenseWithRelations,
  ExpenseStats,
} from './types';

/**
 * Calcula estadísticas agregadas de una lista de gastos.
 * Función pura sin side-effects, safe para import tanto en server como client.
 */
export function calculateExpenseStats(
  expenses: LegalExpenseWithRelations[]
): ExpenseStats {
  let totalGastado = 0;
  let totalRecuperable = 0;
  let totalCobrado = 0;
  let totalNoRecuperable = 0;

  for (const exp of expenses) {
    const monto = Number(exp.monto);
    totalGastado += monto;

    if (exp.recuperable) {
      totalRecuperable += monto;
      if (exp.cobrado) {
        totalCobrado += monto;
      }
    } else {
      totalNoRecuperable += monto;
    }
  }

  return {
    totalGastado,
    totalRecuperable,
    totalCobrado,
    totalPendienteCobro: totalRecuperable - totalCobrado,
    totalNoRecuperable,
    cantidad: expenses.length,
  };
}