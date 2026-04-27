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
import { eventSchema, EventFormData } from '../schema';
import { createEvent, updateEvent } from '../actions';
import { LegalEventWithCase } from '../types';
import { TIPOS_EVENTO, TipoEvento } from '../constants';

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEvent?: LegalEventWithCase | null;
  cases: CaseOption[];
  defaultCaseId?: string; // si se abre desde un expediente
  defaultDate?: string; // si se abre desde un click en el calendario
};

export function EventFormDialog({
  open,
  onOpenChange,
  editingEvent,
  cases,
  defaultCaseId,
  defaultDate,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingEvent;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      titulo: '',
  descripcion: undefined,
  tipo: 'AUDIENCIA',
  case_id: '',
  fecha_hora: '',
  duracion_min: 60,
  lugar: undefined,
    },
  });

  useEffect(() => {
    if (editingEvent) {
      if (editingEvent) {
  reset({
    titulo: editingEvent.titulo,
    descripcion: editingEvent.descripcion ?? undefined,
    tipo: editingEvent.tipo,
    case_id: editingEvent.case_id,
    fecha_hora: formatDatetimeLocal(editingEvent.fecha_hora),
    duracion_min: editingEvent.duracion_min ?? 60,
    lugar: editingEvent.lugar ?? undefined,
  });
} else {
  reset({
    titulo: '',
    descripcion: undefined,
    tipo: 'AUDIENCIA',
    case_id: defaultCaseId ?? '',
    fecha_hora: defaultDate ?? getProximaHoraRedonda(),
    duracion_min: 60,
    lugar: undefined,
  });
}
    }
  }, [editingEvent, open, reset, defaultCaseId, defaultDate]);

  const tipoActual = watch('tipo');
  const caseActual = watch('case_id');

  const onSubmit = (data: EventFormData) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateEvent(editingEvent.id, data)
        : await createEvent(data);

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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar evento' : 'Nuevo evento de agenda'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del evento'
              : 'Registra una audiencia, plazo, memorial o diligencia'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo de evento */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de evento *</Label>
            <Select
              value={tipoActual}
              onValueChange={(val) => setValue('tipo', val as TipoEvento)}
            >
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_EVENTO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: t.hex }}
                      />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              {...register('titulo')}
              placeholder="Ej: Audiencia de primera declaración"
            />
            {errors.titulo && (
              <p className="text-sm text-red-600">{errors.titulo.message}</p>
            )}
          </div>

          {/* Expediente */}
          <div className="space-y-2">
            <Label htmlFor="case_id">Expediente *</Label>
            {cases.length === 0 ? (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                No hay expedientes. Crea uno en{' '}
                <strong>Expedientes</strong> antes de registrar eventos.
              </div>
            ) : (
              <Select
                value={caseActual}
                onValueChange={(val) => setValue('case_id', val)}
                disabled={!!defaultCaseId} // si viene pre-seleccionado, no se puede cambiar
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha y hora */}
            <div className="space-y-2">
              <Label htmlFor="fecha_hora">Fecha y hora *</Label>
              <Input
                id="fecha_hora"
                type="datetime-local"
                {...register('fecha_hora')}
              />
              {errors.fecha_hora && (
                <p className="text-sm text-red-600">{errors.fecha_hora.message}</p>
              )}
            </div>

            {/* Duración */}
            <div className="space-y-2">
              <Label htmlFor="duracion_min">Duración (minutos)</Label>
              <Input
                id="duracion_min"
                type="number"
                min="15"
                max="1440"
                step="15"
                {...register('duracion_min',{ valueAsNumber: true })}
              />
              {errors.duracion_min && (
                <p className="text-sm text-red-600">{errors.duracion_min.message}</p>
              )}
            </div>
          </div>

          {/* Lugar */}
          <div className="space-y-2">
            <Label htmlFor="lugar">Lugar</Label>
            <Input
              id="lugar"
              {...register('lugar')}
              placeholder="Ej: Torre de Tribunales, Sala 5"
            />
            {errors.lugar && (
              <p className="text-sm text-red-600">{errors.lugar.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción / Notas</Label>
            <Textarea
              id="descripcion"
              {...register('descripcion')}
              placeholder="Detalles adicionales, instrucciones, recordatorios..."
              rows={3}
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
                : 'Crear evento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Helper: próxima hora redonda desde ahora (ej: 14:00 si son las 13:23)
 * Formato: YYYY-MM-DDTHH:mm (compatible con input datetime-local)
 */
function getProximaHoraRedonda(): string {
  const ahora = new Date();
  ahora.setMinutes(0, 0, 0);
  ahora.setHours(ahora.getHours() + 1);
  
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, '0');
  const day = String(ahora.getDate()).padStart(2, '0');
  const hour = String(ahora.getHours()).padStart(2, '0');
  const minute = String(ahora.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Helper: convierte ISO timestamp a formato datetime-local input
 */
function formatDatetimeLocal(isoString: string): string {
  const fecha = new Date(isoString);
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const hour = String(fecha.getHours()).padStart(2, '0');
  const minute = String(fecha.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}