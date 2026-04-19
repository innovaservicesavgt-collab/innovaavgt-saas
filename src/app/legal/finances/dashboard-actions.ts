'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { requireVertical } from '@/lib/vertical';
import type {
  ReceivableItem,
  FinancesDashboardData,
} from './types';
import type { Moneda } from './constants';
import { diasVencido, calcularTopDeudores } from './dashboard-utils';

// ============================================================
// OBTENER TODAS LAS CUENTAS POR COBRAR
// ============================================================

/**
 * Obtiene cuentas por cobrar cross-expediente:
 * - Cuotas PENDIENTES, PARCIAL o VENCIDAS
 * - Gastos recuperables no cobrados
 */
export async function getAllReceivables(): Promise<ReceivableItem[]> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    // 1) Cuotas pendientes o parciales
    const { data: cuotasRaw } = await supabase
      .from('legal_fee_installments')
      .select(`
        id,
        numero,
        concepto,
        monto,
        monto_pagado,
        fecha_vencimiento,
        estado,
        agreement:legal_fee_agreements!inner (
          id,
          moneda,
          case:legal_cases!inner (
            id,
            numero_interno,
            archivado,
            client:legal_clients (id, nombre)
          )
        )
      `)
      .in('estado', ['PENDIENTE', 'PARCIAL', 'VENCIDA']);

    // 2) Gastos recuperables no cobrados
    const { data: gastosRaw } = await supabase
      .from('legal_expenses')
      .select(`
        id,
        monto,
        moneda,
        fecha,
        descripcion,
        tipo_gasto:legal_catalog_tipos_gasto (nombre),
        case:legal_cases!inner (
          id,
          numero_interno,
          archivado,
          client:legal_clients (id, nombre)
        )
      `)
      .eq('recuperable', true)
      .eq('cobrado', false);

    const items: ReceivableItem[] = [];

    // Procesar cuotas
    for (const c of (cuotasRaw || []) as unknown as Array<{
      id: string;
      numero: number;
      concepto: string | null;
      monto: number;
      monto_pagado: number;
      fecha_vencimiento: string;
      estado: string;
      agreement: {
        id: string;
        moneda: string;
        case: {
          id: string;
          numero_interno: string;
          archivado: boolean;
          client: { id: string; nombre: string } | null;
        };
      };
    }>) {
      // Saltar si el expediente está archivado
      if (c.agreement.case.archivado) continue;

      const pendiente = Number(c.monto) - Number(c.monto_pagado || 0);
      if (pendiente <= 0.01) continue;

      const dias = diasVencido(c.fecha_vencimiento);

      items.push({
        type: 'installment',
        id: c.id,
        caseId: c.agreement.case.id,
        caseNumber: c.agreement.case.numero_interno,
        clientId: c.agreement.case.client?.id ?? null,
        clientName: c.agreement.case.client?.nombre ?? null,
        concepto: c.concepto || `Cuota ${c.numero}`,
        monto: pendiente,
        moneda: c.agreement.moneda as Moneda,
        fechaVencimiento: c.fecha_vencimiento,
        diasVencido: dias,
        estado: dias > 0 ? 'VENCIDO' : 'VIGENTE',
      });
    }

    // Procesar gastos
    for (const g of (gastosRaw || []) as unknown as Array<{
      id: string;
      monto: number;
      moneda: string;
      fecha: string;
      descripcion: string | null;
      tipo_gasto: { nombre: string } | null;
      case: {
        id: string;
        numero_interno: string;
        archivado: boolean;
        client: { id: string; nombre: string } | null;
      };
    }>) {
      if (g.case.archivado) continue;

      items.push({
        type: 'expense',
        id: g.id,
        caseId: g.case.id,
        caseNumber: g.case.numero_interno,
        clientId: g.case.client?.id ?? null,
        clientName: g.case.client?.nombre ?? null,
        concepto: g.tipo_gasto?.nombre || g.descripcion || 'Gasto',
        monto: Number(g.monto),
        moneda: g.moneda as Moneda,
        fechaVencimiento: null,
        diasVencido: 0,
        estado: 'POR_COBRAR',
      });
    }

    return items;
  } catch (err) {
    console.error('Error in getAllReceivables:', err);
    return [];
  }
}

