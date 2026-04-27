'use client';

import { useState, useMemo, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Receipt,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import {
  LegalExpenseWithRelations,
  TipoGastoCatalog,
  ExpenseStats,
} from '@/app/(legal)/legal/finances/types';
import { toggleCobrado } from '@/app/(legal)/legal/finances/expense-actions';
import { formatMoney, Moneda } from '@/app/(legal)/legal/finances/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ExpenseDialog } from './expense-dialog';
import { DeleteExpenseDialog } from './delete-expense-dialog';
import { ExpensesSummary } from './expenses-summary';

type Props = {
  expenses: LegalExpenseWithRelations[];
  tiposGasto: TipoGastoCatalog[];
  stats: ExpenseStats;
  caseId: string;
  moneda: Moneda;
};

const CATEGORIA_COLORS: Record<string, string> = {
  TIMBRE: 'bg-blue-100 text-blue-700',
  COPIAS: 'bg-indigo-100 text-indigo-700',
  HONORARIOS_3RO: 'bg-purple-100 text-purple-700',
  TRANSPORTE: 'bg-amber-100 text-amber-700',
  TASA_JUDICIAL: 'bg-teal-100 text-teal-700',
  INSCRIPCION: 'bg-green-100 text-green-700',
  OTRO: 'bg-gray-100 text-gray-700',
};

export function ExpensesList({
  expenses,
  tiposGasto,
  stats,
  caseId,
  moneda,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<LegalExpenseWithRelations | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'recuperable' | 'cobrado' | 'no_recuperable'>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('ALL');

  // Filtrado
  const filtered = useMemo(() => {
    return expenses.filter((exp) => {
      // Filtro bÃºsqueda
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNombre = exp.tipo_gasto?.nombre.toLowerCase().includes(q);
        const matchDesc = exp.descripcion?.toLowerCase().includes(q);
        if (!matchNombre && !matchDesc) return false;
      }

      // Filtro categorÃ­a
      if (filterCategoria !== 'ALL' && exp.tipo_gasto?.categoria !== filterCategoria) {
        return false;
      }

      // Filtro estado
      if (filterEstado === 'recuperable' && !exp.recuperable) return false;
      if (filterEstado === 'cobrado' && (!exp.recuperable || !exp.cobrado))
        return false;
      if (filterEstado === 'no_recuperable' && exp.recuperable) return false;

      return true;
    });
  }, [expenses, search, filterEstado, filterCategoria]);

  const handleToggleCobrado = (expense: LegalExpenseWithRelations) => {
    startTransition(async () => {
      const result = await toggleCobrado(expense.id, !expense.cobrado);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleEdit = (exp: LegalExpenseWithRelations) => {
    setEditing(exp);
    setEditOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats */}
        <ExpensesSummary stats={stats} moneda={moneda} />

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-medium text-gray-900">
            Gastos del proceso ({expenses.length})
          </h3>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Registrar gasto
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar gasto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterCategoria} onValueChange={setFilterCategoria}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="CategorÃ­a" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las categorÃ­as</SelectItem>
              <SelectItem value="TIMBRE">Timbres</SelectItem>
              <SelectItem value="COPIAS">Copias</SelectItem>
              <SelectItem value="HONORARIOS_3RO">Honorarios 3ros</SelectItem>
              <SelectItem value="TRANSPORTE">Transporte</SelectItem>
              <SelectItem value="TASA_JUDICIAL">Tasas judiciales</SelectItem>
              <SelectItem value="INSCRIPCION">Inscripciones</SelectItem>
              <SelectItem value="OTRO">Otros</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filterEstado}
            onValueChange={(v) =>
              setFilterEstado(v as 'all' | 'recuperable' | 'cobrado' | 'no_recuperable')
            }
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="recuperable">Por cobrar</SelectItem>
              <SelectItem value="cobrado">Cobrados</SelectItem>
              <SelectItem value="no_recuperable">No recuperables</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center text-center">
                <Receipt className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="font-medium text-gray-900">
                  {expenses.length === 0 ? 'Sin gastos' : 'Sin resultados'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {expenses.length === 0
                    ? 'Registra el primer gasto del proceso'
                    : 'Intenta con otros filtros'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((exp) => {
              const catColor =
                CATEGORIA_COLORS[exp.tipo_gasto?.categoria || 'OTRO'] ||
                CATEGORIA_COLORS.OTRO;

              return (
                <div
                  key={exp.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors bg-white"
                >
                  {/* Toggle cobrado (solo si recuperable) */}
                  {exp.recuperable ? (
                    <button
                      onClick={() => handleToggleCobrado(exp)}
                      disabled={isPending}
                      className="mt-1 shrink-0"
                      title={
                        exp.cobrado ? 'Marcar como no cobrado' : 'Marcar como cobrado'
                      }
                    >
                      {exp.cobrado ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 hover:text-green-700" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-gray-500" />
                      )}
                    </button>
                  ) : (
                    <div className="w-5 h-5 mt-1 shrink-0" />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-gray-900">
                            {exp.tipo_gasto?.nombre || 'Otro gasto'}
                          </span>
                          <Badge className={cn(catColor, 'hover:opacity-80 text-xs')}>
                            {exp.tipo_gasto?.categoria || 'OTRO'}
                          </Badge>
                          {!exp.recuperable && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-gray-50 text-gray-600"
                            >
                              No recuperable
                            </Badge>
                          )}
                          {exp.recuperable && exp.cobrado && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-green-50 text-green-700 border-green-200"
                            >
                              âœ“ Cobrado
                            </Badge>
                          )}
                          {exp.recuperable && !exp.cobrado && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                            >
                              Por cobrar
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <span>
                            {format(new Date(exp.fecha), "d 'de' MMM yyyy", {
                              locale: es,
                            })}
                          </span>
                          {exp.cobrado && exp.fecha_cobrado && (
                            <>
                              <span>â€¢</span>
                              <span className="text-green-600">
                                Cobrado:{' '}
                                {format(new Date(exp.fecha_cobrado), "d MMM", {
                                  locale: es,
                                })}
                              </span>
                            </>
                          )}
                        </div>

                        {exp.descripcion && (
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {exp.descripcion}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0 flex items-start gap-1">
                        <div>
                          <div className="font-semibold text-gray-900">
                            {formatMoney(exp.monto, exp.moneda)}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(exp)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(exp.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modales */}
      <ExpenseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        caseId={caseId}
        tiposGasto={tiposGasto}
      />

      <ExpenseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        caseId={caseId}
        tiposGasto={tiposGasto}
        editingExpense={editing}
      />

      <DeleteExpenseDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        expenseId={deleteId}
      />
    </>
  );
}