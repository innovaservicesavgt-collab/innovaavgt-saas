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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { FileText, Users, Scale } from 'lucide-react';

import { caseSchema, CaseFormData } from '../schema';
import { createCase, updateCase } from '../actions';
import { LegalCaseWithRelations } from '../types';
import {
  MATERIAS,
  ESTADOS_PROCESALES,
  TIPOS_PROCESO_POR_MATERIA,
  Materia,
} from '../constants';
import { ClientSelector, ClientOption } from './client-selector';

type AbogadoOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCase?: LegalCaseWithRelations | null;
  clients: ClientOption[];
  abogados: AbogadoOption[];
};

export function CaseFormDialog({
  open,
  onOpenChange,
  editingCase,
  clients,
  abogados,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingCase;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      numero_judicial: '',
      materia: 'CIVIL',
      tipo_proceso: '',
      estado_procesal: '',
      client_id: '',
      parte_contraria: '',
      organo_jurisdiccional: '',
      abogado_responsable_id: '',
      fecha_inicio: new Date().toISOString().split('T')[0],
      proxima_actuacion: '',
      observaciones: '',
    },
  });

  // Cargar datos al editar o limpiar al crear
  useEffect(() => {
    if (editingCase) {
      reset({
        numero_judicial: editingCase.numero_judicial ?? '',
        materia: editingCase.materia,
        tipo_proceso: editingCase.tipo_proceso ?? '',
        estado_procesal: editingCase.estado_procesal ?? '',
        client_id: editingCase.client_id,
        parte_contraria: editingCase.parte_contraria ?? '',
        organo_jurisdiccional: editingCase.organo_jurisdiccional ?? '',
        abogado_responsable_id: editingCase.abogado_responsable_id,
        fecha_inicio: editingCase.fecha_inicio
          ? editingCase.fecha_inicio.split('T')[0]
          : new Date().toISOString().split('T')[0],
        proxima_actuacion: editingCase.proxima_actuacion
          ? editingCase.proxima_actuacion.split('T')[0]
          : '',
        observaciones: editingCase.observaciones ?? '',
      });
    } else {
      reset({
        numero_judicial: '',
        materia: 'CIVIL',
        tipo_proceso: '',
        estado_procesal: '',
        client_id: '',
        parte_contraria: '',
        organo_jurisdiccional: '',
        abogado_responsable_id: abogados[0]?.id ?? '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        proxima_actuacion: '',
        observaciones: '',
      });
    }
  }, [editingCase, open, reset, abogados]);

  const materiaActual = watch('materia');
  const clienteActual = watch('client_id');
  const abogadoActual = watch('abogado_responsable_id');

  // Tipos de proceso disponibles según materia
  const tiposDisponibles = TIPOS_PROCESO_POR_MATERIA[materiaActual as Materia] ?? [];

  const onSubmit = (data: CaseFormData) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateCase(editingCase.id, data)
        : await createCase(data);

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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Editar expediente ${editingCase?.numero_interno}` : 'Nuevo expediente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del expediente'
              : 'El número interno se genera automáticamente al guardar'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ══════════════════════════════════════════════════════ */}
          {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <FileText className="w-4 h-4" />
              Información general
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Materia */}
              <div className="space-y-2">
                <Label htmlFor="materia">Materia *</Label>
                <Select
                  value={materiaActual}
                  onValueChange={(val) => {
                    setValue('materia', val as Materia);
                    // Limpiar tipo de proceso al cambiar materia
                    setValue('tipo_proceso', '');
                  }}
                >
                  <SelectTrigger id="materia">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.materia && (
                  <p className="text-sm text-red-600">{errors.materia.message}</p>
                )}
              </div>

              {/* Tipo de proceso */}
              <div className="space-y-2">
                <Label htmlFor="tipo_proceso">Tipo de proceso</Label>
                <Select
                  value={watch('tipo_proceso') || ''}
                  onValueChange={(val) => setValue('tipo_proceso', val)}
                >
                  <SelectTrigger id="tipo_proceso">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposDisponibles.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estado procesal */}
              <div className="space-y-2">
                <Label htmlFor="estado_procesal">Estado procesal</Label>
                <Select
                  value={watch('estado_procesal') || ''}
                  onValueChange={(val) => setValue('estado_procesal', val)}
                >
                  <SelectTrigger id="estado_procesal">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_PROCESALES.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Número judicial */}
              <div className="space-y-2">
                <Label htmlFor="numero_judicial">Número judicial</Label>
                <Input
                  id="numero_judicial"
                  {...register('numero_judicial')}
                  placeholder="Ej: 01043-2026-00123"
                />
                {errors.numero_judicial && (
                  <p className="text-sm text-red-600">{errors.numero_judicial.message}</p>
                )}
              </div>

              {/* Fecha de inicio */}
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de inicio *</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  {...register('fecha_inicio')}
                />
                {errors.fecha_inicio && (
                  <p className="text-sm text-red-600">{errors.fecha_inicio.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* ══════════════════════════════════════════════════════ */}
          {/* SECCIÓN 2: PARTES DEL PROCESO */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Users className="w-4 h-4" />
              Partes del proceso
            </div>

            {/* Cliente */}
            <div className="space-y-2">
              <Label>Cliente *</Label>
              {clients.length === 0 ? (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                  No hay clientes registrados. 
                  Ve a <strong>Clientes</strong> y crea al menos uno antes de registrar expedientes.
                </div>
              ) : (
                <ClientSelector
                  clients={clients}
                  value={clienteActual}
                  onChange={(id) => setValue('client_id', id)}
                />
              )}
              {errors.client_id && (
                <p className="text-sm text-red-600">{errors.client_id.message}</p>
              )}
            </div>

            {/* Parte contraria */}
            <div className="space-y-2">
              <Label htmlFor="parte_contraria">Parte contraria</Label>
              <Input
                id="parte_contraria"
                {...register('parte_contraria')}
                placeholder="Nombre de la contraparte"
              />
              {errors.parte_contraria && (
                <p className="text-sm text-red-600">{errors.parte_contraria.message}</p>
              )}
            </div>

            {/* Órgano jurisdiccional */}
            <div className="space-y-2">
              <Label htmlFor="organo_jurisdiccional">Órgano jurisdiccional</Label>
              <Input
                id="organo_jurisdiccional"
                {...register('organo_jurisdiccional')}
                placeholder="Ej: Juzgado Primero de Primera Instancia Civil"
              />
              {errors.organo_jurisdiccional && (
                <p className="text-sm text-red-600">
                  {errors.organo_jurisdiccional.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* ══════════════════════════════════════════════════════ */}
          {/* SECCIÓN 3: RESPONSABLE Y FECHAS */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Scale className="w-4 h-4" />
              Responsable y seguimiento
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Abogado responsable */}
              <div className="space-y-2">
                <Label htmlFor="abogado_responsable_id">Abogado responsable *</Label>
                <Select
                  value={abogadoActual}
                  onValueChange={(val) => setValue('abogado_responsable_id', val)}
                >
                  <SelectTrigger id="abogado_responsable_id">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {abogados.map((a) => {
                      const nombre = `${a.first_name} ${a.last_name}`.trim() || a.email;
                      return (
                        <SelectItem key={a.id} value={a.id}>
                          {nombre}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {errors.abogado_responsable_id && (
                  <p className="text-sm text-red-600">
                    {errors.abogado_responsable_id.message}
                  </p>
                )}
              </div>

              {/* Próxima actuación */}
              <div className="space-y-2">
                <Label htmlFor="proxima_actuacion">Próxima actuación</Label>
                <Input
                  id="proxima_actuacion"
                  type="date"
                  {...register('proxima_actuacion')}
                />
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones estratégicas</Label>
              <Textarea
                id="observaciones"
                {...register('observaciones')}
                placeholder="Notas internas, estrategia procesal, detalles relevantes..."
                rows={4}
              />
              {errors.observaciones && (
                <p className="text-sm text-red-600">{errors.observaciones.message}</p>
              )}
            </div>
          </div>

          {/* Footer */}
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
              disabled={isPending || clients.length === 0}
            >
              {isPending
                ? 'Guardando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Crear expediente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}