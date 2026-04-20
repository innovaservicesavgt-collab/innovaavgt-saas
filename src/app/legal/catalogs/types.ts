// ============================================================
// JUZGADOS
// ============================================================

export type MateriaJuzgado =
  | 'CIVIL'
  | 'PENAL'
  | 'LABORAL'
  | 'FAMILIA'
  | 'MERCANTIL'
  | 'CONSTITUCIONAL'
  | 'ADMINISTRATIVO'
  | 'NIÑEZ'
  | 'ECONOMICO_COACTIVO'
  | 'MIXTO';

export type InstanciaJuzgado =
  | 'PAZ'
  | 'PRIMERA_INSTANCIA'
  | 'SENTENCIA'
  | 'SALA'
  | 'CORTE_SUPREMA'
  | 'CORTE_CONSTITUCIONAL';

export type CatalogJuzgado = {
  id: string;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  departamento: string;
  municipio: string | null;
  direccion: string | null;
  materia: MateriaJuzgado;
  instancia: InstanciaJuzgado;
  telefono: string | null;
  email: string | null;
  orden: number;
  activo: boolean;
};

// ============================================================
// FISCALÍAS
// ============================================================

export type TipoFiscalia =
  | 'FISCALIA_SECCION'
  | 'FISCALIA_DISTRITO'
  | 'FISCALIA_MUNICIPAL'
  | 'UNIDAD_ESPECIALIZADA';

export type CatalogFiscalia = {
  id: string;
  codigo: string;
  nombre: string;
  nombre_corto: string | null;
  tipo: TipoFiscalia;
  departamento: string;
  municipio: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  orden: number;
  activo: boolean;
};

// ============================================================
// TIPOS DE PROCESO
// ============================================================

export type MateriaTipoProceso =
  | 'CIVIL'
  | 'PENAL'
  | 'LABORAL'
  | 'FAMILIA'
  | 'MERCANTIL'
  | 'CONSTITUCIONAL'
  | 'ADMINISTRATIVO'
  | 'NIÑEZ'
  | 'ECONOMICO_COACTIVO';

export type CatalogTipoProceso = {
  id: string;
  codigo: string;
  nombre: string;
  materia: MateriaTipoProceso;
  descripcion: string | null;
  via_procesal: string | null;
  orden: number;
  activo: boolean;
};