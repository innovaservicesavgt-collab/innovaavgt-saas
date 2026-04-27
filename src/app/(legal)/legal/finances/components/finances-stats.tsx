import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Users,
} from 'lucide-react';
import { formatMoney } from '@/app/(legal)/legal/finances/constants';
import type { FinancesDashboardData } from '@/app/(legal)/legal/finances/types';
import { cn } from '@/lib/utils';

type Props = {
  data: FinancesDashboardData;
};

export function FinancesStats({ data }: Props) {
  const variacionMensual = calcularVariacion(
    data.cobradoMesActualGTQ,
    data.cobradoMesAnteriorGTQ
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total por cobrar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">
                Total por cobrar
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatMoney(data.totalPorCobrarGTQ, 'GTQ')}
              </p>
              {data.totalPorCobrarUSD > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  + {formatMoney(data.totalPorCobrarUSD, 'USD')}
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 shrink-0">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vencido */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">Vencido</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatMoney(data.totalVencidoGTQ, 'GTQ')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.cantidadCuotasVencidas} cuota(s) vencida(s)
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cobrado este mes */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">
                Cobrado este mes
              </p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatMoney(data.cobradoMesActualGTQ, 'GTQ')}
              </p>
              {variacionMensual !== null && (
                <p
                  className={cn(
                    'text-xs mt-1',
                    variacionMensual >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {variacionMensual >= 0 ? 'â†‘' : 'â†“'}{' '}
                  {Math.abs(variacionMensual).toFixed(1)}% vs mes anterior
                </p>
              )}
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-50 shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clientes deudores */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-600">
                Clientes deudores
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data.topDeudores.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {data.cantidadGastosPorCobrar} gasto(s) por cobrar
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50 shrink-0">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calcularVariacion(actual: number, anterior: number): number | null {
  if (anterior === 0) {
    return actual > 0 ? 100 : null;
  }
  return ((actual - anterior) / anterior) * 100;
}