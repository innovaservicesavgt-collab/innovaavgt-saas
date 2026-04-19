'use client';

import { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  MoreVertical, Pencil, Archive, ArchiveRestore, Plus, Search, Eye,
} from 'lucide-react';
import { LegalCaseWithRelations } from '../types';
import { MATERIAS, getMateriaInfo } from '../constants';
import { DeleteCaseDialog } from './delete-case-dialog';
import { unarchiveCase } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

type Props = {
  cases: LegalCaseWithRelations[];
  onNewCase: () => void;
  onEditCase: (c: LegalCaseWithRelations) => void;
};

export function CasesTable({ cases, onNewCase, onEditCase }: Props) {
  const [search, setSearch] = useState('');
  const [materiaFilter, setMateriaFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LegalCaseWithRelations | null>(null);

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      // Filtro por estado (activos/archivados/todos)
      if (statusFilter === 'active' && c.archivado) return false;
      if (statusFilter === 'archived' && !c.archivado) return false;

      // Filtro por materia
      if (materiaFilter !== 'ALL' && c.materia !== materiaFilter) return false;

      // Búsqueda por texto
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const clientName = c.client?.nombre?.toLowerCase() ?? '';
        const match =
          c.numero_interno.toLowerCase().includes(q) ||
          (c.numero_judicial && c.numero_judicial.toLowerCase().includes(q)) ||
          clientName.includes(q) ||
          (c.organo_jurisdiccional && c.organo_jurisdiccional.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [cases, search, materiaFilter, statusFilter]);

  const handleUnarchive = async (c: LegalCaseWithRelations) => {
    const result = await unarchiveCase(c.id);
    if (result.success) toast.success(result.message);
    else toast.error(result.error);
  };

  const handleDelete = (c: LegalCaseWithRelations) => {
    setSelectedCase(c);
    setDeleteOpen(true);
  };

  return (
    <>
      {/* Filtros + Botón crear */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por número, cliente, juzgado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={materiaFilter} onValueChange={setMateriaFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Materia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas las materias</SelectItem>
              {MATERIAS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as 'active' | 'archived' | 'all')}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="archived">Archivados</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onNewCase}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo expediente
        </Button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Materia</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Abogado</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  {cases.length === 0
                    ? 'No hay expedientes registrados. Crea el primero con el botón de arriba.'
                    : 'No hay expedientes que coincidan con los filtros.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => {
                const materia = getMateriaInfo(c.materia);
                return (
                  <TableRow key={c.id} className={cn(c.archivado && 'opacity-60')}>
                    <TableCell className="font-mono font-medium">
                      <Link 
                         href={`/legal/cases/${c.id}`}
                         className="text-blue-600 hover:underline"
                         >
                       {c.numero_interno}
                     </Link>
                     {c.numero_judicial && (
                     <div className="text-xs text-gray-500 font-normal">
                       Jud: {c.numero_judicial}
                      </div>
                        )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(materia.color, 'hover:opacity-80')}>
                        {materia.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{c.client?.nombre ?? '—'}</div>
                      {c.parte_contraria && (
                        <div className="text-xs text-gray-500">
                          vs {c.parte_contraria}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {c.estado_procesal || '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {c.abogado
                        ? `${c.abogado.first_name} ${c.abogado.last_name}`.trim()
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {c.fecha_inicio
                        ? format(new Date(c.fecha_inicio), "dd MMM yyyy", { locale: es })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/legal/cases/${c.id}`} className="cursor-pointer">
                                  <Eye className="w-4 h-4 mr-2" />
                                   Ver detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditCase(c)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {c.archivado ? (
                            <DropdownMenuItem onClick={() => handleUnarchive(c)}>
                              <ArchiveRestore className="w-4 h-4 mr-2" />
                              Reactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleDelete(c)}
                              className="text-amber-600 focus:text-amber-600"
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archivar / Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        Mostrando {filtered.length} de {cases.length} expedientes
      </div>

      <DeleteCaseDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        caseId={selectedCase?.id ?? null}
        caseNumber={selectedCase?.numero_interno ?? ''}
      />
    </>
  );
}