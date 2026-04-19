import { 
  FileText, 
  Gavel, 
  Mail, 
  ScrollText, 
  Shield, 
  File as FileIconLucide, 
  BookOpen 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const TIPOS_DOCUMENTO = [
  { 
    value: 'MEMORIAL',     
    label: 'Memorial',    
    color: 'bg-blue-100 text-blue-700',
    icon: FileText,
  },
  { 
    value: 'OFICIO',       
    label: 'Oficio',      
    color: 'bg-indigo-100 text-indigo-700',
    icon: Mail,
  },
  { 
    value: 'RESOLUCION',   
    label: 'Resolución',  
    color: 'bg-purple-100 text-purple-700',
    icon: Gavel,
  },
  { 
    value: 'PRUEBA',       
    label: 'Prueba',      
    color: 'bg-amber-100 text-amber-700',
    icon: Shield,
  },
  { 
    value: 'CONTRATO',     
    label: 'Contrato',    
    color: 'bg-green-100 text-green-700',
    icon: ScrollText,
  },
  { 
    value: 'NOTIFICACION', 
    label: 'Notificación',
    color: 'bg-teal-100 text-teal-700',
    icon: BookOpen,
  },
  { 
    value: 'OTRO',         
    label: 'Otro',        
    color: 'bg-gray-100 text-gray-700',
    icon: FileIconLucide,
  },
] as const;

export type TipoDocumento = typeof TIPOS_DOCUMENTO[number]['value'];

export function getTipoDocInfo(tipo: string) {
  return TIPOS_DOCUMENTO.find((t) => t.value === tipo) ?? TIPOS_DOCUMENTO[6];
}

export function getIconByMimeType(mimeType: string | null): LucideIcon {
  if (!mimeType) return FileIconLucide;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('image')) return FileIconLucide;
  if (mimeType.includes('word') || mimeType.includes('document')) return ScrollText;
  return FileIconLucide;
}

/**
 * Formatea bytes a tamaño legible (KB, MB, GB)
 */
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Límite de tamaño y tipos MIME permitidos
 */
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
];

export const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.txt';;