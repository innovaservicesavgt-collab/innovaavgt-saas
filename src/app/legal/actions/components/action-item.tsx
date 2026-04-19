'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Lock } from 'lucide-react';
import Link from 'next/link';
import { LegalActionWithRelations } from '../types';
import { getTipoActuacionInfo } from '../constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DeleteActionDialog } from './delete-action-dialog';

type Props = {
  action: LegalActionWithRelations;
  onEdit: (action: LegalActionWithRelations) => void;
  showCase?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
};

export function ActionItem({ 
  action, 
  onEdit, 
  showCase = false,
  isFirst = false,
  isLast = false,
}: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const tipo = getTipoActuacionInfo(action.tipo);
  const Icon = tipo.icon;
  const isSystem = !!(action.event_id || action.document_id);
  
  const autor = action.registrada_por_profile
    ? `${action.registrada_por_profile.first_name} ${action.registrada_por_profile.last_name}`.trim()
    : 'Sistema';

  return (
    <>
      <div className="relative flex gap-4">
        {/* Línea vertical del timeline */}
        {!isLast && (
          <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
        )}

        {/* Círculo del timeline */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm"
          style={{ backgroundColor: tipo.hex }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0 pb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
            {/* Header: tipo, fecha, menú */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn(tipo.color, 'hover:opacity-80')}>
                  {tipo.label}
                </Badge>
                {isSystem && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Lock className="w-3 h-3" />
                    Automática
                  </Badge>
                )}
              </div>

              {!isSystem && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(action)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteOpen(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Descripción */}
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {action.descripcion}
            </p>

            {/* Footer: fecha, autor, expediente */}
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-3 flex-wrap">
              <span>
                {format(new Date(action.fecha), "dd 'de' MMM yyyy 'a las' HH:mm", { locale: es })}
              </span>
              <span>•</span>
              <span>{autor}</span>
              {showCase && action.case && (
                <>
                  <span>•</span>
                  <Link
                    href={`/legal/cases/${action.case.id}`}
                    className="text-blue-600 hover:underline font-mono"
                  >
                    {action.case.numero_interno}
                  </Link>
                  {action.case.client?.nombre && (
                    <span className="truncate">— {action.case.client.nombre}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <DeleteActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        actionId={action.id}
      />
    </>
  );
}