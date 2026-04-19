'use client';

import { useState, useTransition, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload, FileText, X } from 'lucide-react';
import { uploadDocument } from '../actions';
import { 
  TIPOS_DOCUMENTO, 
  TipoDocumento, 
  ACCEPTED_EXTENSIONS, 
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  formatFileSize,
} from '../constants';

type CaseOption = {
  id: string;
  numero_interno: string;
  client: { nombre: string } | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: CaseOption[];
  defaultCaseId?: string;
};

export function UploadDialog({ 
  open, 
  onOpenChange, 
  cases, 
  defaultCaseId 
}: Props) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoDocumento>('MEMORIAL');
  const [caseId, setCaseId] = useState(defaultCaseId ?? '');

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setFile(null);
      setNombre('');
      setTipo('MEMORIAL');
      setCaseId(defaultCaseId ?? '');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    onOpenChange(isOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`El archivo excede ${MAX_FILE_SIZE_MB} MB`);
      e.target.value = '';
      return;
    }

    setFile(selected);
    
    if (!nombre) {
      const nombreSinExt = selected.name.replace(/\.[^/.]+$/, '');
      setNombre(nombreSinExt);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error('Selecciona un archivo');
      return;
    }
    if (!nombre.trim()) {
      toast.error('Escribe un nombre para el documento');
      return;
    }
    if (!caseId) {
      toast.error('Selecciona un expediente');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nombre', nombre.trim());
      formData.append('tipo', tipo);
      formData.append('case_id', caseId);

      const result = await uploadDocument(formData);

      if (result.success) {
        toast.success(result.message);
        handleOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
          <DialogDescription>
            Adjunta un documento al expediente. 
            Máximo {MAX_FILE_SIZE_MB} MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-400" />
                <div className="text-sm font-medium text-gray-700">
                  Click para seleccionar archivo
                </div>
                <div className="text-xs text-gray-500">
                  PDF, Word, Excel, imágenes (máx. {MAX_FILE_SIZE_MB} MB)
                </div>
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{file.name}</div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemoveFile}
                className="h-8 w-8 shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del documento *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Memorial de contestación"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de documento *</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDocumento)}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_DOCUMENTO.map((t) => {
                  const Icon = t.icon;
                  return (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {t.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="case_id">Expediente *</Label>
            {cases.length === 0 ? (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                No hay expedientes. Crea uno antes de subir documentos.
              </div>
            ) : (
              <Select 
                value={caseId} 
                onValueChange={setCaseId}
                disabled={!!defaultCaseId}
              >
                <SelectTrigger id="case_id">
                  <SelectValue placeholder="Selecciona un expediente..." />
                </SelectTrigger>
                <SelectContent>
                  {cases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="font-mono">{c.numero_interno}</span>
                      {c.client?.nombre && (
                        <span className="text-gray-500 ml-2">
                          — {c.client.nombre}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !file || !nombre.trim() || !caseId}
          >
            {isPending ? 'Subiendo...' : 'Subir documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}