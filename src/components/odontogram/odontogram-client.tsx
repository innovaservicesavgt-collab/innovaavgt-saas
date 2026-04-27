'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Stethoscope,
  Trash2,
  RotateCcw,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  TOOTH_STATUS_CONFIG,
  FACE_TREATMENT_CONFIG,
} from '@/lib/odontogram-config';
import {
  resolveViewMode,
  getDentitionByAge,
  type OdontogramData,
  type ToothStatus,
  type FaceTreatment,
} from '@/lib/types/odontogram';
import { OdontogramGrid } from './odontogram-grid';
import { ToothDetailModal } from './tooth-detail-modal';
import {
  setOdontogramViewMode,
  resetOdontogram,
} from '@/server/actions/odontogram';

type Props = {
  patientId: string;
  patientBirthDate: string | null;
  data: OdontogramData;
};

type ViewMode = 'auto' | 'adult' | 'child' | 'mixed';

export function OdontogramClient({ patientId, patientBirthDate, data }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  const selectedMode: ViewMode = data.view_mode || 'auto';
  const effectiveView = resolveViewMode(selectedMode, patientBirthDate);
  const autoSuggestion = getDentitionByAge(patientBirthDate);

  const teethCount = Object.keys(data.teeth || {}).length;

  const handleViewModeChange = (mode: ViewMode) => {
    startTransition(async () => {
      const res = await setOdontogramViewMode({
        patient_id: patientId,
        view_mode: mode,
      });
      if (!res.ok) {
        toast.error(res.error || 'Error al cambiar vista');
        return;
      }
      toast.success('Vista actualizada');
      router.refresh();
    });
  };

  const handleReset = () => {
    if (
      !confirm(
        '¿Resetear todo el odontograma? Esta accion borra todas las marcas y no se puede deshacer.'
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await resetOdontogram({ patient_id: patientId });
      if (!res.ok) {
        toast.error(res.error || 'Error al resetear');
        return;
      }
      toast.success('Odontograma reseteado');
      router.refresh();
    });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Odontograma
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {teethCount === 0
                ? 'Click en cada pieza para registrar tratamientos'
                : `${teethCount} piezas con registro`}
            </p>
          </div>

          {/* Selector de vista */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-600">Vista:</span>
            <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
              <ViewButton
                active={selectedMode === 'auto'}
                onClick={() => handleViewModeChange('auto')}
                disabled={isPending}
                label="Auto"
                hint={`(${autoSuggestion === 'adult' ? 'Adulto' : autoSuggestion === 'child' ? 'Infantil' : 'Mixta'})`}
              />
              <ViewButton
                active={selectedMode === 'adult'}
                onClick={() => handleViewModeChange('adult')}
                disabled={isPending}
                label="Adulto"
              />
              <ViewButton
                active={selectedMode === 'child'}
                onClick={() => handleViewModeChange('child')}
                disabled={isPending}
                label="Infantil"
              />
              <ViewButton
                active={selectedMode === 'mixed'}
                onClick={() => handleViewModeChange('mixed')}
                disabled={isPending}
                label="Mixta"
              />
            </div>
          </div>
        </div>

        {/* Banner edad */}
        {patientBirthDate && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>
              Segun la edad del paciente, se sugiere denticion{' '}
              <strong className="font-bold">
                {autoSuggestion === 'adult'
                  ? 'permanente (adulto)'
                  : autoSuggestion === 'child'
                  ? 'temporal (infantil)'
                  : 'mixta (transicion)'}
              </strong>
              .
            </span>
          </div>
        )}
      </div>

      {/* Grid del odontograma */}
      <div className={`p-3 sm:p-5 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
        <OdontogramGrid
          view={effectiveView}
          data={data}
          onToothClick={(num) => setSelectedTooth(num)}
        />
      </div>

      {/* Leyenda colapsable */}
      <div className="border-t border-slate-100 px-5 py-3">
        <button
          type="button"
          onClick={() => setShowLegend(!showLegend)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${showLegend ? 'rotate-180' : ''}`}
          />
          Leyenda de colores
        </button>

        {showLegend && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Estados de pieza
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(TOOTH_STATUS_CONFIG) as ToothStatus[]).map((s) => {
                  const cfg = TOOTH_STATUS_CONFIG[s];
                  return (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span
                        className="block h-3 w-3 rounded border border-slate-300 shrink-0"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-slate-700 truncate">{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Tratamientos por cara
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(FACE_TREATMENT_CONFIG) as FaceTreatment[]).map(
                  (t) => {
                    const cfg = FACE_TREATMENT_CONFIG[t];
                    return (
                      <div key={t} className="flex items-center gap-2 text-xs">
                        <span
                          className="block h-3 w-3 rounded shrink-0"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span className="text-slate-700 truncate">{cfg.label}</span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con acciones */}
      {teethCount > 0 && (
        <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Resetear odontograma
          </button>
        </div>
      )}

      {/* Modal de pieza */}
      {selectedTooth !== null && (
        <ToothDetailModal
          patientId={patientId}
          toothNumber={selectedTooth}
          initial={data.teeth[String(selectedTooth)] || null}
          onClose={() => setSelectedTooth(null)}
        />
      )}
    </section>
  );
}

function ViewButton({
  active,
  onClick,
  disabled,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
        active
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {label}
      {hint && (
        <span
          className={`text-[10px] font-normal ${active ? 'text-emerald-100' : 'text-slate-400'}`}
        >
          {hint}
        </span>
      )}
    </button>
  );
}