'use client';

import { useState } from 'react';
import { CaseDetailHeader } from './case-detail-header';
import { CaseFormDialog } from '@/app/legal/cases/components/case-form-dialog';
import type { LegalCaseWithRelations } from '@/app/legal/cases/types';

type ClientOption = {
  id: string;
  nombre: string;
};

type AbogadoOption = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

type Props = {
  caseData: LegalCaseWithRelations;
  clients: ClientOption[];
  abogados: AbogadoOption[];
};

/**
 * Sección cliente del detalle de expediente.
 * Maneja el header + modal de edición.
 * Separado del wrapper para que los tabs puedan seguir siendo Server Components.
 */
export function CaseHeaderSection({ caseData, clients, abogados }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <CaseDetailHeader
        caseData={caseData}
        onEdit={() => setEditOpen(true)}
      />

      <CaseFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        clients={clients}
        abogados={abogados}
        editingCase={caseData}
      />
    </>
  );
}