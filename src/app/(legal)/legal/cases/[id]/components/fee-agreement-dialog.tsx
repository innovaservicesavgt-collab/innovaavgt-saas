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
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import {
  createAgreement,
  updateAgreement,
} from '@/app/(legal)/legal/finances/actions';
import {
  MODALIDADES,
  MONEDAS,
  Moneda,
  ModalidadHonorario,
  formatMoney,
  getMonedaSymbol,
} from '@/app/(legal)/legal/finances/constants';
import {
  FeeAgreementWithInstallments,
  InstallmentInput,
} from '@/app/(legal)/legal/finances/types';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  agreement: FeeAgreementWithInstallments | null;
};

// Utilidad para formatear fecha a yyyy-MM-dd
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function FeeAgreementDialog({
  open,
  onOpenChange,
  caseId,
  agreement,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!agreement;

  // Estado del formulario
  const [montoTotal, setMontoTotal] = useState<string>('');
  const [moneda, setMoneda] = useState<Moneda>('GTQ');
  const [modalidad, setModalidad] = useState<ModalidadHonorario>('UNICO');
  const [numeroCuotas, setNumeroCuotas] = useState<string>('3');
  const [installments, setInstallments] = useState<InstallmentInput[]>([]);
  const [notas, setNotas] = useState<string>('');
  const [fechaAcuerdo, setFechaAcuerdo] = useState<string>(todayISO());

  // Cargar datos al abrir (modo ediciÃ³n)
  useEffect(() => {
    if (open && agreement) {
      setMontoTotal(String(agreement.monto_total));
      setMoneda(agreement.moneda);
      setModalidad(agreement.modalidad);
      setNumeroCuotas(String(agreement.numero_cuotas || 3));
      setNotas(agreement.notas || '');
      setFechaAcuerdo(agreement.fecha_acuerdo);

      if (agreement.installments && agreement.installments.length > 0) {
        setInstallments(
          agreement.installments.map((i) => ({
            numero: i.numero,
            concepto: i.concepto || '',
            monto: Number(i.monto),
            fecha_vencimiento: i.fecha_vencimiento,
          }))
        );
      }
    } else if (open && !agreement) {
      // Reset al abrir en modo crear
      setMontoTotal('');
      setMoneda('GTQ');
      setModalidad('UNICO');
      setNumeroCuotas('3');
      setInstallments([]);
      setNotas('');
      setFechaAcuerdo(todayISO());
    }
  }, [open, agreement]);

  // Auto-generar cuotas cuando cambia la modalidad/nÃºmero
  const handleModalidadChange = (nueva: ModalidadHonorario) => {
    setModalidad(nueva);
    if (nueva === 'UNICO') {
      setInstallments([]);
    } else {
      regenerateInstallments(nueva, Number(numeroCuotas) || 3, Number(montoTotal) || 0);
    }
  };

  const handleNumeroCuotasChange = (val: string) => {
    setNumeroCuotas(val);
    const n = Number(val);
    if (n > 0 && n <= 60 && modalidad !== 'UNICO') {
      regenerateInstallments(modalidad, n, Number(montoTotal) || 0);
    }
  };

  const handleMontoTotalChange = (val: string) => {
    setMontoTotal(val);
    const m = Number(val);
    if (m > 0 && modalidad !== 'UNICO' && installments.length > 0) {
      // Redistribuir equitativamente
      regenerateInstallments(modalidad, installments.length, m);
    }
  };

  function regenerateInstallments(
    mod: ModalidadHonorario,
    count: number,
    total: number
  ) {
    const montoPorCuota = total > 0 ? Math.floor((total / count) * 100) / 100 : 0;
    const resto = total - montoPorCuota * count;

    const newInstallments: InstallmentInput[] = Array.from({ length: count }, (_, i) => ({
      numero: i + 1,
      concepto: mod === 'POR_ETAPA' ? `Etapa ${i + 1}` : '',
      monto: i === count - 1 ? montoPorCuota + resto : montoPorCuota, // El Ãºltimo absorbe el redondeo
      fecha_vencimiento: addDaysISO((i + 1) * 30),
    }));

    setInstallments(newInstallments);
  }

  const updateInstallment = (
    index: number,
    field: keyof InstallmentInput,
    value: string | number
  ) => {
    setInstallments((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const sumaInstallments = installments.reduce((acc, i) => acc + Number(i.monto || 0), 0);
  const diferencia = Number(montoTotal || 0) - sumaInstallments;

  const handleSubmit = () => {
    // Validaciones bÃ¡sicas
    const montoNum = Number(montoTotal);
    if (!montoTotal || montoNum <= 0) {
      toast.error('El monto total debe ser mayor a 0');
      return;
    }

    if (modalidad !== 'UNICO') {
      const n = Number(numeroCuotas);
      if (!n || n < 1 || n > 60) {
        toast.error('El nÃºmero de cuotas debe estar entre 1 y 60');
        return;
      }

      if (Math.abs(diferencia) > 0.01) {
        toast.error(
          `La suma de las cuotas (${formatMoney(
            sumaInstallments,
            moneda
          )}) no coincide con el total`
        );
        return;
      }

      const hasInvalid = installments.some(
        (i) => !i.monto || i.monto <= 0 || !i.fecha_vencimiento
      );
      if (hasInvalid) {
        toast.error('Completa todas las cuotas correctamente');
        return;
      }
    }

    const input = {
      case_id: caseId,
      monto_total: montoNum,
      moneda,
      modalidad,
      numero_cuotas: modalidad !== 'UNICO' ? Number(numeroCuotas) : undefined,
      installments: modalidad !== 'UNICO' ? installments : undefined,
      notas: notas.trim() || undefined,
      fecha_acuerdo: fechaAcuerdo,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateAgreement(agreement!.id, input)
        : await createAgreement(input);

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar acuerdo de honorarios' : 'Configurar honorarios'}
          </DialogTitle>
          <DialogDescription>
            Define cÃ³mo se cobrarÃ¡n los honorarios de este expediente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* === MONTO + MONEDA === */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="monto">Monto total *</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  {getMonedaSymbol(moneda)}
                </div>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoTotal}
                  onChange={(e) => handleMontoTotalChange(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select value={moneda} onValueChange={(v) => setMoneda(v as Moneda)}>
                <SelectTrigger id="moneda">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONEDAS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.symbol} {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* === MODALIDAD === */}
          <div className="space-y-2">
            <Label>Modalidad de pago *</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {MODALIDADES.map((m) => {
                const Icon = m.icon;
                const selected = modalidad === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => handleModalidadChange(m.value)}
                    className={cn(
                      'text-left border rounded-lg p-3 transition-all',
                      selected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon
                        className={cn(
                          'w-4 h-4',
                          selected ? 'text-blue-600' : 'text-gray-500'
                        )}
                      />
                      <span
                        className={cn(
                          'font-medium text-sm',
                          selected ? 'text-blue-900' : 'text-gray-900'
                        )}
                      >
                        {m.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{m.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* === FECHA ACUERDO === */}
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha del acuerdo *</Label>
            <Input
              id="fecha"
              type="date"
              value={fechaAcuerdo}
              onChange={(e) => setFechaAcuerdo(e.target.value)}
            />
          </div>

          {/* === CUOTAS (solo si no es UNICO) === */}
          {modalidad !== 'UNICO' && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between gap-3">
                <Label>
                  {modalidad === 'CUOTAS' ? 'NÃºmero de cuotas' : 'NÃºmero de etapas'} *
                </Label>
                <div className="w-24">
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={numeroCuotas}
                    onChange={(e) => handleNumeroCuotasChange(e.target.value)}
                  />
                </div>
              </div>

              {installments.length > 0 && (
                <Card>
                  <CardContent className="py-3 space-y-2">
                    {installments.map((inst, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center"
                      >
                        <div className="col-span-1 text-sm font-medium text-gray-500 text-center">
                          #{inst.numero}
                        </div>

                        {modalidad === 'POR_ETAPA' ? (
                          <div className="col-span-4">
                            <Input
                              value={inst.concepto || ''}
                              onChange={(e) =>
                                updateInstallment(idx, 'concepto', e.target.value)
                              }
                              placeholder="Ej: Demanda"
                              className="text-sm"
                            />
                          </div>
                        ) : (
                          <div className="col-span-4 text-sm text-gray-600">
                            Cuota {inst.numero}
                          </div>
                        )}

                        <div className="col-span-4">
                          <Input
                            type="date"
                            value={inst.fecha_vencimiento}
                            onChange={(e) =>
                              updateInstallment(
                                idx,
                                'fecha_vencimiento',
                                e.target.value
                              )
                            }
                            className="text-sm"
                          />
                        </div>

                        <div className="col-span-3">
                          <div className="relative">
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                              {getMonedaSymbol(moneda)}
                            </div>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={inst.monto}
                              onChange={(e) =>
                                updateInstallment(
                                  idx,
                                  'monto',
                                  Number(e.target.value)
                                )
                              }
                              className="pl-6 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Totales */}
                    <div className="border-t pt-2 mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Suma: {formatMoney(sumaInstallments, moneda)}
                      </span>
                      {Math.abs(diferencia) > 0.01 && (
                        <span
                          className={cn(
                            'flex items-center gap-1 font-medium',
                            diferencia > 0 ? 'text-amber-600' : 'text-red-600'
                          )}
                        >
                          <AlertCircle className="w-3 h-3" />
                          {diferencia > 0 ? 'Faltan' : 'Sobran'}:{' '}
                          {formatMoney(Math.abs(diferencia), moneda)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* === NOTAS === */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (opcional)</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Detalles del acuerdo, condiciones especiales..."
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
              : 'Crear acuerdo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}