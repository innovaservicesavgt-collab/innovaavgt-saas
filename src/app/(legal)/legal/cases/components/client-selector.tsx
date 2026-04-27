'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, UserIcon, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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

export type ClientOption = {
  id: string;
  nombre: string;
  tipo_persona: string;
  dpi: string | null;
  nit: string | null;
};

type Props = {
  clients: ClientOption[];
  value: string; // id del cliente seleccionado
  onChange: (clientId: string) => void;
  disabled?: boolean;
};

export function ClientSelector({ clients, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);

  const selected = clients.find((c) => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
          type="button"
        >
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              {selected.tipo_persona === 'JURIDICA' ? (
                <Building2 className="w-4 h-4 shrink-0 text-gray-500" />
              ) : (
                <UserIcon className="w-4 h-4 shrink-0 text-gray-500" />
              )}
              <span className="truncate">{selected.nombre}</span>
            </span>
          ) : (
            <span className="text-gray-500">Selecciona un cliente...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar por nombre, DPI o NIT..." />
          <CommandList>
            <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            <CommandGroup>
              {clients.map((c) => {
                const isSelected = value === c.id;
                const searchableText = [c.nombre, c.dpi, c.nit].filter(Boolean).join(' ');

                return (
                  <CommandItem
                    key={c.id}
                    value={searchableText}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {c.tipo_persona === 'JURIDICA' ? (
                        <Building2 className="w-4 h-4 shrink-0 text-gray-500" />
                      ) : (
                        <UserIcon className="w-4 h-4 shrink-0 text-gray-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{c.nombre}</div>
                        {(c.dpi || c.nit) && (
                          <div className="text-xs text-gray-500 truncate">
                            {c.dpi && `DPI: ${c.dpi}`}
                            {c.dpi && c.nit && ' • '}
                            {c.nit && `NIT: ${c.nit}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}