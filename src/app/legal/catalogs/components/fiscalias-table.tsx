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
import { Building2, Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogFiscalia } from '../types';
import {
  TIPO_FISCALIA_LABELS,
  TIPO_FISCALIA_COLORS,
  filtrarFiscalias,
} from '../utils';

type Props = {
  fiscalias: CatalogFiscalia[];
};

const TIPOS_OPCIONES: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'FISCALIA_SECCION', label: 'Fiscalía de Sección' },
  { value: 'FISCALIA_DISTRITO', label: 'Fiscalía Distrital' },
  { value: 'FISCALIA_MUNICIPAL', label: 'Fiscalía Municipal' },
  { value: 'UNIDAD_ESPECIALIZADA', label: 'Unidad Especializada' },
];

export function FiscaliasTable({ fiscalias }: Props) {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('ALL');
  const [deptoFilter, setDeptoFilter] = useState<string>('ALL');

  // Lista única de departamentos para el filtro
  const departamentosUnicos = useMemo(() => {
    const set = new Set(fiscalias.map((f) => f.departamento));
    return Array.from(set).sort((a, b) => {
      // Guatemala primero
      if (a === 'Guatemala') return -1;
      if (b === 'Guatemala') return 1;
      return a.localeCompare(b);
    });
  }, [fiscalias]);

  // Aplicar filtros
  const filtered = useMemo(() => {
    let result = fiscalias;

    if (search.trim()) {
      result = filtrarFiscalias(result, search);
    }

    if (tipoFilter !== 'ALL') {
      result = result.filter((f) => f.tipo === tipoFilter);
    }

    if (deptoFilter !== 'ALL') {
      result = result.filter((f) => f.departamento === deptoFilter);
    }

    return result;
  }, [fiscalias, search, tipoFilter, deptoFilter]);

  const departamentosContados = useMemo(() => {
    const set = new Set(filtered.map((f) => f.departamento));
    return set.size;
  }, [filtered]);

  const handleClearFilters = () => {
    setSearch('');
    setTipoFilter('ALL');
    setDeptoFilter('ALL');
  };

  const tieneFiltros =
    search.trim() !== '' || tipoFilter !== 'ALL' || deptoFilter !== 'ALL';

  return (
    <div className="space-y-4">
      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Total fiscalías</div>
              <div className="text-lg font-bold text-gray-900">
                {fiscalias.length}
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
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Departamentos</div>
              <div className="text-lg font-bold text-gray-900">
                {departamentosContados}
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
            placeholder="Buscar por nombre, departamento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_OPCIONES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={deptoFilter} onValueChange={setDeptoFilter}>
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los departamentos</SelectItem>
            {departamentosUnicos.map((depto) => (
              <SelectItem key={depto} value={depto}>
                {depto}
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
              <TableHead className="min-w-[280px]">Nombre</TableHead>
              <TableHead className="hidden lg:table-cell">Tipo</TableHead>
              <TableHead className="hidden md:table-cell">
                Departamento
              </TableHead>
              <TableHead className="hidden xl:table-cell">Municipio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="w-8 h-8 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      No se encontraron fiscalías con los filtros actuales
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
              filtered.map((fiscalia) => (
                <TableRow key={fiscalia.id} className="hover:bg-gray-50">
                  {/* Nombre */}
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {fiscalia.nombre}
                    </div>
                    {fiscalia.nombre_corto &&
                      fiscalia.nombre_corto !== fiscalia.nombre && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {fiscalia.nombre_corto}
                        </div>
                      )}
                    {/* En móvil, mostrar tipo y depto como badges */}
                    <div className="flex items-center gap-2 mt-2 md:hidden flex-wrap">
                      <Badge
                        className={cn(
                          'text-xs',
                          TIPO_FISCALIA_COLORS[fiscalia.tipo]
                        )}
                      >
                        {TIPO_FISCALIA_LABELS[fiscalia.tipo]}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {fiscalia.departamento}
                      </span>
                    </div>
                  </TableCell>

                  {/* Tipo (desktop) */}
                  <TableCell className="hidden lg:table-cell">
                    <Badge
                      className={cn(
                        'text-xs',
                        TIPO_FISCALIA_COLORS[fiscalia.tipo]
                      )}
                    >
                      {TIPO_FISCALIA_LABELS[fiscalia.tipo]}
                    </Badge>
                  </TableCell>

                  {/* Departamento */}
                  <TableCell className="hidden md:table-cell text-sm">
                    <div className="flex items-center gap-1 text-gray-700">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {fiscalia.departamento}
                    </div>
                  </TableCell>

                  {/* Municipio */}
                  <TableCell className="hidden xl:table-cell text-sm text-gray-600">
                    {fiscalia.municipio &&
                    fiscalia.municipio !== fiscalia.departamento
                      ? fiscalia.municipio
                      : '—'}
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
          Mostrando {filtered.length} de {fiscalias.length} fiscalías
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