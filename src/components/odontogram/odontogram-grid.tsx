'use client';

import { ToothSvg } from './tooth-svg';
import { getTeethNumbers } from '@/lib/types/odontogram';
import type { OdontogramData } from '@/lib/types/odontogram';

type Props = {
  view: 'adult' | 'child' | 'mixed';
  data: OdontogramData;
  onToothClick: (number: number) => void;
};

export function OdontogramGrid({ view, data, onToothClick }: Props) {
  const teeth = getTeethNumbers(view);

  return (
    <div className="space-y-4">
      {/* MAXILAR SUPERIOR */}
      <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Maxilar superior
          </span>
          <div className="flex items-center gap-3 text-[9px] text-slate-400">
            <span>← Derecho</span>
            <span>Izquierdo →</span>
          </div>
        </div>

        <div className="flex items-end justify-center gap-1 sm:gap-2 overflow-x-auto pb-1">
          {/* Cuadrante 1 (1x = sup. derecho) — visualmente a la izquierda */}
          <div className="flex items-end gap-1 sm:gap-1.5">
            {teeth.upperRight.map((num) => (
              <ToothSvg
                key={num}
                number={num}
                data={data.teeth[String(num)]}
                onClick={() => onToothClick(num)}
              />
            ))}
          </div>

          {/* Línea media superior */}
          <div className="self-stretch w-px bg-slate-300 mx-1" />

          {/* Cuadrante 2 (2x = sup. izquierdo) */}
          <div className="flex items-end gap-1 sm:gap-1.5">
            {teeth.upperLeft.map((num) => (
              <ToothSvg
                key={num}
                number={num}
                data={data.teeth[String(num)]}
                onClick={() => onToothClick(num)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* MAXILAR INFERIOR */}
      <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Maxilar inferior
          </span>
          <div className="flex items-center gap-3 text-[9px] text-slate-400">
            <span>← Derecho</span>
            <span>Izquierdo →</span>
          </div>
        </div>

        <div className="flex items-start justify-center gap-1 sm:gap-2 overflow-x-auto pb-1">
          {/* Cuadrante 4 (4x = inf. derecho) — visualmente a la izquierda */}
          <div className="flex items-start gap-1 sm:gap-1.5">
            {teeth.lowerRight.map((num) => (
              <ToothSvg
                key={num}
                number={num}
                data={data.teeth[String(num)]}
                onClick={() => onToothClick(num)}
              />
            ))}
          </div>

          {/* Línea media inferior */}
          <div className="self-stretch w-px bg-slate-300 mx-1" />

          {/* Cuadrante 3 (3x = inf. izquierdo) */}
          <div className="flex items-start gap-1 sm:gap-1.5">
            {teeth.lowerLeft.map((num) => (
              <ToothSvg
                key={num}
                number={num}
                data={data.teeth[String(num)]}
                onClick={() => onToothClick(num)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}