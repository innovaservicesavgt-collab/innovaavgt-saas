'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, FileText } from 'lucide-react';
import { LegalDocumentWithCase } from '../types';
import { TIPOS_DOCUMENTO } from '../constants';
import { DocumentRow } from './document-row';

type Props = {
  documents: LegalDocumentWithCase[];
  showCase?: boolean;
};

export function DocumentsList({ documents, showCase = false }: Props) {
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (tipoFilter !== 'ALL' && d.tipo !== tipoFilter) return false;
      
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match = 
          d.nombre.toLowerCase().includes(q) ||
          (d.case?.numero_interno.toLowerCase().includes(q)) ||
          (d.case?.client?.nombre.toLowerCase().includes(q));
        if (!match) return false;
      }
      
      return true;
    });
  }, [documents, search, tipoFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            {TIPOS_DOCUMENTO.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg py-12">
          <div className="flex flex-col items-center text-center">
            <FileText className="w-12 h-12 text-gray-300 mb-3" />
            <h3 className="font-medium text-gray-900">
              {documents.length === 0 
                ? 'Sin documentos'
                : 'No hay resultados'}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {documents.length === 0 
                ? 'Sube el primer documento con el botón de arriba'
                : 'Intenta con otros filtros'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} showCase={showCase} />
          ))}
        </div>
      )}

      <div className="text-sm text-gray-500">
        Mostrando {filtered.length} de {documents.length} documento(s)
      </div>
    </div>
  );
}