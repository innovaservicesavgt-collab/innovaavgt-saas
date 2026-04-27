'use client';

import { useState } from 'react';
import { CaseDetailHeader } from './case-detail-header';
import { CaseFormDialog } from '@/app/(legal)/legal/cases/components/case-form-dialog';
import type { LegalCaseWithRelations } from '@/app/(legal)/legal/cases/types';
import type { ClientOption } from '@/app/(legal)/legal/cases/components/client-selector';
import type {
  CatalogJuzgado,
  CatalogFiscalia,
  CatalogTipoProceso,
} from '@/app/(legal)/legal/catalogs/types';

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
  juzgados: CatalogJuzgado[];
  fiscalias: CatalogFiscalia[];
  tiposProceso: CatalogTipoProceso[];
};

/**
 * SecciÃ³n cliente del detalle de expediente.
 * Maneja el header + modal de ediciÃ³n.
 */
export function CaseHeaderSection({
  caseData,
  clients,
  abogados,
  juzgados,
  fiscalias,
  tiposProceso,
}: Props) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <CaseDetailHeader caseData={caseData} onEdit={() => setEditOpen(true)} />

      <CaseFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        clients={clients}
        abogados={abogados}
        juzgados={juzgados}
        fiscalias={fiscalias}
        tiposProceso={tiposProceso}
        editingCase={caseData}
      />
    </>
  );
}