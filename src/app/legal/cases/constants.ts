// Catálogos del módulo jurídico
// Modifica estos arrays si quieres cambiar opciones

export const MATERIAS = [
  { value: 'PENAL',          label: 'Penal',          color: 'bg-red-100 text-red-700' },
  { value: 'CIVIL',           label: 'Civil',          color: 'bg-blue-100 text-blue-700' },
  { value: 'LABORAL',         label: 'Laboral',        color: 'bg-amber-100 text-amber-700' },
  { value: 'ADMINISTRATIVO',  label: 'Administrativo', color: 'bg-purple-100 text-purple-700' },
  { value: 'NOTARIAL',        label: 'Notarial',       color: 'bg-teal-100 text-teal-700' },
  { value: 'FAMILIA',         label: 'Familia',        color: 'bg-pink-100 text-pink-700' },
  { value: 'MERCANTIL',       label: 'Mercantil',      color: 'bg-indigo-100 text-indigo-700' },
  { value: 'OTROS',           label: 'Otros',          color: 'bg-gray-100 text-gray-700' },
] as const;

export type Materia = typeof MATERIAS[number]['value'];

export const ESTADOS_PROCESALES = [
  'Investigación',
  'Etapa intermedia',
  'Juicio',
  'Ejecución',
  'Apelación',
  'Casación',
  'Amparo',
  'Archivado',
  'Transado',
  'Otro',
] as const;

// Tipos de proceso comunes por materia (sugerencias)
export const TIPOS_PROCESO_POR_MATERIA: Record<Materia, string[]> = {
  PENAL: [
    'Procedimiento común',
    'Procedimiento abreviado',
    'Juicio oral',
    'Acción privada',
    'Querella',
  ],
  CIVIL: [
    'Juicio ordinario',
    'Juicio sumario',
    'Juicio ejecutivo',
    'Juicio oral',
    'Proceso de conocimiento',
    'Interdicto',
  ],
  LABORAL: [
    'Juicio ordinario laboral',
    'Conflicto colectivo',
    'Demanda de reinstalación',
    'Prestaciones',
  ],
  ADMINISTRATIVO: [
    'Contencioso administrativo',
    'Amparo',
    'Recurso de revocatoria',
  ],
  NOTARIAL: [
    'Proceso sucesorio',
    'Titulación supletoria',
    'Identificación de tercero',
    'Patrimonio familiar',
  ],
  FAMILIA: [
    'Divorcio',
    'Alimentos',
    'Guarda y custodia',
    'Adopción',
    'Reconocimiento de unión de hecho',
  ],
  MERCANTIL: [
    'Juicio ejecutivo mercantil',
    'Quiebra',
    'Concurso de acreedores',
    'Protesto de títulos',
  ],
  OTROS: [
    'Otro',
  ],
};

/**
 * Helper: devuelve el prefijo corto de materia (3 letras)
 * para generar el número interno. Ej: PENAL → PEN
 */
export function materiaPrefix(materia: Materia): string {
  return materia.substring(0, 3);
}

/**
 * Devuelve la etiqueta y color de una materia
 */
export function getMateriaInfo(materia: string) {
  return MATERIAS.find((m) => m.value === materia) ?? MATERIAS[7]; // OTROS como fallback
}