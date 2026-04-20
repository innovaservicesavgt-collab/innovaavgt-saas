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
import { FileText, Users, Scale, Landmark } from 'lucide-react';

import { caseSchema, CaseFormData } from '../schema';
import { createCase, updateCase } from '../actions';
import { LegalCaseWithRelations } from '../types';
import {
  MATERIAS,
  ESTADOS_PROCESALES,
  Materia,
} from '../constants';
import { ClientSelector, ClientOption } from './client-selector';

// NUEVOS IMPORTS — Catálogos Fase 12
import { JuzgadoCombobox } from '@/app/legal/catalogs/components/juzgado-combobox';
import { FiscaliaCombobox } from '@/app/legal/catalogs/components/fiscalia-combobox';
import { TipoProcesoCombobox } from '@/app/legal/catalogs/components/tipo-proceso-combobox';
import type {
  CatalogJuzgado,
  CatalogFiscalia,
  CatalogTipoProceso,
} from '@/app/legal/catalogs/types';

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
  juzgados: CatalogJuzgado[];
  fiscalias: CatalogFiscalia[];
  tiposProceso: CatalogTipoProceso[];
};

// Mapeo materia legal_cases -> materia catálogos
// Algunos valores cambian de nombre entre las dos enums
function mapMateriaACatalogo(materia: Materia): string {
  const mapa: Record<string, string> = {
    PENAL: 'PENAL',
    CIVIL: 'CIVIL',
    LABORAL: 'LABORAL',
    ADMINISTRATIVO: 'ADMINISTRATIVO',
    NOTARIAL: 'CIVIL', // Notarial se maneja como civil en el catálogo
    FAMILIA: 'FAMILIA',
    MERCANTIL: 'MERCANTIL',
    OTROS: '', // sin filtro
  };
  return mapa[materia] || '';
}

export function CaseFormDialog({
  open,
  onOpenChange,
  editingCase,
  clients,
  abogados,
  juzgados,
  fiscalias,
  tiposProceso,
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
      juzgado_id: '',
      fiscalia_id: '',
      tipo_proceso_id: '',
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
        juzgado_id: editingCase.juzgado_id ?? '',
        fiscalia_id: editingCase.fiscalia_id ?? '',
        tipo_proceso_id: editingCase.tipo_proceso_id ?? '',
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
        juzgado_id: '',
        fiscalia_id: '',
        tipo_proceso_id: '',
      });
    }
  }, [editingCase, open, reset, abogados]);

  const materiaActual = watch('materia');
  const clienteActual = watch('client_id');
  const abogadoActual = watch('abogado_responsable_id');
  const juzgadoActual = watch('juzgado_id');
  const fiscaliaActual = watch('fiscalia_id');
  const tipoProcesoActual = watch('tipo_proceso_id');

  const materiaCatalogo = mapMateriaACatalogo(materiaActual);
  const esPenal = materiaActual === 'PENAL';

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
            {isEditing
              ? `Editar expediente ${editingCase?.numero_interno}`
              : 'Nuevo expediente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del expediente'
              : 'El número interno se genera automáticamente al guardar'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ============================================================ */}
          {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
          {/* ============================================================ */}
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
                    // Al cambiar materia, limpiar los combobox dependientes
                    setValue('tipo_proceso_id', '');
                    setValue('juzgado_id', '');
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
                  <p className="text-sm text-red-600">
                    {errors.numero_judicial.message}
                  </p>
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
                  <p className="text-sm text-red-600">
                    {errors.fecha_inicio.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* ============================================================ */}
          {/* SECCIÓN 2: ÓRGANO JURISDICCIONAL Y PROCESO (NUEVO FASE 12) */}
          {/* ============================================================ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Landmark className="w-4 h-4" />
              Órgano jurisdiccional y proceso
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Tipo de proceso (combobox) */}
              <div className="space-y-2">
                <Label>Tipo de proceso</Label>
                <TipoProcesoCombobox
                  tiposProceso={tiposProceso}
                  value={tipoProcesoActual}
                  onChange={(val) => setValue('tipo_proceso_id', val ?? '')}
                  materiaFiltro={materiaCatalogo || undefined}
                  placeholder={
                    materiaCatalogo
                      ? `Tipos de proceso de ${materiaActual.toLowerCase()}...`
                      : 'Buscar tipo de proceso...'
                  }
                />
                <p className="text-xs text-gray-500">
                  Filtrado automáticamente por materia seleccionada
                </p>
              </div>

              {/* Juzgado (combobox) */}
              <div className="space-y-2">
                <Label>Juzgado</Label>
                <JuzgadoCombobox
                  juzgados={juzgados}
                  value={juzgadoActual}
                  onChange={(val) => setValue('juzgado_id', val ?? '')}
                  materiaFiltro={materiaCatalogo || undefined}
                  placeholder="Buscar juzgado..."
                />
                <p className="text-xs text-gray-500">
                  Selecciona el juzgado donde se tramita el expediente
                </p>
              </div>

              {/* Fiscalía — solo si es penal */}
              {esPenal && (
                <div className="space-y-2">
                  <Label>Fiscalía del MP</Label>
                  <FiscaliaCombobox
                    fiscalias={fiscalias}
                    value={fiscaliaActual}
                    onChange={(val) => setValue('fiscalia_id', val ?? '')}
                    placeholder="Buscar fiscalía..."
                  />
                  <p className="text-xs text-gray-500">
                    Fiscalía del Ministerio Público encargada del caso
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* ============================================================ */}
          {/* SECCIÓN 3: PARTES DEL PROCESO */}
          {/* ============================================================ */}
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
                  No hay clientes registrados. Ve a <strong>Clientes</strong> y
                  crea al menos uno antes de registrar expedientes.
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
                <p className="text-sm text-red-600">
                  {errors.parte_contraria.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* ============================================================ */}
          {/* SECCIÓN 4: RESPONSABLE Y SEGUIMIENTO */}
          {/* ============================================================ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Scale className="w-4 h-4" />
              Responsable y seguimiento
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Abogado responsable */}
              <div className="space-y-2">
                <Label htmlFor="abogado_responsable_id">
                  Abogado responsable *
                </Label>
                <Select
                  value={abogadoActual}
                  onValueChange={(val) =>
                    setValue('abogado_responsable_id', val)
                  }
                >
                  <SelectTrigger id="abogado_responsable_id">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {abogados.map((a) => {
                      const nombre =
                        `${a.first_name} ${a.last_name}`.trim() || a.email;
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
                <p className="text-sm text-red-600">
                  {errors.observaciones.message}
                </p>
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
            <Button type="submit" disabled={isPending || clients.length === 0}>
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