'use client';

import { useState } from 'react';
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
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  DollarSign,
} from 'lucide-react';
import {
  LegalFeeInstallment,
  LegalPaymentWithRelations,
} from '@/app/legal/finances/types';
import {
  formatMoney,
  METODOS_PAGO,
  Moneda,
} from '@/app/legal/finances/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { PaymentDialog } from './payment-dialog';
import { DeletePaymentDialog } from './delete-payment-dialog';

type Props = {
  payments: LegalPaymentWithRelations[];
  caseId: string;
  moneda: Moneda;
  installments: LegalFeeInstallment[];
  modalidad: 'UNICO' | 'CUOTAS' | 'POR_ETAPA';
};

export function PaymentsList({
  payments,
  caseId,
  moneda,
  installments,
  modalidad,
}: Props) {
  const [editing, setEditing] = useState<LegalPaymentWithRelations | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const getMetodoInfo = (metodo: string) =>
    METODOS_PAGO.find((m) => m.value === metodo) ?? METODOS_PAGO[METODOS_PAGO.length - 1];

  const handleEdit = (payment: LegalPaymentWithRelations) => {
    setEditing(payment);
    setEditOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              Sin pagos registrados
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Usa el botón &quot;Registrar pago&quot; para añadir el primero
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Historial de pagos ({payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {payments.map((pago) => {
              const metodoInfo = getMetodoInfo(pago.metodo);
              const MetodoIcon = metodoInfo.icon;
              const autor = pago.created_by_profile
                ? `${pago.created_by_profile.first_name} ${pago.created_by_profile.last_name}`.trim()
                : 'Sistema';

              return (
                <div
                  key={pago.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {/* Icono */}
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">
                            {formatMoney(pago.monto, pago.moneda)}
                          </span>
                          <Badge variant="outline" className="text-xs gap-1">
                            <MetodoIcon className="w-3 h-3" />
                            {metodoInfo.label}
                          </Badge>
                          {pago.installment && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Cuota #{pago.installment.numero}
                              {pago.installment.concepto &&
                                ` — ${pago.installment.concepto}`}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                          <span>
                            {format(new Date(pago.fecha_pago), "d 'de' MMM yyyy", {
                              locale: es,
                            })}
                          </span>
                          <span>•</span>
                          <span>{autor}</span>
                          {pago.referencia && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{pago.referencia}</span>
                            </>
                          )}
                        </div>

                        {pago.notas && (
                          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                            {pago.notas}
                          </p>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(pago)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(pago.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <PaymentDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        caseId={caseId}
        moneda={moneda}
        installments={installments}
        modalidad={modalidad}
        editingPayment={editing}
      />

      {/* Modal de confirmación de eliminar */}
      <DeletePaymentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        paymentId={deleteId}
      />
    </>
  );
}
