import {
  FileText,
  Gavel,
  Mail,
  Users,
  Briefcase,
  Calendar,
  CheckCircle2,
  Upload,
  Edit,
  MessageSquare,
  Scale,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TipoActuacionInfo = {
  value: string;
  label: string;
  color: string;
  hex: string;
  icon: LucideIcon;
  sistema: boolean; // Si es auto-generada por el sistema
};

export const TIPOS_ACTUACION: TipoActuacionInfo[] = [
  // Manuales
  {
    value: 'MEMORIAL_PRESENTADO',
    label: 'Memorial presentado',
    color: 'bg-blue-100 text-blue-700',
    hex: '#3b82f6',
    icon: FileText,
    sistema: false,
  },
  {
    value: 'AUDIENCIA_REALIZADA',
    label: 'Audiencia realizada',
    color: 'bg-red-100 text-red-700',
    hex: '#ef4444',
    icon: Gavel,
    sistema: false,
  },
  {
    value: 'RESOLUCION_NOTIFICADA',
    label: 'Resolución notificada',
    color: 'bg-purple-100 text-purple-700',
    hex: '#a855f7',
    icon: Mail,
    sistema: false,
  },
  {
    value: 'DILIGENCIA_REALIZADA',
    label: 'Diligencia realizada',
    color: 'bg-teal-100 text-teal-700',
    hex: '#14b8a6',
    icon: Briefcase,
    sistema: false,
  },
  {
    value: 'REUNION_CLIENTE',
    label: 'Reunión con cliente',
    color: 'bg-indigo-100 text-indigo-700',
    hex: '#6366f1',
    icon: Users,
    sistema: false,
  },
  {
    value: 'COMUNICACION',
    label: 'Comunicación importante',
    color: 'bg-amber-100 text-amber-700',
    hex: '#f59e0b',
    icon: MessageSquare,
    sistema: false,
  },
  {
    value: 'ESTRATEGIA',
    label: 'Nota estratégica',
    color: 'bg-green-100 text-green-700',
    hex: '#10b981',
    icon: Scale,
    sistema: false,
  },
  {
    value: 'OTRO',
    label: 'Otra actuación',
    color: 'bg-gray-100 text-gray-700',
    hex: '#6b7280',
    icon: Edit,
    sistema: false,
  },
  // Automáticas (solo lectura)
  {
    value: 'EVENTO_COMPLETADO',
    label: 'Evento completado',
    color: 'bg-emerald-100 text-emerald-700',
    hex: '#059669',
    icon: CheckCircle2,
    sistema: true,
  },
  {
    value: 'DOCUMENTO_SUBIDO',
    label: 'Documento adjuntado',
    color: 'bg-sky-100 text-sky-700',
    hex: '#0ea5e9',
    icon: Upload,
    sistema: true,
  },
  {
    value: 'EXPEDIENTE_CREADO',
    label: 'Expediente creado',
    color: 'bg-slate-100 text-slate-700',
    hex: '#64748b',
    icon: Calendar,
    sistema: true,
  },
];

// Solo los tipos que el usuario puede crear manualmente
export const TIPOS_ACTUACION_MANUAL = TIPOS_ACTUACION.filter((t) => !t.sistema);

export function getTipoActuacionInfo(tipo: string): TipoActuacionInfo {
  return TIPOS_ACTUACION.find((t) => t.value === tipo) ?? TIPOS_ACTUACION[7];
}