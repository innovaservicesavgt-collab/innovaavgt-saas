'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ClipboardSignature,
  Stethoscope,
  AlertTriangle,
  Save,
  Info,
} from 'lucide-react';
import { createConsent } from '@/server/actions/consents';
import {
  CONSENT_TEMPLATES,
  LEGAL_TEXT_BASE,
  getTemplateByKey,
} from '@/lib/types/consent';

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

export function ConsentForm({ patientId, professionals }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [templateKey, setTemplateKey] = useState('endodoncia');
  const [professionalId, setProfessionalId] = useState<string>(professionals[0]?.id || '');
  const [treatmentType, setTreatmentType] = useState('Endodoncia (tratamiento de conducto)');
  const [description, setDescription] = useState('');
  const [risks, setRisks] = useState('');
  const [alternatives, setAlternatives] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [legalText, setLegalText] = useState(LEGAL_TEXT_BASE);
  const [notes, setNotes] = useState('');

  // Cargar plantilla al cambiar tipo
  const loadTemplate = (key: string) => {
    setTemplateKey(key);
    const tmpl = getTemplateByKey(key);
    setTreatmentType(tmpl.label);
    setDescription(tmpl.description);
    setRisks(tmpl.risks);
    setAlternatives(tmpl.alternatives);
  };

  const canSubmit =
    treatmentType.trim().length > 0 &&
    description.trim().length >= 10 &&
    legalText.trim().length >= 50;

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    startTransition(async () => {
      const res = await createConsent({
        patient_id: patientId,
        professional_id: professionalId || null,
        treatment_type: treatmentType,
        treatment_description: description,
        risks: risks || null,
        alternatives: alternatives || null,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
        estimated_duration: estimatedDuration || null,
        legal_text: legalText,
        notes: notes || null,
      });

      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }

      toast.success('Consentimiento creado');
      router.push('/dental/consents/' + res.id);
    });
  };

  return (
    <div className="space-y-4">
      <Section title="Plantilla" icon={<ClipboardSignature className="h-4 w-4 text-emerald-600" />}>
        <Field label="Tipo de tratamiento">
          <select
            value={templateKey}
            onChange={(e) => loadTemplate(e.target.value)}
            className="form-input"
          >
            {CONSENT_TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Al cambiar de plantilla se cargara descripcion y riesgos. Puedes editarlos.
          </p>
        </Field>

        <Field label="Profesional responsable">
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
      </Section>

      <Section title="Descripcion del tratamiento" icon={<Stethoscope className="h-4 w-4 text-blue-600" />}>
        <Field label="Nombre del tratamiento *">
          <input
            type="text"
            value={treatmentType}
            onChange={(e) => setTreatmentType(e.target.value)}
            className="form-input font-semibold"
          />
        </Field>
        <Field label="Descripcion completa *">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="form-input text-sm"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Costo estimado (opcional)">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">Q</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0"
                className="form-input pl-7"
              />
            </div>
          </Field>
          <Field label="Duracion estimada (opcional)">
            <input
              type="text"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              placeholder="Ej: 4 sesiones de 1 hora"
              className="form-input"
            />
          </Field>
        </div>
      </Section>

      <Section title="Riesgos y complicaciones" icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}>
        <Field label="Riesgos del procedimiento">
          <textarea
            value={risks}
            onChange={(e) => setRisks(e.target.value)}
            rows={6}
            className="form-input text-sm"
          />
        </Field>
        <Field label="Alternativas de tratamiento">
          <textarea
            value={alternatives}
            onChange={(e) => setAlternatives(e.target.value)}
            rows={3}
            className="form-input text-sm"
          />
        </Field>
      </Section>

      <Section title="Texto legal" icon={<Info className="h-4 w-4 text-slate-600" />}>
        <p className="text-[11px] text-slate-500">
          Texto legal que el paciente acepta al firmar. Puedes editarlo si necesitas adaptarlo.
        </p>
        <textarea
          value={legalText}
          onChange={(e) => setLegalText(e.target.value)}
          rows={10}
          className="form-input text-xs font-mono"
        />
      </Section>

      <Section title="Notas internas" icon={<Info className="h-4 w-4 text-slate-600" />}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Observaciones para el equipo (no se imprimen)"
          className="form-input"
        />
      </Section>

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
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
        >
          <Save className="h-4 w-4" />
          {isPending ? 'Guardando...' : 'Crear consentimiento'}
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
          border-color: rgb(16 185 129);
          box-shadow: 0 0 0 4px rgb(209 250 229);
        }
      `}</style>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
        {icon}
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
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
