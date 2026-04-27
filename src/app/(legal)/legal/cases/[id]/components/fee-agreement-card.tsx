'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  Plus,
} from 'lucide-react';
import { FeeAgreementWithInstallments } from '@/app/legal/finances/types';
import {
  formatMoney,
  getModalidadInfo,
  getEstadoAcuerdoInfo,
} from '@/app/legal/finances/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { FeeAgreementDialog } from './fee-agreement-dialog';
import { FeeInstallmentsList } from './fee-installments-list';
import { PaymentDialog } from './payment-dialog';
import { deleteAgreement } from '@/app/legal/finances/actions';
import { toast } from 'sonner';

type Props = {
  agreement: FeeAgreementWithInstallments;
  caseId: string;
};

export function FeeAgreementCard({ agreement, caseId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const modalidad = getModalidadInfo(agreement.modalidad);
  const estado = getEstadoAcuerdoInfo(agreement.estado);
  const ModalidadIcon = modalidad.icon;
  const EstadoIcon = estado.icon;

  const handleDelete = () => {
    if (
      !confirm(
        '¿Eliminar este acuerdo de honorarios? Esta acción no se puede deshacer.'
      )
    )
      return;

    startTransition(async () => {
      const result = await deleteAgreement(agreement.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* ===== CARD PRINCIPAL ===== */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={cn(modalidad.color, 'hover:opacity-80')}>
                    <ModalidadIcon className="w-3 h-3 mr-1" />
                    {modalidad.label}
                  </Badge>
                  <Badge className={cn(estado.color, 'hover:opacity-80')}>
                    <EstadoIcon className="w-3 h-3 mr-1" />
                    {estado.label}
                  </Badge>
                </div>
                <CardTitle className="text-2xl text-gray-900">
                  {formatMoney(agreement.monto_total, agreement.moneda)}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Acuerdo del{' '}
                  {format(new Date(agreement.fecha_acuerdo), "d 'de' MMM yyyy", {
                    locale: es,
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {agreement.estado !== 'PAGADO' &&
                  agreement.estado !== 'CANCELADO' && (
                    <Button size="sm" onClick={() => setPaymentOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar pago
                    </Button>
                  )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar acuerdo
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isPending}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar acuerdo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progreso de pago</span>
                <span className="text-sm font-medium text-gray-900">
                  {agreement.stats.porcentajePagado.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${agreement.stats.porcentajePagado}%` }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-xs text-green-700 mb-1">Pagado</div>
                <div className="text-lg font-bold text-green-900">
                  {formatMoney(agreement.stats.totalPagado, agreement.moneda)}
                </div>
              </div>

              <div className="bg-amber-50 rounded-lg p-3">
                <div className="text-xs text-amber-700 mb-1">Pendiente</div>
                <div className="text-lg font-bold text-amber-900">
                  {formatMoney(agreement.stats.totalPendiente, agreement.moneda)}
                </div>
              </div>

              {agreement.modalidad !== 'UNICO' && (
                <>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-700 mb-1">Cuotas pagadas</div>
                    <div className="text-lg font-bold text-blue-900">
                      {agreement.stats.cuotasPagadas} / {agreement.installments.length}
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-xs text-red-700 mb-1">Vencidas</div>
                    <div className="text-lg font-bold text-red-900">
                      {agreement.stats.cuotasVencidas}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Próxima cuota */}
            {agreement.stats.proximaCuota && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Próxima cuota
                  </span>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-semibold text-gray-900">
                      Cuota #{agreement.stats.proximaCuota.numero}
                      {agreement.stats.proximaCuota.concepto && (
                        <span className="font-normal text-gray-600 ml-2">
                          — {agreement.stats.proximaCuota.concepto}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Vence el{' '}
                      {format(
                        new Date(agreement.stats.proximaCuota.fecha_vencimiento),
                        "d 'de' MMMM yyyy",
                        { locale: es }
                      )}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatMoney(
                      agreement.stats.proximaCuota.monto,
                      agreement.moneda
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notas */}
            {agreement.notas && (
              <div className="flex gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <FileText className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                <p className="whitespace-pre-wrap">{agreement.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== LISTA DE CUOTAS (si aplica) ===== */}
        {agreement.modalidad !== 'UNICO' &&
          agreement.installments.length > 0 && (
            <FeeInstallmentsList
              installments={agreement.installments}
              moneda={agreement.moneda}
            />
          )}
      </div>

      {/* ===== MODAL DE EDICIÓN ===== */}
      <FeeAgreementDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        caseId={caseId}
        agreement={agreement}
      />

      {/* ===== MODAL DE PAGO ===== */}
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        caseId={caseId}
        moneda={agreement.moneda}
        installments={agreement.installments}
        modalidad={agreement.modalidad}
      />
    </>
  );
}