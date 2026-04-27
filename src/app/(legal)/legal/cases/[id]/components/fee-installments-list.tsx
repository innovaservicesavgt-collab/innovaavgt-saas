'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LegalFeeInstallment } from '@/app/(legal)/legal/finances/types';
import {
  formatMoney,
  getEstadoCuotaInfo,
  Moneda,
} from '@/app/(legal)/legal/finances/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Props = {
  installments: LegalFeeInstallment[];
  moneda: Moneda;
};

export function FeeInstallmentsList({ installments, moneda }: Props) {
  const ahora = new Date();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Cuotas ({installments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {installments.map((inst) => {
            const venc = new Date(inst.fecha_vencimiento);
            const vencida = venc < ahora && inst.estado !== 'PAGADA';
            const estado = getEstadoCuotaInfo(
              vencida && inst.estado === 'PENDIENTE' ? 'VENCIDA' : inst.estado
            );
            const EstadoIcon = estado.icon;
            const saldoCuota = Number(inst.monto) - Number(inst.monto_pagado || 0);

            return (
              <div
                key={inst.id}
                className={cn(
                  'flex items-center justify-between gap-3 p-3 rounded-lg border',
                  inst.estado === 'PAGADA'
                    ? 'bg-green-50 border-green-200'
                    : vencida
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200'
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white border shrink-0">
                    <span className="text-sm font-semibold text-gray-700">
                      {inst.numero}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">
                        {inst.concepto || `Cuota ${inst.numero}`}
                      </span>
                      <Badge className={cn(estado.color, 'hover:opacity-80 text-xs')}>
                        <EstadoIcon className="w-3 h-3 mr-1" />
                        {estado.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Vence:{' '}
                      {format(venc, "d 'de' MMM yyyy", { locale: es })}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-semibold text-gray-900">
                    {formatMoney(inst.monto, moneda)}
                  </div>
                  {inst.monto_pagado > 0 && inst.estado !== 'PAGADA' && (
                    <div className="text-xs text-gray-500">
                      Abonado: {formatMoney(inst.monto_pagado, moneda)}
                    </div>
                  )}
                  {saldoCuota > 0 && inst.estado !== 'PAGADA' && inst.estado !== 'PENDIENTE' && (
                    <div className="text-xs text-amber-600">
                      Saldo: {formatMoney(saldoCuota, moneda)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}