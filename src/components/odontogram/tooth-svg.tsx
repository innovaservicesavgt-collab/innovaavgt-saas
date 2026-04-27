'use client';

import {
  TOOTH_STATUS_CONFIG,
  FACE_TREATMENT_CONFIG,
} from '@/lib/odontogram-config';
import type { ToothData, ToothFace } from '@/lib/types/odontogram';

type Props = {
  number: number;
  data?: ToothData;
  onClick?: () => void;
  size?: number;
};

/**
 * Render visual de UNA pieza dental.
 * - Caras dibujadas como un cuadrado dividido en 5 zonas (centro = oclusal/incisal)
 * - Vista en planta superior, vista clinica estandar
 *
 *      ┌─────────────────┐
 *      │   VESTIBULAR    │
 *      ├──┬───────────┬──┤
 *      │ M│  OCLUSAL  │D │
 *      │  │           │  │
 *      ├──┴───────────┴──┤
 *      │    LINGUAL      │
 *      └─────────────────┘
 *
 * En el grid superior la cara VESTIBULAR está abajo (queda hacia el labio).
 * En el grid inferior, la VESTIBULAR está arriba.
 * Esa rotacion la hace el grid contenedor con CSS rotate.
 */
export function ToothSvg({ number, data, onClick, size = 56 }: Props) {
  const status = data?.status || 'present';
  const faces = data?.faces || {};

  const isMissing = status === 'missing' || status === 'unerupted';
  const statusBg = TOOTH_STATUS_CONFIG[status]?.color || '#ffffff';

  const getFaceColor = (face: ToothFace): string => {
    const tx = faces[face];
    if (!tx) return statusBg;
    return FACE_TREATMENT_CONFIG[tx]?.color || statusBg;
  };

  // Tamaños internos
  const margin = 2;
  const w = size;
  const h = size;
  const innerSize = size * 0.5;
  const innerOffset = (size - innerSize) / 2;

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Pieza ${number}`}
      className="group relative flex flex-col items-center gap-0.5 focus:outline-none"
    >
      {/* Numero de pieza */}
      <span className="text-[10px] font-bold text-slate-600 tabular-nums">
        {number}
      </span>

      {/* SVG */}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className={`rounded-md border-2 transition-all ${
          isMissing
            ? 'border-slate-400 opacity-50 bg-slate-100'
            : 'border-slate-300 bg-white group-hover:border-emerald-500 group-hover:shadow-md'
        }`}
      >
        {!isMissing && (
          <>
            {/* Cara vestibular (arriba en SVG, será reorientada por el grid) */}
            <polygon
              points={`${margin},${margin} ${w - margin},${margin} ${innerOffset + innerSize},${innerOffset} ${innerOffset},${innerOffset}`}
              fill={getFaceColor('vestibular')}
              stroke="#94a3b8"
              strokeWidth="0.5"
            />
            {/* Cara distal (derecha) */}
            <polygon
              points={`${w - margin},${margin} ${w - margin},${h - margin} ${innerOffset + innerSize},${innerOffset + innerSize} ${innerOffset + innerSize},${innerOffset}`}
              fill={getFaceColor('distal')}
              stroke="#94a3b8"
              strokeWidth="0.5"
            />
            {/* Cara lingual/palatino (abajo) */}
            <polygon
              points={`${w - margin},${h - margin} ${margin},${h - margin} ${innerOffset},${innerOffset + innerSize} ${innerOffset + innerSize},${innerOffset + innerSize}`}
              fill={getFaceColor('lingual')}
              stroke="#94a3b8"
              strokeWidth="0.5"
            />
            {/* Cara mesial (izquierda) */}
            <polygon
              points={`${margin},${margin} ${innerOffset},${innerOffset} ${innerOffset},${innerOffset + innerSize} ${margin},${h - margin}`}
              fill={getFaceColor('mesial')}
              stroke="#94a3b8"
              strokeWidth="0.5"
            />
            {/* Cara oclusal/incisal (centro) */}
            <rect
              x={innerOffset}
              y={innerOffset}
              width={innerSize}
              height={innerSize}
              fill={getFaceColor('oclusal')}
              stroke="#94a3b8"
              strokeWidth="0.5"
            />
          </>
        )}

        {/* Si está ausente, una X */}
        {isMissing && (
          <>
            <line
              x1={margin + 4}
              y1={margin + 4}
              x2={w - margin - 4}
              y2={h - margin - 4}
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1={w - margin - 4}
              y1={margin + 4}
              x2={margin + 4}
              y2={h - margin - 4}
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>

      {/* Indicador de notas */}
      {data?.notes && (
        <span
          className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-white"
          title="Tiene notas"
        />
      )}
    </button>
  );
}