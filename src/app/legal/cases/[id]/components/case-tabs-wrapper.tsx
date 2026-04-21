import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Calendar,
  BookOpen,
  Paperclip,
  DollarSign,
  History,
} from 'lucide-react';
import { CaseHeaderSection } from './case-header-section';
import { CaseInfoTab } from './case-info-tab';
import { CaseAgendaTab } from './case-agenda-tab';
import { CaseDocumentsTab } from './case-documents-tab';
import { CaseActionsTab } from './case-actions-tab';
import { CaseFinancesTab } from './case-finances-tab';
import { AuditCaseHistory } from '@/app/legal/audit/components/audit-case-history';
import type { LegalCaseWithRelations } from '@/app/legal/cases/types';
import type { ClientOption } from '@/app/legal/cases/components/client-selector';
import type {
  CatalogJuzgado,
  CatalogFiscalia,
  CatalogTipoProceso,
} from '@/app/legal/catalogs/types';

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

export function CaseTabsWrapper({
  caseData,
  clients,
  abogados,
  juzgados,
  fiscalias,
  tiposProceso,
}: Props) {
  return (
    <div className="space-y-6">
      <CaseHeaderSection
        caseData={caseData}
        clients={clients}
        abogados={abogados}
        juzgados={juzgados}
        fiscalias={fiscalias}
        tiposProceso={tiposProceso}
      />

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">
            <FileText className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>
          <TabsTrigger value="agenda">
            <Calendar className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Agenda</span>
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Paperclip className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Documentos</span>
          </TabsTrigger>
          <TabsTrigger value="actions">
            <BookOpen className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Actuaciones</span>
          </TabsTrigger>
          <TabsTrigger value="finances">
            <DollarSign className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Honorarios</span>
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Historial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <CaseInfoTab caseData={caseData} />
        </TabsContent>

        <TabsContent value="agenda" className="mt-6">
          <CaseAgendaTab caseId={caseData.id} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <CaseDocumentsTab
            caseId={caseData.id}
            caseNumber={caseData.numero_interno}
          />
        </TabsContent>

        <TabsContent value="actions" className="mt-6">
          <CaseActionsTab caseId={caseData.id} />
        </TabsContent>

        <TabsContent value="finances" className="mt-6">
          <CaseFinancesTab caseId={caseData.id} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <AuditCaseHistory caseId={caseData.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}