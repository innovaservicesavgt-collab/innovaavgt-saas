'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X, Save, Trash2, Info } from 'lucide-react';
import { updateTooth } from '@/server/actions/odontogram';
import {
  TOOTH_STATUS_CONFIG,
  FACE_TREATMENT_CONFIG,
} from '@/lib/odontogram-config';
import {
  TOOTH_FACES,
  getToothName,
  isAnteriorTooth,
  type ToothData,
  type ToothStatus,
  type ToothFace,
  type FaceTreatment,
} from '@/lib/types/odontogram';

type Props = {
  patientId: string;
  toothNumber: number;
  initial: ToothData | null;
  onClose: () => void;
};

const FACE_LABELS: Record<ToothFace, string> = {
  vestibular: 'Vestibular (cara externa)',
  lingual: 'Lingual / Palatino (interna)',
  mesial: 'Mesial (hacia el centro)',
  distal: 'Distal (alejada del centro)',
  oclusal: 'Oclusal / Incisal (masticatoria)',
};

function getFaceLabel(face: ToothFace, isAnterior: boolean): string {
  if (face === 'oclusal' && isAnterior) {
    return 'Incisal (cara cortante)';
  }
  return FACE_LABELS[face];
}

export function ToothDetailModal({
  patientId,
  toothNumber,
  initial,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState<ToothStatus>(initial?.status || 'present');
  const [faces, setFaces] = useState<Partial<Record<ToothFace, FaceTreatment>>>(
    initial?.faces || {}
  );
  const [notes, setNotes] = useState<string>(initial?.notes || '');

  const isAnterior = isAnteriorTooth(toothNumber);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateTooth({
        patient_id: patientId,
        tooth: {
          number: toothNumber,
          status,
          faces: faces as Record<string, FaceTreatment>,
          notes: notes.trim() || null,
        },
      });

      if (!res.ok) {
        toast.error(res.error || 'Error al guardar');
        return;
      }

      toast.success(`Pieza ${toothNumber} actualizada`);
      router.refresh();
      onClose();
    });
  };

  const handleClearFace = (face: ToothFace) => {
    setFaces((prev) => {
      const next = { ...prev };
      delete next[face];
      return next;
    });
  };

  const handleSetFace = (face: ToothFace, treatment: FaceTreatment) => {
    setFaces((prev) => ({ ...prev, [face]: treatment }));
  };

  // Si la pieza está marcada como missing/unerupted, ocultamos las caras
  const showFaces = !['missing', 'unerupted'].includes(status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900">
              Pieza {toothNumber}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {getToothName(toothNumber)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Estado de la pieza */}
          <section>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              Estado de la pieza
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(TOOTH_STATUS_CONFIG) as ToothStatus[]).map((s) => {
                const cfg = TOOTH_STATUS_CONFIG[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    title={cfg.description}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs font-medium transition ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="block h-4 w-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <span
                      className={
                        active ? 'text-emerald-700 font-semibold' : 'text-slate-700'
                      }
                    >
                      {cfg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Caras */}
          {showFaces && (
            <section>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                Tratamientos por cara
              </label>
              <div className="space-y-2">
                {TOOTH_FACES.map((face) => {
                  const current = faces[face];
                  return (
                    <div
                      key={face}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5"
                    >
                      <div className="flex-shrink-0 w-32 sm:w-40 text-xs font-medium text-slate-700">
                        {getFaceLabel(face, isAnterior)}
                      </div>
                      <select
                        value={current || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (!v) handleClearFace(face);
                          else handleSetFace(face, v as FaceTreatment);
                        }}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="">Sin tratamiento</option>
                        {(Object.keys(FACE_TREATMENT_CONFIG) as FaceTreatment[]).map(
                          (t) => (
                            <option key={t} value={t}>
                              {FACE_TREATMENT_CONFIG[t].label}
                            </option>
                          )
                        )}
                      </select>
                      {current && (
                        <span
                          className="block h-3 w-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: FACE_TREATMENT_CONFIG[current].color,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Notas */}
          <section>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
              Notas clinicas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Ej: Caries profunda en cara oclusal, requiere endodoncia..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </section>

          {/* Auditoría */}
          {initial?.updated_at && initial?.updated_by && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 flex items-center gap-2">
              <Info className="h-3 w-3" />
              Última actualización: {new Date(initial.updated_at).toLocaleString('es-GT')} por {initial.updated_by}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isPending ? 'Guardando...' : 'Guardar pieza'}
          </button>
        </div>
      </div>
    </div>
  );
}