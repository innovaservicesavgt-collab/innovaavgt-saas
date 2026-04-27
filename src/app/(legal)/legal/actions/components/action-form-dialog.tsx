'use client';

import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { actionSchema, ActionFormData } from '../schema';
import { createAction, updateAction } from '../actions';
import { LegalActionWithRelations } from '../types';
import { TIPOS_ACTUACION_MANUAL } from '../constants';

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAction?: LegalActionWithRelations | null;
  cases: CaseOption[];
  defaultCaseId?: string;
};

export function ActionFormDialog({
  open,
  onOpenChange,
  editingAction,
  cases,
  defaultCaseId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingAction;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      tipo: 'MEMORIAL_PRESENTADO',
      descripcion: '',
      case_id: '',
      fecha: formatDatetimeLocal(new Date().toISOString()),
    },
  });

  useEffect(() => {
    if (editingAction) {
      reset({
        tipo: editingAction.tipo,
        descripcion: editingAction.descripcion,
        case_id: editingAction.case_id,
        fecha: formatDatetimeLocal(editingAction.fecha),
      });
    } else {
      reset({
        tipo: 'MEMORIAL_PRESENTADO',
        descripcion: '',
        case_id: defaultCaseId ?? '',
        fecha: formatDatetimeLocal(new Date().toISOString()),
      });
    }
  }, [editingAction, open, reset, defaultCaseId]);

  const tipoActual = watch('tipo');
  const caseActual = watch('case_id');

  const onSubmit = (data: ActionFormData) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateAction(editingAction.id, data)
        : await createAction(data);

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        reset();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar actuación' : 'Nueva actuación'}
          </DialogTitle>
          <DialogDescription>
            Registra un hecho relevante en el expediente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de actuación *</Label>
            <Select
              value={tipoActual}
              onValueChange={(val) => setValue('tipo', val)}
            >
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ACTUACION_MANUAL.map((t) => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: t.hex }}
                        />
                        {t.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Expediente */}
          <div className="space-y-2">
            <Label htmlFor="case_id">Expediente *</Label>
            {cases.length === 0 ? (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                No hay expedientes activos. Crea uno primero.
              </div>
            ) : (
              <Select
                value={caseActual}
                onValueChange={(val) => setValue('case_id', val)}
                disabled={!!defaultCaseId}
              >
                <SelectTrigger id="case_id">
                  <SelectValue placeholder="Selecciona un expediente..." />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-mono">{c.numero_interno}</span>
                      {c.client?.nombre && (
                        <span className="text-gray-500 ml-2">
                          — {c.client.nombre}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.case_id && (
              <p className="text-sm text-red-600">{errors.case_id.message}</p>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha y hora *</Label>
            <Input
              id="fecha"
              type="datetime-local"
              {...register('fecha')}
            />
            {errors.fecha && (
              <p className="text-sm text-red-600">{errors.fecha.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Describe lo que ocurrió, resultados, observaciones..."
              rows={5}
            />
            {errors.descripcion && (
              <p className="text-sm text-red-600">{errors.descripcion.message}</p>
            )}
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
            <Button 
              type="submit" 
              disabled={isPending || cases.length === 0}
            >
              {isPending
                ? 'Guardando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Registrar actuación'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatDatetimeLocal(isoString: string): string {
  const fecha = new Date(isoString);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const hour = String(fecha.getHours()).padStart(2, '0');
  const minute = String(fecha.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}