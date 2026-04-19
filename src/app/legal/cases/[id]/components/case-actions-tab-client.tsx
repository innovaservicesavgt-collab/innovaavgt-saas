'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { ActionsTimeline } from '@/app/legal/actions/components/actions-timeline';
import { ActionFormDialog } from '@/app/legal/actions/components/action-form-dialog';
import { LegalActionWithRelations } from '@/app/legal/actions/types';

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};

type Props = {
  actions: LegalActionWithRelations[];
  cases: CaseOption[];
  caseId: string;
};

export function CaseActionsTabClient({ actions, cases, caseId }: Props) {
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

  const totalManual = actions.filter(
    (a) => !a.event_id && !a.document_id
  ).length;
  const totalAuto = actions.length - totalManual;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-gray-900">{actions.length}</div>
            <div className="text-xs text-gray-500">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-blue-600">{totalManual}</div>
            <div className="text-xs text-gray-500">Manuales</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-emerald-600">{totalAuto}</div>
            <div className="text-xs text-gray-500">Automáticas</div>
          </CardContent>
        </Card>
      </div>

      {/* Botón crear */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Historial del expediente</h3>
        <Button onClick={handleNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nueva actuación
        </Button>
      </div>

      {/* Timeline */}
      <ActionsTimeline
        actions={actions}
        onEdit={handleEdit}
        showCase={false}
      />

      {/* Modal */}
      <ActionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingAction={editing}
        cases={cases}
        defaultCaseId={caseId}
      />
    </div>
  );
}