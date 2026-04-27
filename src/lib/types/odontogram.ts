// ─────────────────────────────────────────────────────────────
// Numeración FDI (Federación Dental Internacional)
// Estándar usado en Guatemala y la mayoría del mundo
// ─────────────────────────────────────────────────────────────

/** 32 piezas permanentes (adulto) en orden visual de odontograma */
export const ADULT_TEETH = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft:  [21, 22, 23, 24, 25, 26, 27, 28],
  lowerLeft:  [31, 32, 33, 34, 35, 36, 37, 38],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
} as const;

/** 20 piezas deciduas (niño) en orden visual de odontograma */
export const CHILD_TEETH = {
  upperRight: [55, 54, 53, 52, 51],
  upperLeft:  [61, 62, 63, 64, 65],
  lowerLeft:  [71, 72, 73, 74, 75],
  lowerRight: [85, 84, 83, 82, 81],
} as const;

/** Caras de la pieza dental */
export type ToothFace =
  | 'vestibular'   // exterior (cara hacia la mejilla/labio)
  | 'lingual'      // interior (cara hacia la lengua/paladar)
  | 'mesial'       // hacia la línea media
  | 'distal'       // alejada de la línea media
  | 'oclusal';     // cara masticatoria (oclusal en posteriores, incisal en anteriores)

export const TOOTH_FACES: ToothFace[] = [
  'vestibular',
  'lingual',
  'mesial',
  'distal',
  'oclusal',
];

/** Estados generales de la pieza completa */
export type ToothStatus =
  | 'present'       // pieza presente y normal
  | 'missing'       // ausente
  | 'extraction'    // indicada para extraer
  | 'implant'       // implante
  | 'crown'         // corona total
  | 'provisional'   // provisional
  | 'unerupted'     // no erupcionada
  | 'fractured';    // fracturada

/** Tratamientos por cara */
export type FaceTreatment =
  | 'caries'        // caries existente
  | 'resin'         // resina compuesta
  | 'amalgam'       // amalgama
  | 'sealant'       // sellante
  | 'endodontic'    // endodoncia
  | 'inlay'         // incrustación
  | 'fracture'      // fractura
  | 'restoration_to_replace'; // restauración a reemplazar

/** Información de una pieza */
export type ToothData = {
  number: number;             // FDI (11-48 o 51-85)
  status: ToothStatus;
  faces: Partial<Record<ToothFace, FaceTreatment>>;
  notes?: string;
  updated_at?: string;
  updated_by?: string;
};

/** Estructura completa del odontograma en metadata */
export type OdontogramData = {
  /** Mapa de pieza FDI → datos */
  teeth: Record<string, ToothData>;
  /** Modo visual seleccionado */
  view_mode?: 'auto' | 'adult' | 'child' | 'mixed';
  /** Fecha del último cambio */
  updated_at?: string;
};

/** Calcula qué dentición mostrar según edad */
export function getDentitionByAge(birthDate: string | null): 'adult' | 'child' | 'mixed' {
  if (!birthDate) return 'adult';
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 'adult';

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

  if (age < 6) return 'child';
  if (age < 13) return 'mixed';
  return 'adult';
}

/** Resuelve el modo de vista final combinando automatica + manual */
export function resolveViewMode(
  selectedMode: 'auto' | 'adult' | 'child' | 'mixed' | undefined,
  birthDate: string | null
): 'adult' | 'child' | 'mixed' {
  if (!selectedMode || selectedMode === 'auto') {
    return getDentitionByAge(birthDate);
  }
  return selectedMode;
}

/** Lista plana de números de piezas según vista */
export function getTeethNumbers(view: 'adult' | 'child' | 'mixed'): {
  upperRight: number[];
  upperLeft: number[];
  lowerLeft: number[];
  lowerRight: number[];
} {
  if (view === 'child') {
    return {
      upperRight: [...CHILD_TEETH.upperRight],
      upperLeft: [...CHILD_TEETH.upperLeft],
      lowerLeft: [...CHILD_TEETH.lowerLeft],
      lowerRight: [...CHILD_TEETH.lowerRight],
    };
  }
  if (view === 'mixed') {
    // En dentición mixta mostramos AMBOS arcos
    // (la implementación de UI decide cómo mostrar)
    return {
      upperRight: [...ADULT_TEETH.upperRight],
      upperLeft: [...ADULT_TEETH.upperLeft],
      lowerLeft: [...ADULT_TEETH.lowerLeft],
      lowerRight: [...ADULT_TEETH.lowerRight],
    };
  }
  return {
    upperRight: [...ADULT_TEETH.upperRight],
    upperLeft: [...ADULT_TEETH.upperLeft],
    lowerLeft: [...ADULT_TEETH.lowerLeft],
    lowerRight: [...ADULT_TEETH.lowerRight],
  };
}

/** Identifica si una pieza es anterior (incisivos/caninos) o posterior */
export function isAnteriorTooth(num: number): boolean {
  const lastDigit = num % 10;
  return lastDigit >= 1 && lastDigit <= 3;
}

/** Nombre descriptivo de la pieza según FDI */
export function getToothName(num: number): string {
  const lastDigit = num % 10;
  const quadrant = Math.floor(num / 10);

  // Tipo según último dígito (FDI universal)
  let type = '';
  if (lastDigit === 1) type = 'Incisivo central';
  else if (lastDigit === 2) type = 'Incisivo lateral';
  else if (lastDigit === 3) type = 'Canino';
  else if (lastDigit === 4) type = '1er premolar';
  else if (lastDigit === 5) type = '2do premolar';
  else if (lastDigit === 6) type = '1er molar';
  else if (lastDigit === 7) type = '2do molar';
  else if (lastDigit === 8) type = '3er molar (cordal)';

  // Cuadrante
  let quad = '';
  if (quadrant === 1) quad = 'superior derecho';
  else if (quadrant === 2) quad = 'superior izquierdo';
  else if (quadrant === 3) quad = 'inferior izquierdo';
  else if (quadrant === 4) quad = 'inferior derecho';
  else if (quadrant === 5) quad = 'temporal sup. derecho';
  else if (quadrant === 6) quad = 'temporal sup. izquierdo';
  else if (quadrant === 7) quad = 'temporal inf. izquierdo';
  else if (quadrant === 8) quad = 'temporal inf. derecho';

  return `${type} ${quad}`.trim();
}