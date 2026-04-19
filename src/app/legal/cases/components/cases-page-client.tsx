'use client';

import { useState } from 'react';
import { CasesTable } from './cases-table';
import { CaseFormDialog } from './case-form-dialog';
import { LegalCaseWithRelations } from '../types';
import { ClientOption } from './client-selector';

type AbogadoOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Props = {
  initialCases: LegalCaseWithRelations[];
  clients: ClientOption[];
  abogados: AbogadoOption[];
};

export function CasesPageClient({ initialCases, clients, abogados }: Props) {
  const [editingCase, setEditingCase] = useState<LegalCaseWithRelations | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const handleNew = () => {
    setEditingCase(null);
    setFormOpen(true);
  };

  const handleEdit = (c: LegalCaseWithRelations) => {
    setEditingCase(c);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <CasesTable
        cases={initialCases}
        onNewCase={handleNew}
        onEditCase={handleEdit}
      />

      <CaseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingCase={editingCase}
        clients={clients}
        abogados={abogados}
      />
    </div>
  );
}