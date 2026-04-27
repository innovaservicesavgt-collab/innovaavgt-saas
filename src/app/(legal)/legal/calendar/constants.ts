export const TIPOS_EVENTO = [
  { 
    value: 'AUDIENCIA', 
    label: 'Audiencia', 
    color: 'bg-red-100 text-red-700 border-red-200',
    hex: '#ef4444', // rojo (crítico)
    icon: 'gavel',
  },
  { 
    value: 'PLAZO_LEGAL', 
    label: 'Plazo legal', 
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    hex: '#f97316', // naranja
    icon: 'clock',
  },
  { 
    value: 'MEMORIAL', 
    label: 'Memorial', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    hex: '#3b82f6', // azul
    icon: 'file-pen',
  },
  { 
    value: 'OFICIO', 
    label: 'Oficio', 
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    hex: '#6366f1', // índigo
    icon: 'mail',
  },
  { 
    value: 'DILIGENCIA', 
    label: 'Diligencia', 
    color: 'bg-teal-100 text-teal-700 border-teal-200',
    hex: '#14b8a6', // teal
    icon: 'briefcase',
  },
  { 
    value: 'REUNION_CLIENTE', 
    label: 'Reunión con cliente', 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    hex: '#a855f7', // morado
    icon: 'users',
  },
  { 
    value: 'OTRO', 
    label: 'Otro', 
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    hex: '#6b7280', // gris
    icon: 'calendar',
  },
] as const;

export type TipoEvento = typeof TIPOS_EVENTO[number]['value'];

export function getTipoEventoInfo(tipo: string) {
  return TIPOS_EVENTO.find((t) => t.value === tipo) ?? TIPOS_EVENTO[6]; // OTRO fallback
}

/**
 * Calcula el nivel de urgencia de un evento
 * según cuántos días faltan
 */
export function getNivelUrgencia(
  fechaEvento: Date | string, 
  completado: boolean
): 'completado' | 'vencido' | 'hoy' | 'urgente' | 'proximo' | 'lejano' {
  if (completado) return 'completado';
  
  const fecha = typeof fechaEvento === 'string' ? new Date(fechaEvento) : fechaEvento;
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const fechaDia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  
  const diffMs = fechaDia.getTime() - hoy.getTime();
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDias < 0) return 'vencido';
  if (diffDias === 0) return 'hoy';
  if (diffDias <= 3) return 'urgente';
  if (diffDias <= 7) return 'proximo';
  return 'lejano';
}

/**
 * Devuelve clase CSS según urgencia (semáforo)
 */
export function getColorSemaforo(urgencia: ReturnType<typeof getNivelUrgencia>): string {
  switch (urgencia) {
    case 'vencido':
      return 'bg-red-600 text-white';
    case 'hoy':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'urgente':
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'proximo':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'lejano':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'completado':
      return 'bg-gray-100 text-gray-500 line-through';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Etiqueta legible del nivel de urgencia
 */
export function getEtiquetaUrgencia(urgencia: ReturnType<typeof getNivelUrgencia>): string {
  switch (urgencia) {
    case 'vencido': return 'Vencido';
    case 'hoy': return 'Hoy';
    case 'urgente': return 'Próximos 3 días';
    case 'proximo': return 'Esta semana';
    case 'lejano': return 'Futuro';
    case 'completado': return 'Completado';
    default: return '';
  }
}