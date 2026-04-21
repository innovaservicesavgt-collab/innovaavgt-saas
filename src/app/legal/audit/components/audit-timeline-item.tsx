'use client';

import { useState } from 'react';
import {
  Sparkles,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AuditLogEntryEnriched } from '../types';
import {
  getActionColor,
  getActionLabel,
  getFieldLabel,
  getUserDisplayName,
  formatFieldValue,
} from '../utils';

type Props = {
  entry: AuditLogEntryEnriched;
  isFirst?: boolean;
  isLast?: boolean;
};

export function AuditTimelineItem({ entry, isFirst, isLast }: Props) {
  const [expanded, setExpanded] = useState(false);

  const colors = getActionColor(entry.action);
  const actionLabel = getActionLabel(entry.action, entry.table_name);
  const userName = getUserDisplayName(entry.user_email, entry.user_profile);

  const fechaRelativa = formatDistanceToNow(new Date(entry.created_at), {
    addSuffix: true,
    locale: es,
  });
  const fechaCompleta = format(
    new Date(entry.created_at),
    "d 'de' MMMM yyyy, HH:mm",
    { locale: es }
  );

  // Icono según acción
  const Icon =
    entry.action === 'INSERT'
      ? Sparkles
      : entry.action === 'UPDATE'
      ? Pencil
      : Trash2;

  // Campos con cambios (para UPDATE)
  const hasChangedFields =
    entry.action === 'UPDATE' &&
    entry.changed_fields &&
    entry.changed_fields.length > 0;

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Línea vertical del timeline */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-gray-200" />
      )}

      {/* Círculo con icono */}
      <div
        className={cn(
          'relative z-10 flex w-8 h-8 shrink-0 items-center justify-center rounded-full border-2',
          colors.bg,
          colors.border
        )}
      >
        <Icon className={cn('w-4 h-4', colors.icon)} />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Header: Acción + badges */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-900">
              {actionLabel}
            </span>
            {hasChangedFields && entry.changed_fields && (
              <Badge variant="outline" className="text-xs">
                {entry.changed_fields.length}{' '}
                {entry.changed_fields.length === 1 ? 'campo' : 'campos'}
              </Badge>
            )}
          </div>
        </div>

        {/* Metadata: usuario + fecha */}
        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {userName}
          </span>
          <span className="flex items-center gap-1" title={fechaCompleta}>
            <Clock className="w-3 h-3" />
            {fechaRelativa}
          </span>
        </div>

        {/* Preview de campos cambiados (siempre visible para UPDATE) */}
        {hasChangedFields && entry.changed_fields && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {entry.changed_fields.slice(0, 5).map((field) => (
              <Badge
                key={field}
                className={cn(
                  'text-xs font-normal',
                  colors.bg,
                  colors.text,
                  'border-0'
                )}
              >
                {getFieldLabel(field)}
              </Badge>
            ))}
            {entry.changed_fields.length > 5 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{entry.changed_fields.length - 5} más
              </Badge>
            )}
          </div>
        )}

        {/* Botón expandir detalles */}
        {(hasChangedFields || entry.action === 'INSERT' || entry.action === 'DELETE') && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Ocultar detalles
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Ver detalles
              </>
            )}
          </button>
        )}

        {/* Panel de detalles expandibles */}
        {expanded && (
          <div className="mt-3 border border-gray-200 rounded-lg p-3 bg-gray-50 text-xs">
            {/* UPDATE — mostrar antes/después de los campos cambiados */}
            {entry.action === 'UPDATE' &&
              entry.changed_fields &&
              entry.old_data &&
              entry.new_data && (
                <div className="space-y-2">
                  {entry.changed_fields.map((field) => {
                    const oldVal = entry.old_data?.[field];
                    const newVal = entry.new_data?.[field];
                    return (
                      <div
                        key={field}
                        className="border-b border-gray-200 last:border-0 pb-2 last:pb-0"
                      >
                        <div className="font-medium text-gray-700 mb-1">
                          {getFieldLabel(field)}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-red-50 border border-red-100 rounded px-2 py-1">
                            <div className="text-[10px] text-red-600 font-medium uppercase">
                              Antes
                            </div>
                            <div className="text-gray-700 break-words">
                              {formatFieldValue(oldVal)}
                            </div>
                          </div>
                          <div className="bg-green-50 border border-green-100 rounded px-2 py-1">
                            <div className="text-[10px] text-green-700 font-medium uppercase">
                              Después
                            </div>
                            <div className="text-gray-700 break-words">
                              {formatFieldValue(newVal)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* INSERT — mostrar valores creados */}
            {entry.action === 'INSERT' && entry.new_data && (
              <div className="space-y-1">
                <div className="font-medium text-gray-700 mb-2">
                  Valores iniciales:
                </div>
                {Object.entries(entry.new_data)
                  .filter(
                    ([key, value]) =>
                      !['id', 'tenant_id', 'created_at', 'updated_at'].includes(
                        key
                      ) &&
                      value !== null &&
                      value !== ''
                  )
                  .slice(0, 10)
                  .map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="font-medium text-gray-600 min-w-[120px]">
                        {getFieldLabel(key)}:
                      </span>
                      <span className="text-gray-700 break-words">
                        {formatFieldValue(value)}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* DELETE — mostrar valores eliminados */}
            {entry.action === 'DELETE' && entry.old_data && (
              <div className="space-y-1">
                <div className="font-medium text-gray-700 mb-2">
                  Valores eliminados:
                </div>
                {Object.entries(entry.old_data)
                  .filter(
                    ([key, value]) =>
                      !['id', 'tenant_id', 'created_at', 'updated_at'].includes(
                        key
                      ) &&
                      value !== null &&
                      value !== ''
                  )
                  .slice(0, 10)
                  .map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="font-medium text-gray-600 min-w-[120px]">
                        {getFieldLabel(key)}:
                      </span>
                      <span className="text-gray-700 break-words line-through">
                        {formatFieldValue(value)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}