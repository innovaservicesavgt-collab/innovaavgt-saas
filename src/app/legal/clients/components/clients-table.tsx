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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Plus, Search, UserCheck } from 'lucide-react';
import { LegalClient } from '../types';
import { ClientFormDialog } from './client-form-dialog';
import { DeleteClientDialog } from './delete-client-dialog';
import { reactivateClient } from '../actions';
import { toast } from 'sonner';

type Props = {
  clients: LegalClient[];
};

export function ClientsTable({ clients }: Props) {
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<LegalClient | null>(null);
  const [deletingClient, setDeletingClient] = useState<LegalClient | null>(null);

  // Filtrado en memoria (rápido para < 1000 registros)
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase().trim();
    return clients.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.dpi && c.dpi.toLowerCase().includes(q)) ||
        (c.nit && c.nit.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [clients, search]);

  const handleNew = () => {
    setEditingClient(null);
    setFormOpen(true);
  };

  const handleEdit = (client: LegalClient) => {
    setEditingClient(client);
    setFormOpen(true);
  };

  const handleDelete = (client: LegalClient) => {
    setDeletingClient(client);
    setDeleteOpen(true);
  };

  const handleReactivate = async (client: LegalClient) => {
    const result = await reactivateClient(client.id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, DPI, NIT o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo cliente
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>DPI / NIT</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                  {clients.length === 0
                    ? 'No hay clientes registrados. Crea el primero con el botón de arriba.'
                    : 'No se encontraron clientes con esos criterios de búsqueda.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={client.tipo_persona === 'NATURAL' ? 'secondary' : 'outline'}>
                      {client.tipo_persona === 'NATURAL' ? 'Natural' : 'Jurídica'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {client.dpi || client.nit || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {client.telefono || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {client.email || '—'}
                  </TableCell>
                  <TableCell>
                    {client.activo ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {!client.activo && (
                          <DropdownMenuItem onClick={() => handleReactivate(client)}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Reactivar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(client)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        Mostrando {filteredClients.length} de {clients.length} clientes
      </div>

      {/* Modales */}
      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingClient={editingClient}
      />

      <DeleteClientDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        clientId={deletingClient?.id ?? null}
        clientName={deletingClient?.nombre ?? ''}
      />
    </>
  );
}