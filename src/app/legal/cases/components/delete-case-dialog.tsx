'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { archiveCase, deleteCase } from '../actions';
import { toast } from 'sonner';
import { AlertTriangle, Archive } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string | null;
  caseNumber: string;
};

export function DeleteCaseDialog({ open, onOpenChange, caseId, caseNumber }: Props) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<'ask' | 'confirmDelete'>('ask');

  const handleArchive = () => {
    if (!caseId) return;
    startTransition(async () => {
      const result = await archiveCase(caseId);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        setMode('ask');
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = () => {
    if (!caseId) return;
    startTransition(async () => {
      const result = await deleteCase(caseId);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        setMode('ask');
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      onOpenChange(false);
      setMode('ask');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle>
              {mode === 'ask' ? 'Gestionar expediente' : '¿Eliminar definitivamente?'}
            </DialogTitle>
          </div>

          {mode === 'ask' ? (
            <DialogDescription className="pt-2">
              Estás por gestionar el expediente <strong>{caseNumber}</strong>.
              <br /><br />
              <strong>Archivar</strong> (recomendado) oculta el expediente pero preserva todos sus datos.
              <br />
              <strong>Eliminar</strong> borra permanentemente (solo si no tiene documentos ni audiencias).
            </DialogDescription>
          ) : (
            <DialogDescription className="pt-2">
              Esta acción no se puede deshacer. El expediente <strong>{caseNumber}</strong> 
              y todos sus datos serán eliminados para siempre.
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          {mode === 'ask' ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setMode('confirmDelete')}
                disabled={isPending}
              >
                Eliminar
              </Button>
              <Button onClick={handleArchive} disabled={isPending}>
                <Archive className="w-4 h-4 mr-2" />
                {isPending ? 'Archivando...' : 'Archivar'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode('ask')} disabled={isPending}>
                Volver
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}