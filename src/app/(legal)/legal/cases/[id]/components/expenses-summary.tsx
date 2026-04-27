'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Receipt, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import { ExpenseStats } from '@/app/(legal)/legal/finances/types';
import { formatMoney, Moneda } from '@/app/(legal)/legal/finances/constants';

type Props = {
  stats: ExpenseStats;
  moneda: Moneda;
};

export function ExpensesSummary({ stats, moneda }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Total gastado */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-gray-700" />
            </div>
            <div className="text-xs text-gray-600">Total gastado</div>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatMoney(stats.totalGastado, moneda)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.cantidad} {stats.cantidad === 1 ? 'gasto' : 'gastos'}
          </div>
        </CardContent>
      </Card>

      {/* Cobrado */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-700" />
            </div>
            <div className="text-xs text-gray-600">Cobrado</div>
          </div>
          <div className="text-lg font-bold text-green-900">
            {formatMoney(stats.totalCobrado, moneda)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Reembolsado</div>
        </CardContent>
      </Card>

      {/* Pendiente de cobrar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-700" />
            </div>
            <div className="text-xs text-gray-600">Por cobrar</div>
          </div>
          <div className="text-lg font-bold text-amber-900">
            {formatMoney(stats.totalPendienteCobro, moneda)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Adeudado por cliente</div>
        </CardContent>
      </Card>

      {/* No recuperable */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Ban className="w-4 h-4 text-gray-700" />
            </div>
            <div className="text-xs text-gray-600">No recuperable</div>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {formatMoney(stats.totalNoRecuperable, moneda)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Asumido por despacho</div>
        </CardContent>
      </Card>
    </div>
  );
}