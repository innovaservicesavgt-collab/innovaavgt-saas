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
import { clientSchema, ClientFormData } from '../schema';
import { createClient, updateClient } from '../actions';
import { LegalClient } from '../types';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient?: LegalClient | null;
};

export function ClientFormDialog({ open, onOpenChange, editingClient }: Props) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingClient;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombre: '',
      tipo_persona: 'NATURAL',
      dpi: '',
      nit: '',
      telefono: '',
      email: '',
      direccion: '',
      observaciones: '',
    },
  });

  // Cargar datos cuando se edita
  useEffect(() => {
    if (editingClient) {
      reset({
        nombre: editingClient.nombre,
        tipo_persona: editingClient.tipo_persona,
        dpi: editingClient.dpi ?? '',
        nit: editingClient.nit ?? '',
        telefono: editingClient.telefono ?? '',
        email: editingClient.email ?? '',
        direccion: editingClient.direccion ?? '',
        observaciones: editingClient.observaciones ?? '',
      });
    } else {
      reset({
        nombre: '',
        tipo_persona: 'NATURAL',
        dpi: '',
        nit: '',
        telefono: '',
        email: '',
        direccion: '',
        observaciones: '',
      });
    }
  }, [editingClient, open, reset]);

  const tipoPersona = watch('tipo_persona');

  const onSubmit = (data: ClientFormData) => {
    startTransition(async () => {
      const result = isEditing
        ? await updateClient(editingClient.id, data)
        : await createClient(data);

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
            {isEditing ? 'Editar cliente' : 'Nuevo cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del cliente'
              : 'Ingresa los datos del nuevo cliente del despacho'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Tipo de persona */}
          <div className="space-y-2">
            <Label htmlFor="tipo_persona">Tipo de persona *</Label>
            <Select
              value={tipoPersona}
              onValueChange={(val) =>
                setValue('tipo_persona', val as 'NATURAL' | 'JURIDICA')
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NATURAL">Persona Natural</SelectItem>
                <SelectItem value="JURIDICA">Persona Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">
              {tipoPersona === 'NATURAL' ? 'Nombre completo' : 'Razón social'} *
            </Label>
            <Input
              id="nombre"
              {...register('nombre')}
              placeholder={
                tipoPersona === 'NATURAL' 
                  ? 'Juan Pérez López' 
                  : 'Empresa, S.A.'
              }
            />
            {errors.nombre && (
              <p className="text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>

          {/* Grid de 2 columnas para DPI y NIT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tipoPersona === 'NATURAL' && (
              <div className="space-y-2">
                <Label htmlFor="dpi">DPI</Label>
                <Input
                  id="dpi"
                  {...register('dpi')}
                  placeholder="1234 56789 0101"
                />
                {errors.dpi && (
                  <p className="text-sm text-red-600">{errors.dpi.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nit">NIT</Label>
              <Input
                id="nit"
                {...register('nit')}
                placeholder="1234567-8"
              />
              {errors.nit && (
                <p className="text-sm text-red-600">{errors.nit.message}</p>
              )}
            </div>
          </div>

          {/* Grid de 2 columnas para Teléfono y Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...register('telefono')}
                placeholder="+502 5555 5555"
              />
              {errors.telefono && (
                <p className="text-sm text-red-600">{errors.telefono.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="cliente@email.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              {...register('direccion')}
              placeholder="Zona 10, Ciudad de Guatemala"
            />
            {errors.direccion && (
              <p className="text-sm text-red-600">{errors.direccion.message}</p>
            )}
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              {...register('observaciones')}
              placeholder="Notas internas sobre el cliente..."
              rows={3}
            />
            {errors.observaciones && (
              <p className="text-sm text-red-600">{errors.observaciones.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Guardando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Crear cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}