// ============================================================
// OBTENER STATS FINANCIEROS GLOBALES
// ============================================================

export async function getFinancesDashboardData(): Promise<FinancesDashboardData> {
  try {
    await requireVertical('legal');
    const supabase = await createServerSupabase();

    // Receivables para totales por cobrar
    const items = await getAllReceivables();

    // Sumarizar por moneda
    let totalPorCobrarGTQ = 0;
    let totalPorCobrarUSD = 0;
    let totalVencidoGTQ = 0;
    let totalVencidoUSD = 0;
    let cantidadCuotasVencidas = 0;
    let cantidadGastosPorCobrar = 0;

    for (const item of items) {
      if (item.moneda === 'GTQ') {
        totalPorCobrarGTQ += item.monto;
        if (item.estado === 'VENCIDO') totalVencidoGTQ += item.monto;
      } else {
        totalPorCobrarUSD += item.monto;
        if (item.estado === 'VENCIDO') totalVencidoUSD += item.monto;
      }

      if (item.type === 'installment' && item.estado === 'VENCIDO') {
        cantidadCuotasVencidas++;
      }
      if (item.type === 'expense') {
        cantidadGastosPorCobrar++;
      }
    }

    // Cobros del mes actual y anterior
    const ahora = new Date();
    const inicioMesActual = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      1
    ).toISOString();
    const inicioMesAnterior = new Date(
      ahora.getFullYear(),
      ahora.getMonth() - 1,
      1
    ).toISOString();
    const finMesAnterior = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      0,
      23,
      59,
      59
    ).toISOString();

    const { data: pagosMesActual } = await supabase
      .from('legal_payments')
      .select('monto, moneda')
      .gte('fecha_pago', inicioMesActual);

    const { data: pagosMesAnterior } = await supabase
      .from('legal_payments')
      .select('monto, moneda')
      .gte('fecha_pago', inicioMesAnterior)
      .lte('fecha_pago', finMesAnterior);

    let cobradoMesActualGTQ = 0;
    let cobradoMesActualUSD = 0;
    let cobradoMesAnteriorGTQ = 0;
    let cobradoMesAnteriorUSD = 0;

    for (const p of pagosMesActual || []) {
      if (p.moneda === 'GTQ') cobradoMesActualGTQ += Number(p.monto);
      else cobradoMesActualUSD += Number(p.monto);
    }

    for (const p of pagosMesAnterior || []) {
      if (p.moneda === 'GTQ') cobradoMesAnteriorGTQ += Number(p.monto);
      else cobradoMesAnteriorUSD += Number(p.monto);
    }

    const topDeudores = calcularTopDeudores(items, 5);

    return {
      totalPorCobrarGTQ,
      totalPorCobrarUSD,
      totalVencidoGTQ,
      totalVencidoUSD,
      cobradoMesActualGTQ,
      cobradoMesActualUSD,
      cobradoMesAnteriorGTQ,
      cobradoMesAnteriorUSD,
      cantidadCuotasVencidas,
      cantidadGastosPorCobrar,
      topDeudores,
    };
  } catch (err) {
    console.error('Error in getFinancesDashboardData:', err);
    return {
      totalPorCobrarGTQ: 0,
      totalPorCobrarUSD: 0,
      totalVencidoGTQ: 0,
      totalVencidoUSD: 0,
      cobradoMesActualGTQ: 0,
      cobradoMesActualUSD: 0,
      cobradoMesAnteriorGTQ: 0,
      cobradoMesAnteriorUSD: 0,
      cantidadCuotasVencidas: 0,
      cantidadGastosPorCobrar: 0,
      topDeudores: [],
    };
  }
}