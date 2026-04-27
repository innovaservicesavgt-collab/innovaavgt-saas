'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { DocumentsList } from '@/app/(legal)/legal/documents/components/documents-list';
import { UploadDialog } from '@/app/(legal)/legal/documents/components/upload-dialog';
import { LegalDocumentWithCase } from '@/app/(legal)/legal/documents/types';
import { Card, CardContent } from '@/components/ui/card';
import { formatFileSize } from '@/app/(legal)/legal/documents/constants';

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};

type Props = {
  documents: LegalDocumentWithCase[];
  cases: CaseOption[];
  caseId: string;
  caseNumber: string;
};

export function DocumentsTabClient({ documents, cases, caseId }: Props) {
  const [uploadOpen, setUploadOpen] = useState(false);

  const totalBytes = documents.reduce((sum, d) => sum + (d.tamano_bytes || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
            <div className="text-xs text-gray-500">Documento(s) total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-gray-900">{formatFileSize(totalBytes)}</div>
            <div className="text-xs text-gray-500">Espacio usado</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">
          Documentos del expediente
        </h3>
        <Button onClick={() => setUploadOpen(true)} size="sm">
          <Upload className="w-4 h-4 mr-2" />
          Subir documento
        </Button>
      </div>

      <DocumentsList documents={documents} showCase={false} />

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        cases={cases}
        defaultCaseId={caseId}
      />
    </div>
  );
}