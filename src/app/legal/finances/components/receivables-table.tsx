'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronRight, Receipt, Calendar } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/app/legal/finances/constants';
import type { ReceivableItem } from '@/app/legal/finances/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Props = {
  items: ReceivableItem[];
};

export function ReceivablesTable({ items }: Props) {
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState<'all' | 'installment' | 'expense'>(
    'all'
  );
  const [filterEstado, setFilterEstado] = useState<'all' | 'vencido' | 'vigente'>(
    'all'
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (filterTipo !== 'all' && item.type !== filterTipo) return false;

      if (filterEstado === 'vencido' && item.estado !== 'VENCIDO') return false;
      if (filterEstado === 'vigente' && item.estado === 'VENCIDO') return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchConcepto = item.concepto.toLowerCase().includes(q);
        const matchCaseNumber = item.caseNumber.toLowerCase().includes(q);
        const matchClient = item.clientName?.toLowerCase().includes(q);
        if (!matchConcepto && !matchCaseNumber && !matchClient) return false;
      }

      return true;
    });
  }, [items, search, filterTipo, filterEstado]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Cuentas por cobrar ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por expediente, cliente o concepto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={filterTipo}
            onValueChange={(v) =>
              setFilterTipo(v as 'all' | 'installment' | 'expense')
            }
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo</SelectItem>
              <SelectItem value="installment">Cuotas</SelectItem>
              <SelectItem value="expense">Gastos</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterEstado}
            onValueChange={(v) =>
              setFilterEstado(v as 'all' | 'vencido' | 'vigente')
            }
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="vencido">Vencidos</SelectItem>
              <SelectItem value="vigente">Vigentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">
              {items.length === 0
                ? 'No hay cuentas por cobrar'
                : 'Sin resultados con los filtros actuales'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={`/legal/cases/${item.caseId}`}
                className="block"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  {/* Icono */}
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      item.type === 'installment'
                        ? 'bg-blue-50'
                        : 'bg-purple-50'
                    )}
                  >
                    {item.type === 'installment' ? (
                      <Calendar
                        className={cn(
                          'w-4 h-4',
                          item.type === 'installment'
                            ? 'text-blue-600'
                            : 'text-purple-600'
                        )}
                      />
                    ) : (
                      <Receipt className="w-4 h-4 text-purple-600" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">
                        {item.concepto}
                      </span>
                      {item.estado === 'VENCIDO' && (
                        <Badge
                          className={cn(
                            'text-xs',
                            item.diasVencido > 30
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {item.diasVencido} días vencido
                        </Badge>
                      )}
                      {item.type === 'expense' && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                        >
                          Gasto
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                      <span className="font-mono text-blue-600">
                        {item.caseNumber}
                      </span>
                      {item.clientName && (
                        <>
                          <span>•</span>
                          <span className="truncate">{item.clientName}</span>
                        </>
                      )}
                      {item.fechaVencimiento && (
                        <>
                          <span>•</span>
                          <span>
                            Vence:{' '}
                            {format(new Date(item.fechaVencimiento), 'd MMM yyyy', {
                              locale: es,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Monto */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div
                        className={cn(
                          'font-semibold',
                          item.estado === 'VENCIDO'
                            ? 'text-red-700'
                            : 'text-gray-900'
                        )}
                      >
                        {formatMoney(item.monto, item.moneda)}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Mostrando {filtered.length} de {items.length} cuenta(s) por cobrar
          </div>
        )}
      </CardContent>
    </Card>
  );
}