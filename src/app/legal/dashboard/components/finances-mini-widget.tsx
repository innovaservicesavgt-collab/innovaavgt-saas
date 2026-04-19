import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ChevronRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/app/legal/finances/constants';
import type { FinancesDashboardData } from '@/app/legal/finances/types';

type Props = {
  data: FinancesDashboardData;
};

export function FinancesMiniWidget({ data }: Props) {
  const hayCobrado =
    data.cobradoMesActualGTQ > 0 || data.cobradoMesActualUSD > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Finanzas
          </CardTitle>
          <Link
            href="/legal/finances"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            Ver todo
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Cobrado este mes */}
        <div>
          <p className="text-xs text-gray-600">Cobrado este mes</p>
          <p className="text-2xl font-bold text-green-600">
            {formatMoney(data.cobradoMesActualGTQ, 'GTQ')}
          </p>
          {data.cobradoMesActualUSD > 0 && (
            <p className="text-xs text-gray-500">
              + {formatMoney(data.cobradoMesActualUSD, 'USD')}
            </p>
          )}
        </div>

        {/* Por cobrar */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total por cobrar</p>
              <p className="text-lg font-semibold text-amber-700">
                {formatMoney(data.totalPorCobrarGTQ, 'GTQ')}
              </p>
            </div>
            {data.cantidadCuotasVencidas > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-red-600 text-xs mb-1">
                  <AlertTriangle className="w-3 h-3" />
                  {data.cantidadCuotasVencidas} vencida(s)
                </div>
                <p className="text-sm font-medium text-red-600">
                  {formatMoney(data.totalVencidoGTQ, 'GTQ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {!hayCobrado && data.totalPorCobrarGTQ === 0 && (
          <div className="text-center text-xs text-gray-500 py-2">
            Sin actividad financiera aún
          </div>
        )}
      </CardContent>
    </Card>
  );
}