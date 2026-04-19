import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/app/legal/finances/constants';
import type { ReceivableItem } from '@/app/legal/finances/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Props = {
  items: ReceivableItem[];
};

export function OverdueInstallmentsList({ items }: Props) {
  const vencidos = items
    .filter((i) => i.estado === 'VENCIDO')
    .sort((a, b) => b.diasVencido - a.diasVencido)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Cuotas vencidas
          </CardTitle>
          {vencidos.length > 10 && (
            <span className="text-xs text-gray-500">Mostrando 10 más críticas</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {vencidos.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500">
            ✅ No hay cuotas vencidas
          </div>
        ) : (
          vencidos.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={`/legal/cases/${item.caseId}`}
              className="block"
            >
              <div
                className={cn(
                  'p-3 rounded-lg border transition-colors hover:bg-gray-50',
                  item.diasVencido > 30
                    ? 'border-red-300 bg-red-50'
                    : 'border-amber-200 bg-amber-50'
                )}
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {item.concepto}
                      </span>
                      <Badge
                        className={cn(
                          'text-xs',
                          item.diasVencido > 30
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {item.diasVencido} día{item.diasVencido !== 1 && 's'} vencido
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                      <span className="font-mono text-blue-600">
                        {item.caseNumber}
                      </span>
                      {item.clientName && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.clientName}</span>
                        </>
                      )}
                      {item.fechaVencimiento && (
                        <>
                          <span>•</span>
                          <span>
                            Venció:{' '}
                            {format(new Date(item.fechaVencimiento), 'd MMM yyyy', {
                              locale: es,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-red-700">
                      {formatMoney(item.monto, item.moneda)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}