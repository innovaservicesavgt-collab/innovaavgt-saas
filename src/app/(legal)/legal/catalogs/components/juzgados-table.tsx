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
import { Scale, Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CatalogJuzgado } from '../types';
import {
  MATERIA_JUZGADO_LABELS,
  MATERIA_JUZGADO_COLORS,
  INSTANCIA_LABELS,
  filtrarJuzgados,
} from '../utils';

type Props = {
  juzgados: CatalogJuzgado[];
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
  { value: 'MIXTO', label: 'Mixto' },
];

const INSTANCIAS_OPCIONES: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Todas las instancias' },
  { value: 'PAZ', label: 'Juzgado de Paz' },
  { value: 'PRIMERA_INSTANCIA', label: 'Primera Instancia' },
  { value: 'SENTENCIA', label: 'Tribunal de Sentencia' },
  { value: 'SALA', label: 'Sala de Apelaciones' },
  { value: 'CORTE_SUPREMA', label: 'Corte Suprema' },
  { value: 'CORTE_CONSTITUCIONAL', label: 'Corte de Constitucionalidad' },
];

export function JuzgadosTable({ juzgados }: Props) {
  const [search, setSearch] = useState('');
  const [materiaFilter, setMateriaFilter] = useState<string>('ALL');
  const [instanciaFilter, setInstanciaFilter] = useState<string>('ALL');

  // Aplicar filtros
  const filtered = useMemo(() => {
    let result = juzgados;

    // Filtro búsqueda de texto
    if (search.trim()) {
      result = filtrarJuzgados(result, search);
    }

    // Filtro materia
    if (materiaFilter !== 'ALL') {
      result = result.filter((j) => j.materia === materiaFilter);
    }

    // Filtro instancia
    if (instanciaFilter !== 'ALL') {
      result = result.filter((j) => j.instancia === instanciaFilter);
    }

    return result;
  }, [juzgados, search, materiaFilter, instanciaFilter]);

  // Agrupar por departamento para stats
  const departamentos = useMemo(() => {
    const set = new Set(filtered.map((j) => j.departamento));
    return set.size;
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* ===== STATS CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Total juzgados</div>
              <div className="text-lg font-bold text-gray-900">
                {juzgados.length}
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
                {departamentos}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FILTROS ===== */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, departamento, código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filtro materia */}
        <Select value={materiaFilter} onValueChange={setMateriaFilter}>
          <SelectTrigger className="w-full md:w-48">
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

        {/* Filtro instancia */}
        <Select value={instanciaFilter} onValueChange={setInstanciaFilter}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Instancia" />
          </SelectTrigger>
          <SelectContent>
            {INSTANCIAS_OPCIONES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
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
              <TableHead className="hidden lg:table-cell">Materia</TableHead>
              <TableHead className="hidden md:table-cell">Instancia</TableHead>
              <TableHead className="hidden md:table-cell">Departamento</TableHead>
              <TableHead className="hidden xl:table-cell">Código</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Scale className="w-8 h-8 text-gray-300" />
                    <p className="text-sm text-gray-500">
                      No se encontraron juzgados con los filtros actuales
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setMateriaFilter('ALL');
                        setInstanciaFilter('ALL');
                      }}
                      className="text-xs text-blue-600 hover:underline mt-2"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((juzgado) => (
                <TableRow key={juzgado.id} className="hover:bg-gray-50">
                  {/* Nombre */}
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {juzgado.nombre}
                    </div>
                    {juzgado.nombre_corto &&
                      juzgado.nombre_corto !== juzgado.nombre && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {juzgado.nombre_corto}
                        </div>
                      )}
                    {/* En móvil, mostrar materia e instancia como badges abajo del nombre */}
                    <div className="flex items-center gap-2 mt-2 md:hidden flex-wrap">
                      <Badge
                        className={cn(
                          'text-xs',
                          MATERIA_JUZGADO_COLORS[juzgado.materia]
                        )}
                      >
                        {MATERIA_JUZGADO_LABELS[juzgado.materia]}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {INSTANCIA_LABELS[juzgado.instancia]}
                      </span>
                    </div>
                  </TableCell>

                  {/* Materia (desktop) */}
                  <TableCell className="hidden lg:table-cell">
                    <Badge
                      className={cn(
                        'text-xs',
                        MATERIA_JUZGADO_COLORS[juzgado.materia]
                      )}
                    >
                      {MATERIA_JUZGADO_LABELS[juzgado.materia]}
                    </Badge>
                  </TableCell>

                  {/* Instancia (desktop) */}
                  <TableCell className="hidden md:table-cell text-sm text-gray-600">
                    {INSTANCIA_LABELS[juzgado.instancia]}
                  </TableCell>

                  {/* Departamento */}
                  <TableCell className="hidden md:table-cell text-sm">
                    <div className="flex items-center gap-1 text-gray-700">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {juzgado.departamento}
                    </div>
                    {juzgado.municipio &&
                      juzgado.municipio !== juzgado.departamento && (
                        <div className="text-xs text-gray-500 ml-4">
                          {juzgado.municipio}
                        </div>
                      )}
                  </TableCell>

                  {/* Código */}
                  <TableCell className="hidden xl:table-cell">
                    <code className="text-xs text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                      {juzgado.codigo}
                    </code>
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
          Mostrando {filtered.length} de {juzgados.length} juzgados
        </span>
        {(search || materiaFilter !== 'ALL' || instanciaFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setMateriaFilter('ALL');
              setInstanciaFilter('ALL');
            }}
            className="text-blue-600 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}