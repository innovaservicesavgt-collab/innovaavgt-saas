'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, BookOpen } from 'lucide-react';
import { LegalActionWithRelations } from '../types';
import { TIPOS_ACTUACION } from '../constants';
import { ActionItem } from './action-item';

type Props = {
  actions: LegalActionWithRelations[];
  onEdit: (action: LegalActionWithRelations) => void;
  showCase?: boolean;
};

export function ActionsTimeline({ actions, onEdit, showCase = false }: Props) {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('ALL');
  const [origenFilter, setOrigenFilter] = useState<'all' | 'manual' | 'auto'>('all');

  const filtered = useMemo(() => {
    return actions.filter((a) => {
      // Filtro por tipo
      if (tipoFilter !== 'ALL' && a.tipo !== tipoFilter) return false;

      // Filtro por origen
      const isAuto = !!(a.event_id || a.document_id);
      if (origenFilter === 'manual' && isAuto) return false;
      if (origenFilter === 'auto' && !isAuto) return false;

      // Búsqueda
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match =
          a.descripcion.toLowerCase().includes(q) ||
          (a.case?.numero_interno.toLowerCase().includes(q)) ||
          (a.case?.client?.nombre.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [actions, search, tipoFilter, origenFilter]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar en actuaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            {TIPOS_ACTUACION.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={origenFilter}
          onValueChange={(v) => setOrigenFilter(v as 'all' | 'manual' | 'auto')}
        >
          <SelectTrigger className="w-full md:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="manual">Manuales</SelectItem>
            <SelectItem value="auto">Automáticas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg py-12">
          <div className="flex flex-col items-center text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="font-medium text-gray-900">
              {actions.length === 0 ? 'Sin actuaciones' : 'Sin resultados'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {actions.length === 0
                ? 'Registra la primera actuación del expediente'
                : 'Intenta con otros filtros'}
            </p>
          </div>
        </div>
      ) : (
        <div>
          {filtered.map((action, index) => (
            <ActionItem
              key={action.id}
              action={action}
              onEdit={onEdit}
              showCase={showCase}
              isFirst={index === 0}
              isLast={index === filtered.length - 1}
            />
          ))}
        </div>
      )}

      <div className="text-sm text-gray-500">
        Mostrando {filtered.length} de {actions.length} actuación(es)
      </div>
    </div>
  );
}