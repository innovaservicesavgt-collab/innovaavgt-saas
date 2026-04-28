'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Pill,
  Stethoscope,
  Calendar,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  ListChecks,
} from 'lucide-react';
import { createPrescription } from '@/server/actions/prescriptions';
import {
  FREQUENCY_OPTIONS,
  DURATION_OPTIONS,
  COMMON_DENTAL_MEDS,
  type Medication,
} from '@/lib/types/prescription';

type Professional = {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
};

type Props = {
  patientId: string;
  professionals: Professional[];
};

type EditableMed = Medication & { tempId: string };

export function PrescriptionForm({ patientId, professionals }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [professionalId, setProfessionalId] = useState<string>(
    professionals[0]?.id || ''
  );
  const [diagnosis, setDiagnosis] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [notes, setNotes] = useState('');

  const [meds, setMeds] = useState<EditableMed[]>([
    {
      tempId: Math.random().toString(36).slice(2),
      name: '',
      presentation: '',
      dose: '1 tableta',
      frequency: 'Cada 8 horas',
      duration: '7 dias',
      instructions: '',
    },
  ]);

  const addMed = () => {
    setMeds((prev) => [...prev, {
      tempId: Math.random().toString(36).slice(2),
      name: '',
      presentation: '',
      dose: '1 tableta',
      frequency: 'Cada 8 horas',
      duration: '7 dias',
      instructions: '',
    }]);
  };

  const removeMed = (tempId: string) => {
    setMeds((prev) => prev.filter((m) => m.tempId !== tempId));
  };

  const updateMed = (tempId: string, patch: Partial<Medication>) => {
    setMeds((prev) => prev.map((m) => m.tempId === tempId ? { ...m, ...patch } : m));
  };

  const useTemplate = (tempId: string, idx: number) => {
    const tmpl = COMMON_DENTAL_MEDS[idx];
    if (!tmpl) return;
    updateMed(tempId, { name: tmpl.name, presentation: tmpl.presentation });
  };

  const canSubmit =
    meds.length > 0 &&
    meds.every((m) => m.name.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Todos los medicamentos deben tener nombre');
      return;
    }

    startTransition(async () => {
      const cleanMeds: Medication[] = meds.map((m) => ({
        name: m.name,
        presentation: m.presentation,
        dose: m.dose,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
      }));

      const res = await createPrescription({
        patient_id: patientId,
        professional_id: professionalId || null,
        diagnosis: diagnosis || null,
        medications: cleanMeds,
        recommendations: recommendations || null,
        next_visit_date: nextVisitDate || null,
        notes: notes || null,
      });

      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }

      toast.success('Receta creada correctamente');
      router.push('/dental/prescriptions/' + res.id);
    });
  };

  return (
    <div className="space-y-4">
      <Section title="Datos generales" icon={<Stethoscope className="h-4 w-4 text-blue-600" />}>
        <Field label="Profesional">
          <select
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            className="form-input"
          >
            <option value="">Sin asignar</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title ? p.title + ' ' : ''}{p.first_name} {p.last_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Diagnostico">
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            rows={2}
            placeholder="Ej: Pulpitis irreversible diente 36, post extraccion molar..."
            className="form-input"
          />
        </Field>
      </Section>

      <Section
        title={'Medicamentos (' + meds.length + ')'}
        icon={<Pill className="h-4 w-4 text-violet-600" />}
        action={(
          <button
            type="button"
            onClick={addMed}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar
          </button>
        )}
      >
        <div className="space-y-3">
          {meds.map((m, idx) => (
            <MedRow
              key={m.tempId}
              med={m}
              index={idx}
              canRemove={meds.length > 1}
              onChange={(patch) => updateMed(m.tempId, patch)}
              onRemove={() => removeMed(m.tempId)}
              onUseTemplate={(tIdx) => useTemplate(m.tempId, tIdx)}
            />
          ))}
        </div>
      </Section>

      <Section title="Recomendaciones generales" icon={<ListChecks className="h-4 w-4 text-emerald-600" />}>
        <Field label="Indicaciones para el paciente">
          <textarea
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            rows={3}
            placeholder="Ej: Aplicar hielo en mejilla por 20 min cada 2 horas. No fumar. Dieta blanda 48 horas..."
            className="form-input"
          />
        </Field>
      </Section>

      <Section title="Proxima visita" icon={<Calendar className="h-4 w-4 text-amber-600" />}>
        <Field label="Fecha sugerida (opcional)">
          <input
            type="date"
            value={nextVisitDate}
            onChange={(e) => setNextVisitDate(e.target.value)}
            className="form-input"
          />
        </Field>
        <Field label="Notas internas (no se imprimen)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Recordatorios para el equipo..."
            className="form-input"
          />
        </Field>
      </Section>

      {!canSubmit && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          Todos los medicamentos deben tener nombre
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !canSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50 shadow-sm"
        >
          <Save className="h-4 w-4" />
          {isPending ? 'Guardando...' : 'Crear receta'}
        </button>
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background-color: white;
          outline: none;
        }
        :global(.form-input:focus) {
          border-color: rgb(139 92 246);
          box-shadow: 0 0 0 4px rgb(237 233 254);
        }
      `}</style>
    </div>
  );
}

function MedRow({ med, index, canRemove, onChange, onRemove, onUseTemplate }: {
  med: EditableMed; index: number; canRemove: boolean;
  onChange: (patch: Partial<Medication>) => void;
  onRemove: () => void;
  onUseTemplate: (idx: number) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 space-y-2">
          <Field label="Medicamento *">
            <input
              type="text"
              value={med.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="Nombre del medicamento"
              className="form-input font-semibold"
            />
          </Field>
          {/* Plantillas rapidas */}
          <div className="flex flex-wrap gap-1">
            {COMMON_DENTAL_MEDS.slice(0, 6).map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onUseTemplate(idx)}
                className="text-[10px] rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-violet-700 hover:bg-violet-100"
              >
                {m.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Presentacion">
              <input
                type="text"
                value={med.presentation}
                onChange={(e) => onChange({ presentation: e.target.value })}
                placeholder="500 mg capsulas"
                className="form-input"
              />
            </Field>
            <Field label="Dosis">
              <input
                type="text"
                value={med.dose}
                onChange={(e) => onChange({ dose: e.target.value })}
                placeholder="1 tableta"
                className="form-input"
              />
            </Field>
            <Field label="Frecuencia">
              <select
                value={med.frequency}
                onChange={(e) => onChange({ frequency: e.target.value })}
                className="form-input"
              >
                {FREQUENCY_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <Field label="Duracion">
              <select
                value={med.duration}
                onChange={(e) => onChange({ duration: e.target.value })}
                className="form-input"
              >
                {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Instrucciones especiales">
            <input
              type="text"
              value={med.instructions}
              onChange={(e) => onChange({ instructions: e.target.value })}
              placeholder="Tomar con comida, evitar alcohol..."
              className="form-input"
            />
          </Field>
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        {action}
      </div>
      <div className="px-5 py-4 space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
