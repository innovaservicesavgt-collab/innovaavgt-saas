'use client';

import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Building2, X } from 'lucide-react';
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
import type { CatalogFiscalia } from '../types';
import {
  TIPO_FISCALIA_LABELS,
  TIPO_FISCALIA_COLORS,
  agruparFiscaliasPorTipo,
  filtrarFiscalias,
  getFiscaliaDisplayName,
} from '../utils';

type Props = {
  fiscalias: CatalogFiscalia[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

const TIPO_ORDEN: Record<string, number> = {
  FISCALIA_SECCION: 1,
  FISCALIA_DISTRITO: 2,
  FISCALIA_MUNICIPAL: 3,
  UNIDAD_ESPECIALIZADA: 4,
};

export function FiscaliaCombobox({
  fiscalias,
  value,
  onChange,
  placeholder = 'Buscar fiscalía...',
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const fiscaliasEnBusqueda = useMemo(
    () => filtrarFiscalias(fiscalias, search),
    [fiscalias, search]
  );

  const grupos = useMemo(
    () => agruparFiscaliasPorTipo(fiscaliasEnBusqueda),
    [fiscaliasEnBusqueda]
  );

  const tiposOrdenados = useMemo(
    () =>
      Object.keys(grupos).sort(
        (a, b) => (TIPO_ORDEN[a] || 99) - (TIPO_ORDEN[b] || 99)
      ),
    [grupos]
  );

  const selected = fiscalias.find((f) => f.id === value) || null;

  const handleSelect = (fiscaliaId: string) => {
    if (fiscaliaId === value) {
      onChange(null);
    } else {
      onChange(fiscaliaId);
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
              <Building2 className="w-4 h-4 shrink-0 text-gray-400" />
              <span className="truncate text-left">
                {selected ? getFiscaliaDisplayName(selected) : placeholder}
              </span>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0 min-w-[380px]" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar fiscalía..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[320px]">
              {fiscaliasEnBusqueda.length === 0 && (
                <CommandEmpty>No se encontraron fiscalías</CommandEmpty>
              )}

              {tiposOrdenados.map((tipo) => (
                <CommandGroup
                  key={tipo}
                  heading={
                    TIPO_FISCALIA_LABELS[
                      tipo as keyof typeof TIPO_FISCALIA_LABELS
                    ]
                  }
                >
                  {grupos[tipo].map((fiscalia) => (
                    <CommandItem
                      key={fiscalia.id}
                      value={fiscalia.id}
                      onSelect={() => handleSelect(fiscalia.id)}
                      className="flex items-start gap-2 py-2"
                    >
                      <Check
                        className={cn(
                          'w-4 h-4 shrink-0 mt-0.5',
                          value === fiscalia.id
                            ? 'opacity-100 text-blue-600'
                            : 'opacity-0'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">
                          {fiscalia.nombre}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge
                            className={cn(
                              'text-xs',
                              TIPO_FISCALIA_COLORS[fiscalia.tipo]
                            )}
                          >
                            {fiscalia.departamento}
                          </Badge>
                          {fiscalia.municipio &&
                            fiscalia.municipio !== fiscalia.departamento && (
                              <span className="text-xs text-gray-500">
                                {fiscalia.municipio}
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