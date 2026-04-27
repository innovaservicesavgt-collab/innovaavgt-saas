import { History, Clock, Calendar, CalendarDays, Archive } from 'lucide-react';
import { getCaseAuditHistory } from '../actions';
import type { AuditLogEntryEnriched } from '../types';
import { AuditTimelineItem } from './audit-timeline-item';

type Props = {
  caseId: string;
};

// ============================================================
// Helper: agrupar entradas por rango de fecha
// ============================================================

type TimeGroup = 'today' | 'yesterday' | 'this_week' | 'older';

const GROUP_LABELS: Record<TimeGroup, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  this_week: 'Esta semana',
  older: 'Más antiguo',
};

function getTimeGroup(date: Date): TimeGroup {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (entryDay.getTime() === today.getTime()) return 'today';

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (entryDay.getTime() === yesterday.getTime()) return 'yesterday';

  if (diffDays < 7) return 'this_week';

  return 'older';
}

function groupEntries(
  entries: AuditLogEntryEnriched[]
): Record<TimeGroup, AuditLogEntryEnriched[]> {
  const groups: Record<TimeGroup, AuditLogEntryEnriched[]> = {
    today: [],
    yesterday: [],
    this_week: [],
    older: [],
  };

  for (const entry of entries) {
    const group = getTimeGroup(new Date(entry.created_at));
    groups[group].push(entry);
  }

  return groups;
}

// ============================================================
// Icono según el grupo temporal
// ============================================================

const GROUP_ICONS: Record<TimeGroup, typeof Clock> = {
  today: Clock,
  yesterday: Calendar,
  this_week: CalendarDays,
  older: Archive,
};

// ============================================================
// Componente principal (Server Component)
// ============================================================

export async function AuditCaseHistory({ caseId }: Props) {
  const entries = await getCaseAuditHistory(caseId);

  // ============================================================
  // Estado vacío: no hay historial
  // ============================================================

  if (entries.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <History className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-medium text-gray-900">
          Sin historial todavía
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          Las acciones que se realicen en este expediente aparecerán aquí
          automáticamente: ediciones, documentos subidos, pagos registrados y
          más.
        </p>
      </div>
    );
  }

  // ============================================================
  // Agrupar por fecha
  // ============================================================

  const grouped = groupEntries(entries);
  const groupOrder: TimeGroup[] = ['today', 'yesterday', 'this_week', 'older'];

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* Header: resumen                                       */}
      {/* ==================================================== */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <History className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Historial del expediente
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {entries.length}{' '}
              {entries.length === 1
                ? 'cambio registrado'
                : 'cambios registrados'}{' '}
              · auditoría automática
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* Timeline agrupado por rango temporal                  */}
      {/* ==================================================== */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {groupOrder.map((group) => {
          const groupEntries = grouped[group];
          if (groupEntries.length === 0) return null;

          const GroupIcon = GROUP_ICONS[group];

          return (
            <div key={group} className="mb-6 last:mb-0">
              {/* Header del grupo */}
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <GroupIcon className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {GROUP_LABELS[group]}
                </h3>
                <span className="text-xs text-gray-400">
                  ({groupEntries.length})
                </span>
              </div>

              {/* Items del grupo */}
              <div>
                {groupEntries.map((entry, index) => (
                  <AuditTimelineItem
                    key={entry.id}
                    entry={entry}
                    isFirst={index === 0}
                    isLast={index === groupEntries.length - 1}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}