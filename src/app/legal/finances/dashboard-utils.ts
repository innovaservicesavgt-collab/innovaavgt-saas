import type { ReceivableItem, TopDeudor } from './types';

/**
 * Calcula días vencidos desde una fecha de vencimiento.
 * Retorna 0 si no está vencido.
 */
export function diasVencido(fechaVencimiento: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fechaVencimiento);
  venc.setHours(0, 0, 0, 0);
  const diff = hoy.getTime() - venc.getTime();
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, dias);
}

/**
 * Dada una lista de cuentas por cobrar, agrupa por cliente y calcula top deudores.
 */
export function calcularTopDeudores(
  items: ReceivableItem[],
  limit: number = 5
): TopDeudor[] {
  const porCliente = new Map<string, TopDeudor>();

  for (const item of items) {
    if (!item.clientId || !item.clientName) continue;

    const existing = porCliente.get(item.clientId);
    if (existing) {
      existing.totalAdeudado += item.monto;
      existing.cantidadItems += 1;
      existing.diasVencidoPromedio =
        (existing.diasVencidoPromedio * (existing.cantidadItems - 1) +
          item.diasVencido) /
        existing.cantidadItems;
    } else {
      porCliente.set(item.clientId, {
        clientId: item.clientId,
        clientName: item.clientName,
        totalAdeudado: item.monto,
        moneda: item.moneda,
        cantidadItems: 1,
        diasVencidoPromedio: item.diasVencido,
      });
    }
  }

  return Array.from(porCliente.values())
    .sort((a, b) => b.totalAdeudado - a.totalAdeudado)
    .slice(0, limit);
}