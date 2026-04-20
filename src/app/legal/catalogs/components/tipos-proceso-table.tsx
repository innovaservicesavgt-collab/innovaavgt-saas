'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Search, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogTipoProceso } from '../types';
import { MATERIA_JUZGADO_COLORS, normalizeSearch } from '../utils';

type Props = {
  tiposProceso: CatalogTipoProceso[];
};

const MATERIAS_OPCIONES: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Todas las materias' },
  { value: 'CIVIL', label: 'Civil' },
  { value: 'PENAL', label: 'Penal' },
  { value: 'LABORAL', label: 'Laboral' },
  { value: 'FAMILIA', label: 'Familia' },
  { value: 'MERCANTIL', label: 'Mercantil' },
  { value: 'CONSTITUCIONAL', label: 'Constitucional' },
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'NIÑEZ', label: 'Niñez y Adolescencia' },
  { value: 'ECONOMICO_COACTIVO', label: 'Económico Coactivo' },
];

const MATERIA_LABELS: Record<string, string> = {
  CIVIL: 'Civil',
  PENAL: 'Penal',
  LABORAL: 'Laboral',
  FAMILIA: 'Familia',
  MERCANTIL: 'Mercantil',
  CONSTITUCIONAL: 'Constitucional',
  ADMINISTRATIVO: 'Administrativo',
  NIÑEZ: 'Niñez',
  ECONOMICO_COACTIVO: 'Económico Coactivo',
};

export function TiposProcesoTable({ tiposProceso }: Props) {
  const [search, setSearch] = useState('');
  const [materiaFilter, setMateriaFilter] = useState<string>('ALL');
  const [viaFilter, setViaFilter] = useState<string>('ALL');

  // Lista única de vías procesales
  const viasUnicas = useMemo(() => {
    const set = new Set(
      tiposProceso
        .map((t) => t.via_procesal)
        .filter((v): v is string => !!v)
    );
    return Array.from(set).sort();
  }, [tiposProceso]);

  // Aplicar filtros
  const filtered = useMemo(() => {
    let result = tiposProceso;

    if (search.trim()) {
      const q = normalizeSearch(search);
      result = result.filter((t) => {
        const nombre = normalizeSearch(t.nombre);
        const desc = t.descripcion ? normalizeSearch(t.descripcion) : '';
        const via = t.via_procesal ? normalizeSearch(t.via_procesal) : '';
        const codigo = normalizeSearch(t.codigo);
        return (
          nombre.includes(q) ||
          desc.includes(q) ||
          via.includes(q) ||
          codigo.includes(q)
        );
      });
    }

    if (materiaFilter !== 'ALL') {
      result = result.filter((t) => t.materia === materiaFilter);
    }

    if (viaFilter !== 'ALL') {
      result = result.filter((t) => t.via_procesal === viaFilter);
    }

    return result;
  }, [tiposProceso, search, materiaFilter, viaFilter]);

  const materiasContadas = useMemo(() => {
    const set = new Set(filtered.map((t) => t.materia));
    return set.size;
  }, [filtered]);

  const handleClearFilters = () => {
    setSearch('');
    setMateriaFilter('ALL');
    setViaFilter('ALL');
  };

  const tieneFiltros =
    search.trim() !== '' || materiaFilter !== 'ALL' || viaFilter !== 'ALL';

  return (
    <div className="space-y-4">
      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Total tipos</div>
              <div className="text-lg font-bold text-gray-900">
                {tiposProceso.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Resultados filtrados</div>
              <div className="text-lg font-bold text-gray-900">
                {filtered.length}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Tag className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Materias representadas</div>
              <div className="text-lg font-bold text-gray-900">
                {materiasContadas}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILTROS ===== */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, vía, descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={materiaFilter} onValueChange={setMateriaFilter}>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Materia" />
          </SelectTrigger>
          <SelectContent>
            {MATERIAS_OPCIONES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={viaFilter} onValueChange={setViaFilter}>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Vía procesal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las vías</SelectItem>
            {viasUnicas.map((via) => (
              <SelectItem key={via} value={via}>
                {via}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ===== TABLA ===== */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[260px]">Nombre</TableHead>
              <TableHead className="hidden lg:table-cell">Materia</TableHead>
              <TableHead className="hidden md:table-cell">
                Vía procesal
              </TableHead>
              <TableHead className="hidden xl:table-cell">Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      No se encontraron tipos de proceso con los filtros actuales
                    </p>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-xs text-blue-600 hover:underline mt-2"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((tipo) => (
                <TableRow key={tipo.id} className="hover:bg-gray-50">
                  {/* Nombre */}
                  <TableCell>
                    <div className="font-medium text-gray-900">{tipo.nombre}</div>
                    {/* En móvil, badges debajo */}
                    <div className="flex items-center gap-2 mt-2 md:hidden flex-wrap">
                      <Badge
                        className={cn(
                          'text-xs',
                          MATERIA_JUZGADO_COLORS[
                            tipo.materia as keyof typeof MATERIA_JUZGADO_COLORS
                          ] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {MATERIA_LABELS[tipo.materia] || tipo.materia}
                      </Badge>
                      {tipo.via_procesal && (
                        <span className="text-xs font-mono text-blue-600">
                          {tipo.via_procesal}
                        </span>
                      )}
                    </div>
                    {/* Descripción en móvil */}
                    {tipo.descripcion && (
                      <p className="text-xs text-gray-500 mt-1 xl:hidden">
                        {tipo.descripcion}
                      </p>
                    )}
                  </TableCell>

                  {/* Materia (desktop) */}
                  <TableCell className="hidden lg:table-cell">
                    <Badge
                      className={cn(
                        'text-xs',
                        MATERIA_JUZGADO_COLORS[
                          tipo.materia as keyof typeof MATERIA_JUZGADO_COLORS
                        ] || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {MATERIA_LABELS[tipo.materia] || tipo.materia}
                    </Badge>
                  </TableCell>

                  {/* Vía procesal */}
                  <TableCell className="hidden md:table-cell">
                    {tipo.via_procesal ? (
                      <code className="text-xs text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                        {tipo.via_procesal}
                      </code>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </TableCell>

                  {/* Descripción (desktop grande) */}
                  <TableCell className="hidden xl:table-cell text-sm text-gray-600 max-w-md">
                    {tipo.descripcion ? (
                      <span className="truncate block" title={tipo.descripcion}>
                        {tipo.descripcion}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Mostrando {filtered.length} de {tiposProceso.length} tipos
        </span>
        {tieneFiltros && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-blue-600 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}