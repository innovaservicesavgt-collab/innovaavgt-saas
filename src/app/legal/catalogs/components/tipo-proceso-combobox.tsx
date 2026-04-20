'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, FileText, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { CatalogTipoProceso } from '../types';
import { normalizeSearch } from '../utils';

type Props = {
  tiposProceso: CatalogTipoProceso[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  materiaFiltro?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function TipoProcesoCombobox({
  tiposProceso,
  value,
  onChange,
  materiaFiltro,
  placeholder = 'Buscar tipo de proceso...',
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const tiposFiltrados = useMemo(() => {
    if (!materiaFiltro) return tiposProceso;
    return tiposProceso.filter((t) => t.materia === materiaFiltro);
  }, [tiposProceso, materiaFiltro]);

  const tiposEnBusqueda = useMemo(() => {
    if (!search.trim()) return tiposFiltrados;
    const q = normalizeSearch(search);
    return tiposFiltrados.filter((t) => {
      const nombre = normalizeSearch(t.nombre);
      const desc = t.descripcion ? normalizeSearch(t.descripcion) : '';
      const via = t.via_procesal ? normalizeSearch(t.via_procesal) : '';
      return nombre.includes(q) || desc.includes(q) || via.includes(q);
    });
  }, [tiposFiltrados, search]);

  const selected = tiposProceso.find((t) => t.id === value) || null;

  const handleSelect = (tipoId: string) => {
    if (tipoId === value) {
      onChange(null);
    } else {
      onChange(tipoId);
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
              <FileText className="w-4 h-4 shrink-0 text-gray-400" />
              <span className="truncate text-left">
                {selected ? selected.nombre : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0 min-w-[380px]" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar tipo de proceso..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[320px]">
              {tiposEnBusqueda.length === 0 && (
                <CommandEmpty>
                  {materiaFiltro
                    ? 'No hay tipos de proceso para esta materia'
                    : 'No se encontraron tipos de proceso'}
                </CommandEmpty>
              )}

              <CommandGroup>
                {tiposEnBusqueda.map((tipo) => (
                  <CommandItem
                    key={tipo.id}
                    value={tipo.id}
                    onSelect={() => handleSelect(tipo.id)}
                    className="flex items-start gap-2 py-2"
                  >
                    <Check
                      className={cn(
                        'w-4 h-4 shrink-0 mt-0.5',
                        value === tipo.id
                          ? 'opacity-100 text-blue-600'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900">
                        {tipo.nombre}
                      </div>
                      {(tipo.via_procesal || tipo.descripcion) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {tipo.via_procesal && (
                            <span className="font-mono text-blue-600">
                              {tipo.via_procesal}
                            </span>
                          )}
                          {tipo.via_procesal && tipo.descripcion && ' · '}
                          {tipo.descripcion}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Botón X para limpiar */}
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