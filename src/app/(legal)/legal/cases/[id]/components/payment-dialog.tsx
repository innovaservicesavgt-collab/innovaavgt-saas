'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  createPayment,
  updatePayment,
} from '@/app/(legal)/legal/finances/payment-actions';
import {
  METODOS_PAGO,
  formatMoney,
  getMonedaSymbol,
  Moneda,
} from '@/app/(legal)/legal/finances/constants';
import {
  LegalFeeInstallment,
  LegalPaymentWithRelations,
} from '@/app/(legal)/legal/finances/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  moneda: Moneda;
  installments: LegalFeeInstallment[];
  modalidad: 'UNICO' | 'CUOTAS' | 'POR_ETAPA';
  editingPayment?: LegalPaymentWithRelations | null;
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function PaymentDialog({
  open,
  onOpenChange,
  caseId,
  moneda,
  installments,
  modalidad,
  editingPayment,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingPayment;

  const [monto, setMonto] = useState<string>('');
  const [fechaPago, setFechaPago] = useState<string>(todayISO());
  const [metodo, setMetodo] = useState<string>('EFECTIVO');
  const [installmentId, setInstallmentId] = useState<string>('');
  const [referencia, setReferencia] = useState<string>('');
  const [notas, setNotas] = useState<string>('');

  // Cuotas disponibles para aplicar
  const cuotasDisponibles = installments.filter(
    (i) => i.estado !== 'PAGADA'
  );

  // Al abrir el dialog, setear valores
  useEffect(() => {
    if (open) {
      if (editingPayment) {
        // Modo ediciÃ³n
        setMonto(String(editingPayment.monto));
        setFechaPago(editingPayment.fecha_pago);
        setMetodo(editingPayment.metodo);
        setInstallmentId(editingPayment.installment_id || 'NINGUNA');
        setReferencia(editingPayment.referencia || '');
        setNotas(editingPayment.notas || '');
      } else {
        // Modo crear: sugerir prÃ³xima cuota si hay
        setMonto('');
        setFechaPago(todayISO());
        setMetodo('EFECTIVO');
        setReferencia('');
        setNotas('');

        if (modalidad === 'UNICO') {
          setInstallmentId('NINGUNA');
        } else if (cuotasDisponibles.length > 0) {
          const proxima = cuotasDisponibles[0];
          setInstallmentId(proxima.id);
          // Auto-sugerir el monto pendiente de la prÃ³xima cuota
          const pendiente =
            Number(proxima.monto) - Number(proxima.monto_pagado || 0);
          setMonto(String(pendiente));
        } else {
          setInstallmentId('NINGUNA');
        }
      }
    }
  }, [open, editingPayment, modalidad, cuotasDisponibles]);

  // Al cambiar cuota seleccionada, auto-llenar el monto pendiente
  const handleInstallmentChange = (newId: string) => {
    setInstallmentId(newId);
    if (newId && newId !== 'NINGUNA' && !isEditing) {
      const inst = cuotasDisponibles.find((i) => i.id === newId);
      if (inst) {
        const pendiente = Number(inst.monto) - Number(inst.monto_pagado || 0);
        setMonto(String(pendiente));
      }
    }
  };

  const handleSubmit = () => {
    const montoNum = Number(monto);
    if (!monto || montoNum <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    if (!fechaPago) {
      toast.error('La fecha del pago es obligatoria');
      return;
    }

    const input = {
      case_id: caseId,
      installment_id:
        installmentId && installmentId !== 'NINGUNA' ? installmentId : null,
      monto: montoNum,
      moneda,
      fecha_pago: fechaPago,
      metodo: metodo as 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'DEPOSITO' | 'TARJETA' | 'OTRO',
      referencia: referencia.trim() || undefined,
      notas: notas.trim() || undefined,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updatePayment(editingPayment!.id, input)
        : await createPayment(input);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar pago' : 'Registrar pago'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los detalles del pago'
              : 'Registra un pago recibido del cliente'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="monto">Monto recibido *</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                {getMonedaSymbol(moneda)}
              </div>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha del pago *</Label>
            <Input
              id="fecha"
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
            />
          </div>

          {/* MÃ©todo */}
          <div className="space-y-2">
            <Label htmlFor="metodo">MÃ©todo de pago *</Label>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger id="metodo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGO.map((m) => {
                  const Icon = m.icon;
                  return (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {m.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Aplicar a cuota (solo si no es UNICO) */}
          {modalidad !== 'UNICO' && (
            <div className="space-y-2">
              <Label htmlFor="cuota">Aplicar a cuota</Label>
              <Select value={installmentId} onValueChange={handleInstallmentChange}>
                <SelectTrigger id="cuota">
                  <SelectValue placeholder="Seleccionar cuota..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NINGUNA">
                    Sin aplicar a cuota especÃ­fica
                  </SelectItem>
                  {installments.map((inst) => {
                    const pendiente =
                      Number(inst.monto) - Number(inst.monto_pagado || 0);
                    const yaEsPagada = inst.estado === 'PAGADA';
                    // Solo mostrar la cuota actual si estÃ¡ editando y tiene esa cuota
                    const mostrarEnEdicion =
                      isEditing && editingPayment?.installment_id === inst.id;
                    if (yaEsPagada && !mostrarEnEdicion) return null;

                    return (
                      <SelectItem key={inst.id} value={inst.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">
                            #{inst.numero}
                          </span>
                          <span>
                            {inst.concepto || `Cuota ${inst.numero}`}
                          </span>
                          <span className="text-gray-500">
                            â€” {formatMoney(pendiente, moneda)} pendiente
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Referencia */}
          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia</Label>
            <Input
              id="referencia"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: NÃºmero de boleta, ref. transferencia..."
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Observaciones del pago..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? 'Guardando...'
              : isEditing
              ? 'Guardar cambios'
              : 'Registrar pago'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}