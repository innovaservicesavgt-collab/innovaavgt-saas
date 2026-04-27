import { FinancesStats } from './finances-stats';
import { OverdueInstallmentsList } from './overdue-installments-list';
import { ReceivablesTable } from './receivables-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { formatMoney } from '@/app/(legal)/legal/finances/constants';
import type {
  FinancesDashboardData,
  ReceivableItem,
} from '@/app/(legal)/legal/finances/types';

type Props = {
  data: FinancesDashboardData;
  receivables: ReceivableItem[];
};

export function FinancesPageClient({ data, receivables }: Props) {
  return (
    <div className="space-y-6">
      {/* Stats globales */}
      <FinancesStats data={data} />

      {/* Grid de 2 columnas: Vencidos + Top deudores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <OverdueInstallmentsList items={receivables} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Top clientes deudores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topDeudores.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500">
                Sin deudores registrados
              </div>
            ) : (
              <div className="space-y-2">
                {data.topDeudores.map((d, idx) => (
                  <div
                    key={d.clientId}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-purple-700">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {d.clientName}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {d.cantidadItems} item(s) â€¢ {Math.round(d.diasVencidoPromedio)}{' '}
                        dÃ­as promedio
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-gray-900">
                        {formatMoney(d.totalAdeudado, d.moneda)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabla completa */}
      <ReceivablesTable items={receivables} />
    </div>
  );
}