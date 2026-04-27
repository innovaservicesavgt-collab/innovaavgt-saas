import type {
  MateriaJuzgado,
  InstanciaJuzgado,
  TipoFiscalia,
  CatalogJuzgado,
  CatalogFiscalia,
  CatalogTipoProceso,
} from './types';

// ============================================================
// LABELS DE MATERIAS
// ============================================================

export const MATERIA_JUZGADO_LABELS: Record<MateriaJuzgado, string> = {
  CIVIL: 'Civil',
  PENAL: 'Penal',
  LABORAL: 'Laboral',
  FAMILIA: 'Familia',
  MERCANTIL: 'Mercantil',
  CONSTITUCIONAL: 'Constitucional',
  ADMINISTRATIVO: 'Administrativo',
  NIÑEZ: 'Niñez y Adolescencia',
  ECONOMICO_COACTIVO: 'Económico Coactivo',
  MIXTO: 'Mixto',
};

export const MATERIA_JUZGADO_COLORS: Record<MateriaJuzgado, string> = {
  CIVIL: 'bg-blue-100 text-blue-700',
  PENAL: 'bg-red-100 text-red-700',
  LABORAL: 'bg-amber-100 text-amber-700',
  FAMILIA: 'bg-pink-100 text-pink-700',
  MERCANTIL: 'bg-purple-100 text-purple-700',
  CONSTITUCIONAL: 'bg-indigo-100 text-indigo-700',
  ADMINISTRATIVO: 'bg-teal-100 text-teal-700',
  NIÑEZ: 'bg-green-100 text-green-700',
  ECONOMICO_COACTIVO: 'bg-cyan-100 text-cyan-700',
  MIXTO: 'bg-gray-100 text-gray-700',
};

// ============================================================
// LABELS DE INSTANCIAS
// ============================================================

export const INSTANCIA_LABELS: Record<InstanciaJuzgado, string> = {
  PAZ: 'Juzgado de Paz',
  PRIMERA_INSTANCIA: 'Primera Instancia',
  SENTENCIA: 'Tribunal de Sentencia',
  SALA: 'Sala de Apelaciones',
  CORTE_SUPREMA: 'Corte Suprema de Justicia',
  CORTE_CONSTITUCIONAL: 'Corte de Constitucionalidad',
};

export const INSTANCIA_ORDEN: Record<InstanciaJuzgado, number> = {
  CORTE_CONSTITUCIONAL: 1,
  CORTE_SUPREMA: 2,
  SALA: 3,
  SENTENCIA: 4,
  PRIMERA_INSTANCIA: 5,
  PAZ: 6,
};

// ============================================================
// LABELS DE FISCALÍAS
// ============================================================

export const TIPO_FISCALIA_LABELS: Record<TipoFiscalia, string> = {
  FISCALIA_SECCION: 'Fiscalía de Sección',
  FISCALIA_DISTRITO: 'Fiscalía Distrital',
  FISCALIA_MUNICIPAL: 'Fiscalía Municipal',
  UNIDAD_ESPECIALIZADA: 'Unidad Especializada',
};

export const TIPO_FISCALIA_COLORS: Record<TipoFiscalia, string> = {
  FISCALIA_SECCION: 'bg-red-100 text-red-700',
  FISCALIA_DISTRITO: 'bg-orange-100 text-orange-700',
  FISCALIA_MUNICIPAL: 'bg-yellow-100 text-yellow-700',
  UNIDAD_ESPECIALIZADA: 'bg-purple-100 text-purple-700',
};

// ============================================================
// HELPERS DE AGRUPACIÓN
// ============================================================

/**
 * Agrupa juzgados por departamento.
 */
export function agruparJuzgadosPorDepartamento(
  juzgados: CatalogJuzgado[]
): { [departamento: string]: CatalogJuzgado[] } {
  const grupos: { [key: string]: CatalogJuzgado[] } = {};
  for (const j of juzgados) {
    const key = j.departamento;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(j);
  }
  return grupos;
}

/**
 * Agrupa juzgados por materia.
 */
export function agruparJuzgadosPorMateria(
  juzgados: CatalogJuzgado[]
): { [materia: string]: CatalogJuzgado[] } {
  const grupos: { [key: string]: CatalogJuzgado[] } = {};
  for (const j of juzgados) {
    const key = j.materia;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(j);
  }
  return grupos;
}

/**
 * Agrupa fiscalías por tipo.
 */
export function agruparFiscaliasPorTipo(
  fiscalias: CatalogFiscalia[]
): { [tipo: string]: CatalogFiscalia[] } {
  const grupos: { [key: string]: CatalogFiscalia[] } = {};
  for (const f of fiscalias) {
    const key = f.tipo;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(f);
  }
  return grupos;
}

/**
 * Agrupa tipos de proceso por materia.
 */
export function agruparTiposProcesoPorMateria(
  tipos: CatalogTipoProceso[]
): { [materia: string]: CatalogTipoProceso[] } {
  const grupos: { [key: string]: CatalogTipoProceso[] } = {};
  for (const t of tipos) {
    const key = t.materia;
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(t);
  }
  return grupos;
}

// ============================================================
// HELPERS DE BÚSQUEDA
// ============================================================

/**
 * Normaliza texto: sin tildes, minúsculas, sin espacios extra.
 * Útil para buscar "jutiapa" y encontrar "Jutiapa".
 */
export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .trim();
}

/**
 * Busca juzgados por texto en nombre, nombre_corto, departamento o municipio.
 */
export function filtrarJuzgados(
  juzgados: CatalogJuzgado[],
  query: string
): CatalogJuzgado[] {
  if (!query.trim()) return juzgados;
  const q = normalizeSearch(query);
  return juzgados.filter((j) => {
    const nombre = normalizeSearch(j.nombre);
    const nombreCorto = j.nombre_corto ? normalizeSearch(j.nombre_corto) : '';
    const depto = normalizeSearch(j.departamento);
    const muni = j.municipio ? normalizeSearch(j.municipio) : '';
    const codigo = normalizeSearch(j.codigo);
    return (
      nombre.includes(q) ||
      nombreCorto.includes(q) ||
      depto.includes(q) ||
      muni.includes(q) ||
      codigo.includes(q)
    );
  });
}

/**
 * Busca fiscalías por texto.
 */
export function filtrarFiscalias(
  fiscalias: CatalogFiscalia[],
  query: string
): CatalogFiscalia[] {
  if (!query.trim()) return fiscalias;
  const q = normalizeSearch(query);
  return fiscalias.filter((f) => {
    const nombre = normalizeSearch(f.nombre);
    const nombreCorto = f.nombre_corto ? normalizeSearch(f.nombre_corto) : '';
    const depto = normalizeSearch(f.departamento);
    const muni = f.municipio ? normalizeSearch(f.municipio) : '';
    return (
      nombre.includes(q) ||
      nombreCorto.includes(q) ||
      depto.includes(q) ||
      muni.includes(q)
    );
  });
}

// ============================================================
// FORMATO DE DISPLAY
// ============================================================

/**
 * Devuelve el nombre amigable para mostrar en listas/selects.
 * Usa nombre_corto si está, sino nombre completo.
 */
export function getJuzgadoDisplayName(juzgado: CatalogJuzgado): string {
  return juzgado.nombre_corto || juzgado.nombre;
}

export function getFiscaliaDisplayName(fiscalia: CatalogFiscalia): string {
  return fiscalia.nombre_corto || fiscalia.nombre;
}