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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  createExpense,
  updateExpense,
} from '@/app/legal/finances/expense-actions';
import {
  MONEDAS,
  getMonedaSymbol,
} from '@/app/legal/finances/constants';
import type { Moneda } from '@/app/legal/finances/constants';
import type {
  LegalExpenseWithRelations,
  TipoGastoCatalog,
} from '@/app/legal/finances/types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  tiposGasto: TipoGastoCatalog[];
  editingExpense?: LegalExpenseWithRelations | null;
};

const CATEGORIAS_LABEL: Record<string, string> = {
  TIMBRE: 'Timbres',
  COPIAS: 'Copias y certificaciones',
  HONORARIOS_3RO: 'Honorarios de terceros',
  TRANSPORTE: 'Transporte',
  TASA_JUDICIAL: 'Tasas judiciales',
  INSCRIPCION: 'Inscripciones',
  OTRO: 'Otros',
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function groupByCategoria(tipos: TipoGastoCatalog[]) {
  const groups: { [key: string]: TipoGastoCatalog[] } = {};
  for (const tipo of tipos) {
    const cat = tipo.categoria;
    if (!groups[cat]) {
      groups[cat] = [];
    }
    groups[cat].push(tipo);
  }
  return groups;
}

export function ExpenseDialog({
  open,
  onOpenChange,
  caseId,
  tiposGasto,
  editingExpense,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingExpense;

  const [tipoGastoId, setTipoGastoId] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [moneda, setMoneda] = useState<Moneda>('GTQ');
  const [fecha, setFecha] = useState<string>(todayISO());
  const [descripcion, setDescripcion] = useState<string>('');
  const [recuperable, setRecuperable] = useState<boolean>(true);
  const [cobrado, setCobrado] = useState<boolean>(false);
  const [fechaCobrado, setFechaCobrado] = useState<string>('');

  const tiposPorCategoria = groupByCategoria(tiposGasto);

  useEffect(() => {
    if (open) {
      if (editingExpense) {
        setTipoGastoId(editingExpense.tipo_gasto_id);
        setMonto(String(editingExpense.monto));
        setMoneda(editingExpense.moneda);
        setFecha(editingExpense.fecha);
        setDescripcion(editingExpense.descripcion || '');
        setRecuperable(editingExpense.recuperable);
        setCobrado(editingExpense.cobrado);
        setFechaCobrado(editingExpense.fecha_cobrado || '');
      } else {
        setTipoGastoId('');
        setMonto('');
        setMoneda('GTQ');
        setFecha(todayISO());
        setDescripcion('');
        setRecuperable(true);
        setCobrado(false);
        setFechaCobrado('');
      }
    }
  }, [open, editingExpense]);

  const handleTipoChange = (newId: string) => {
    setTipoGastoId(newId);
    const tipo = tiposGasto.find((t) => t.id === newId);
    if (tipo && !isEditing) {
      setRecuperable(tipo.recuperable_default);
    }
  };

  const handleCobradoChange = (val: boolean) => {
    setCobrado(val);
    if (val && !fechaCobrado) {
      setFechaCobrado(todayISO());
    }
  };

  const handleSubmit = () => {
    const montoNum = Number(monto);
    if (!monto || montoNum <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    if (!tipoGastoId) {
      toast.error('Selecciona un tipo de gasto');
      return;
    }
    if (!fecha) {
      toast.error('La fecha es obligatoria');
      return;
    }
    if (cobrado && !fechaCobrado) {
      toast.error('Indica la fecha en que se cobró');
      return;
    }
    if (cobrado && !recuperable) {
      toast.error('Solo los gastos recuperables pueden marcarse como cobrados');
      return;
    }

    const input = {
      case_id: caseId,
      tipo_gasto_id: tipoGastoId,
      monto: montoNum,
      moneda,
      fecha,
      descripcion: descripcion.trim() || undefined,
      recuperable,
      cobrado: recuperable ? cobrado : false,
      fecha_cobrado: cobrado && recuperable ? fechaCobrado : null,
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateExpense(editingExpense!.id, input)
        : await createExpense(input);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  const categoriasOrdenadas = Object.keys(tiposPorCategoria).sort((a, b) => {
    const orden: { [key: string]: number } = {
      TIMBRE: 1,
      COPIAS: 2,
      HONORARIOS_3RO: 3,
      TRANSPORTE: 4,
      TASA_JUDICIAL: 5,
      INSCRIPCION: 6,
      OTRO: 7,
    };
    return (orden[a] || 99) - (orden[b] || 99);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar gasto' : 'Registrar gasto'}
          </DialogTitle>
          <DialogDescription>
            Registra un gasto del proceso (timbres, copias, peritos, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de gasto *</Label>
            <Select value={tipoGastoId} onValueChange={handleTipoChange}>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {categoriasOrdenadas.map((cat) => (
                  <SelectGroup key={cat}>
                    <SelectLabel>
                      {CATEGORIAS_LABEL[cat] || cat}
                    </SelectLabel>
                    {tiposPorCategoria[cat].map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="monto">Monto *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={moneda}
                onValueChange={(v) => setMoneda(v as Moneda)}
              >
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

          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha del gasto *</Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles específicos del gasto..."
              rows={2}
            />
          </div>

          <Card>
            <CardContent className="py-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recuperable}
                  onChange={(e) => {
                    setRecuperable(e.target.checked);
                    if (!e.target.checked) {
                      setCobrado(false);
                      setFechaCobrado('');
                    }
                  }}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    Cobrar al cliente
                  </div>
                  <p className="text-xs text-gray-500">
                    Este gasto se sumará a las cuentas por cobrar del cliente
                  </p>
                </div>
              </label>

              {recuperable && (
                <label className="flex items-start gap-3 cursor-pointer pl-6 pt-2 border-t border-gray-100">
                  <input
                    type="checkbox"
                    checked={cobrado}
                    onChange={(e) => handleCobradoChange(e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      Ya cobrado al cliente
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      Marca si ya recibiste el reembolso de este gasto
                    </p>
                    {cobrado && (
                      <div>
                        <Label htmlFor="fecha-cobrado" className="text-xs">
                          Fecha de cobro
                        </Label>
                        <Input
                          id="fecha-cobrado"
                          type="date"
                          value={fechaCobrado}
                          onChange={(e) => setFechaCobrado(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </label>
              )}
            </CardContent>
          </Card>
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
              : 'Registrar gasto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}