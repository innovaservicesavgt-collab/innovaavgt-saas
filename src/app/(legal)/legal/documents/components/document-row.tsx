'use client';

import { useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Download, 
  Eye, 
  Trash2,
} from 'lucide-react';
import { LegalDocumentWithCase } from '../types';
import { 
  getTipoDocInfo, 
  getIconByMimeType, 
  formatFileSize 
} from '../constants';
import { getDownloadUrl, getPreviewUrl } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { DeleteDocumentDialog } from './delete-document-dialog';

type Props = {
  doc: LegalDocumentWithCase;
  showCase?: boolean;
};

export function DocumentRow({ doc, showCase = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const tipo = getTipoDocInfo(doc.tipo);
  const FileIcon = getIconByMimeType(doc.mime_type);
  const TipoIcon = tipo.icon;

  const handleDownload = () => {
    startTransition(async () => {
      const result = await getDownloadUrl(doc.id);
      if (result.success && result.url) {
        window.open(result.url, '_blank');
        toast.success('Descargando...');
      } else if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  const handlePreview = () => {
    startTransition(async () => {
      const result = await getPreviewUrl(doc.id);
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  const canPreview = doc.mime_type?.includes('pdf') || doc.mime_type?.includes('image');

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          tipo.color
        )}>
          <FileIcon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-medium text-sm text-gray-900 truncate">
              {doc.nombre}
            </div>
            <Badge className={cn(tipo.color, 'hover:opacity-80 text-xs')}>
              <TipoIcon className="w-3 h-3 mr-1" />
              {tipo.label}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
            <span>{formatFileSize(doc.tamano_bytes)}</span>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(doc.created_at), { 
                addSuffix: true, 
                locale: es 
              })}
            </span>
            {showCase && doc.case && (
              <>
                <span>•</span>
                <Link 
                  href={`/legal/cases/${doc.case.id}`}
                  className="text-blue-600 hover:underline font-mono"
                >
                  {doc.case.numero_interno}
                </Link>
                {doc.case.client?.nombre && (
                  <span className="truncate">
                    — {doc.case.client.nombre}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isPending}
          >
            <Download className="w-4 h-4 mr-1" />
            Descargar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canPreview && (
                <DropdownMenuItem onClick={handlePreview} disabled={isPending}>
                  <Eye className="w-4 h-4 mr-2" />
                  Previsualizar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DeleteDocumentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        documentId={doc.id}
        documentName={doc.nombre}
      />
    </>
  );
}