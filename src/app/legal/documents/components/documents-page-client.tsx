'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { DocumentsList } from './documents-list';
import { UploadDialog } from './upload-dialog';
import { LegalDocumentWithCase } from '../types';

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};

type Props = {
  documents: LegalDocumentWithCase[];
  cases: CaseOption[];
};

export function DocumentsPageClient({ documents, cases }: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Subir documento
        </Button>
      </div>

      <DocumentsList documents={documents} showCase={true} />

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        cases={cases}
      />
    </div>
  );
}