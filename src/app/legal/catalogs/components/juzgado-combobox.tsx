'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Scale, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CatalogJuzgado } from '../types';
import {
  MATERIA_JUZGADO_LABELS,
  MATERIA_JUZGADO_COLORS,
  INSTANCIA_LABELS,
  agruparJuzgadosPorDepartamento,
  filtrarJuzgados,
  getJuzgadoDisplayName,
} from '../utils';

type Props = {
  juzgados: CatalogJuzgado[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  materiaFiltro?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function JuzgadoCombobox({
  juzgados,
  value,
  onChange,
  materiaFiltro,
  placeholder = 'Buscar juzgado...',
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const juzgadosFiltrados = useMemo(() => {
    if (!materiaFiltro) return juzgados;
    return juzgados.filter(
      (j) => j.materia === materiaFiltro || j.materia === 'MIXTO'
    );
  }, [juzgados, materiaFiltro]);

  const juzgadosEnBusqueda = useMemo(
    () => filtrarJuzgados(juzgadosFiltrados, search),
    [juzgadosFiltrados, search]
  );

  const grupos = useMemo(
    () => agruparJuzgadosPorDepartamento(juzgadosEnBusqueda),
    [juzgadosEnBusqueda]
  );

  const departamentosOrdenados = useMemo(
    () =>
      Object.keys(grupos).sort((a, b) => {
        if (a === 'Guatemala') return -1;
        if (b === 'Guatemala') return 1;
        return a.localeCompare(b);
      }),
    [grupos]
  );

  const selected = juzgados.find((j) => j.id === value) || null;

  const handleSelect = (juzgadoId: string) => {
    if (juzgadoId === value) {
      onChange(null);
    } else {
      onChange(juzgadoId);
    }
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between font-normal',
              selected && 'pr-16',
              !selected && 'text-gray-500'
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Scale className="w-4 h-4 shrink-0 text-gray-400" />
              <span className="truncate text-left">
                {selected ? getJuzgadoDisplayName(selected) : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0 min-w-[380px]" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nombre, departamento..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[320px]">
              {juzgadosEnBusqueda.length === 0 && (
                <CommandEmpty>No se encontraron juzgados</CommandEmpty>
              )}

              {departamentosOrdenados.map((depto) => (
                <CommandGroup key={depto} heading={depto}>
                  {grupos[depto].map((juzgado) => (
                    <CommandItem
                      key={juzgado.id}
                      value={juzgado.id}
                      onSelect={() => handleSelect(juzgado.id)}
                      className="flex items-start gap-2 py-2"
                    >
                      <Check
                        className={cn(
                          'w-4 h-4 shrink-0 mt-0.5',
                          value === juzgado.id
                            ? 'opacity-100 text-blue-600'
                            : 'opacity-0'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">
                          {juzgado.nombre}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
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
                          {juzgado.municipio &&
                            juzgado.municipio !== depto && (
                              <span className="text-xs text-gray-500">
                                • {juzgado.municipio}
                              </span>
                            )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Botón X para limpiar — FUERA del Popover trigger para evitar button dentro de button */}
      {selected && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded z-10"
          aria-label="Limpiar selección"
        >
          <X className="w-3 h-3 text-gray-400" />
        </button>
      )}
    </div>
  );
}