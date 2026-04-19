'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ActionsTimeline } from './actions-timeline';
import { ActionFormDialog } from './action-form-dialog';
import { LegalActionWithRelations } from '../types';

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};

type Props = {
  initialActions: LegalActionWithRelations[];
  cases: CaseOption[];
};

export function ActionsPageClient({ initialActions, cases }: Props) {
  const [editing, setEditing] = useState<LegalActionWithRelations | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const handleNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (action: LegalActionWithRelations) => {
    setEditing(action);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva actuación
        </Button>
      </div>

      <ActionsTimeline
        actions={initialActions}
        onEdit={handleEdit}
        showCase={true}
      />

      <ActionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingAction={editing}
        cases={cases}
      />
    </div>
  );
}