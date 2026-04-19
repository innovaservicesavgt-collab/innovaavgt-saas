'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, Pencil, Trash2, CheckCircle2, RotateCcw, 
  MapPin, Clock, FileText, Calendar 
} from 'lucide-react';
import { LegalEventWithCase } from '../types';
import { 
  getTipoEventoInfo, 
  getNivelUrgencia, 
  getColorSemaforo,
  getEtiquetaUrgencia,
} from '../constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { completeEvent, uncompleteEvent } from '../actions';
import { toast } from 'sonner';
import { DeleteEventDialog } from './delete-event-dialog';

type Props = {
  events: LegalEventWithCase[];
  onEdit: (event: LegalEventWithCase) => void;
};

export function EventsList({ events, onEdit }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LegalEventWithCase | null>(null);

  const handleComplete = async (event: LegalEventWithCase) => {
    const result = await completeEvent(event.id);
    if (result.success) toast.success(result.message);
    else toast.error(result.error);
  };

  const handleUncomplete = async (event: LegalEventWithCase) => {
    const result = await uncompleteEvent(event.id);
    if (result.success) toast.success(result.message);
    else toast.error(result.error);
  };

  const handleDelete = (event: LegalEventWithCase) => {
    setSelectedEvent(event);
    setDeleteOpen(true);
  };

  // Agrupar eventos por urgencia
  const grupos = {
    vencido: [] as LegalEventWithCase[],
    hoy: [] as LegalEventWithCase[],
    urgente: [] as LegalEventWithCase[],
    proximo: [] as LegalEventWithCase[],
    lejano: [] as LegalEventWithCase[],
    completado: [] as LegalEventWithCase[],
  };

  events.forEach((e) => {
    const urgencia = getNivelUrgencia(e.fecha_hora, e.completado);
    grupos[urgencia].push(e);
  });

  const orden: Array<keyof typeof grupos> = [
    'vencido', 'hoy', 'urgente', 'proximo', 'lejano', 'completado'
  ];

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center">
            <Calendar className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="font-medium text-gray-900">Sin eventos programados</h3>
            <p className="text-sm text-gray-500 mt-1">
              Crea el primer evento con el botón de arriba
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {orden.map((key) => {
          const items = grupos[key];
          if (items.length === 0) return null;

          return (
            <div key={key}>
              <h3 className={cn(
                "text-xs font-semibold uppercase tracking-wide mb-2 px-1",
                key === 'vencido' && 'text-red-700',
                key === 'hoy' && 'text-red-600',
                key === 'urgente' && 'text-amber-700',
                key === 'proximo' && 'text-yellow-700',
                key === 'lejano' && 'text-green-700',
                key === 'completado' && 'text-gray-500',
              )}>
                {getEtiquetaUrgencia(key as any)} ({items.length})
              </h3>

              <div className="space-y-2">
                {items.map((event) => {
                  const tipo = getTipoEventoInfo(event.tipo);
                  const urgencia = getNivelUrgencia(event.fecha_hora, event.completado);
                  const semaforoClass = getColorSemaforo(urgencia);

                  return (
                    <Card key={event.id} className={cn(
                      "border-l-4",
                      event.completado && 'opacity-60'
                    )} style={{ borderLeftColor: tipo.hex }}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge className={cn(tipo.color, 'hover:opacity-80')}>
                                {tipo.label}
                              </Badge>
                              <Badge variant="outline" className={cn('text-xs', semaforoClass)}>
                                {getEtiquetaUrgencia(urgencia)}
                              </Badge>
                              {event.completado && (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  ✓ Completado
                                </Badge>
                              )}
                            </div>

                            <h4 className={cn(
                              "font-medium text-gray-900",
                              event.completado && 'line-through'
                            )}>
                              {event.titulo}
                            </h4>

                            <div className="flex items-center gap-4 text-xs text-gray-600 mt-1 flex-wrap">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(event.fecha_hora), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
                              </div>
                              {event.lugar && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.lugar}
                                </div>
                              )}
                              {event.case && (
                                <Link 
                                  href={`/legal/cases/${event.case.id}`}
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span className="font-mono">{event.case.numero_interno}</span>
                                  {event.case.client?.nombre && (
                                    <span> — {event.case.client.nombre}</span>
                                  )}
                                </Link>
                              )}
                            </div>

                            {event.descripcion && (
                              <p className="text-sm text-gray-600 mt-2">
                                {event.descripcion}
                              </p>
                            )}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!event.completado ? (
                                <DropdownMenuItem onClick={() => handleComplete(event)}>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Marcar completado
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUncomplete(event)}>
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Reabrir
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => onEdit(event)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(event)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <DeleteEventDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        eventId={selectedEvent?.id ?? null}
        eventTitle={selectedEvent?.titulo ?? ''}
      />
    </>
  );
}