'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Heart,
  Pill,
  Scissors,
  AlertTriangle,
  Activity,
  Stethoscope,
  Cigarette,
  Wine,
  Brain,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  ClipboardList,
  CheckCircle2,
  Calendar,
  User,
} from 'lucide-react';
import {
  updateMedicalHistory,
  addEvolutionNote,
  deleteEvolutionNote,
} from '@/server/actions/medical-history';
import type {
  MedicalHistoryData,
  EvolutionNote,
} from '@/lib/types/medical-history';
import { OdontogramClient } from '@/components/odontogram/odontogram-client';
import type { OdontogramData } from '@/lib/types/odontogram';

type Props = {
  patientId: string;
  metadata: MedicalHistoryData | null;
  patientAllergiesText: string | null;
  patientBloodType: string | null;
  patientBirthDate: string | null;
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-GT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ynLabel(v: boolean | null | undefined): string {
  if (v === true) return 'Si';
  if (v === false) return 'No';
  return 'Sin registrar';
}

function alcoholLabel(v: string | null | undefined): string {
  if (v === 'no') return 'No consume';
  if (v === 'ocasional') return 'Ocasional';
  if (v === 'frecuente') return 'Frecuente';
  return 'Sin registrar';
}

export function MedicalTab({
  patientId,
  metadata,
  patientAllergiesText,
  patientBloodType,
  patientBirthDate,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  const med = metadata?.medical_history || {};
  const dental = metadata?.dental_history || {};
  const habits = metadata?.habits || {};
  const notes = metadata?.evolution_notes || [];

  const odontogramData: OdontogramData =
    ((metadata as unknown as { odontogram?: OdontogramData })?.odontogram) || { teeth: {} };

  const [diseases, setDiseases] = useState(med.diseases || '');
  const [surgeries, setSurgeries] = useState(med.surgeries || '');
  const [medications, setMedications] = useState(med.current_medications || '');
  const [bloodPressure, setBloodPressure] = useState(med.blood_pressure || '');
  const [isPregnant, setIsPregnant] = useState<boolean | null>(med.is_pregnant ?? null);
  const [otherMed, setOtherMed] = useState(med.other || '');

  const [previousTreatments, setPreviousTreatments] = useState(dental.previous_treatments || '');
  const [complications, setComplications] = useState(dental.complications || '');
  const [lastVisitElsewhere, setLastVisitElsewhere] = useState(dental.last_visit_elsewhere || '');

  const [smoker, setSmoker] = useState<boolean | null>(habits.smoker ?? null);
  const [alcohol, setAlcohol] = useState<string>(habits.alcohol || '');
  const [bruxism, setBruxism] = useState<boolean | null>(habits.bruxism ?? null);
  const [otherHabit, setOtherHabit] = useState(habits.other || '');

  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateMedicalHistory({
        patient_id: patientId,
        data: {
          medical_history: {
            diseases: diseases.trim() || null,
            surgeries: surgeries.trim() || null,
            current_medications: medications.trim() || null,
            blood_pressure: bloodPressure.trim() || null,
            is_pregnant: isPregnant,
            other: otherMed.trim() || null,
          },
          dental_history: {
            last_visit_elsewhere: lastVisitElsewhere.trim() || null,
            previous_treatments: previousTreatments.trim() || null,
            complications: complications.trim() || null,
          },
          habits: {
            smoker,
            alcohol: (alcohol as 'no' | 'ocasional' | 'frecuente') || null,
            bruxism,
            other: otherHabit.trim() || null,
          },
        },
      });

      if (!res.ok) {
        toast.error(res.error || 'Error al guardar');
        return;
      }

      toast.success('Expediente actualizado');
      setEditing(false);
      router.refresh();
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('La nota no puede estar vacia');
      return;
    }
    startTransition(async () => {
      const res = await addEvolutionNote({
        patient_id: patientId,
        content: newNote.trim(),
      });
      if (!res.ok) {
        toast.error(res.error || 'Error al agregar nota');
        return;
      }
      toast.success('Nota agregada');
      setNewNote('');
      setAddingNote(false);
      router.refresh();
    });
  };

  const handleDeleteNote = (noteId: string) => {
    if (!confirm('Eliminar esta nota? Esta accion no se puede deshacer.')) return;
    startTransition(async () => {
      const res = await deleteEvolutionNote({
        patient_id: patientId,
        note_id: noteId,
      });
      if (!res.ok) {
        toast.error(res.error || 'Error al eliminar');
        return;
      }
      toast.success('Nota eliminada');
      router.refresh();
    });
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-900">Editando expediente clinico</h3>
            </div>
            <button type="button" onClick={() => setEditing(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white" disabled={isPending}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FormSection title="Antecedentes medicos" icon={<Heart className="h-4 w-4 text-rose-600" />}>
              <FormField label="Enfermedades cronicas / sistemicas">
                <textarea value={diseases} onChange={(e) => setDiseases(e.target.value)} placeholder="Ej: Hipertension, diabetes, asma..." rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </FormField>
              <FormField label="Cirugias previas">
                <textarea value={surgeries} onChange={(e) => setSurgeries(e.target.value)} placeholder="Ej: Apendicectomia 2019..." rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </FormField>
              <FormField label="Medicamentos actuales">
                <textarea value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="Ej: Losartan 50mg/dia..." rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </FormField>
              <FormField label="Presion arterial habitual">
                <input type="text" value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} placeholder="120/80" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </FormField>
              <FormField label="Embarazo">
                <YesNoSelect value={isPregnant} onChange={setIsPregnant} />
              </FormField>
              <FormField label="Otros antecedentes">
                <textarea value={otherMed} onChange={(e) => setOtherMed(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </FormField>
            </FormSection>

            <FormSection title="Antecedentes odontologicos" icon={<Stethoscope className="h-4 w-4 text-blue-600" />}>
              <FormField label="Ultima visita al odontologo">
                <input type="date" value={lastVisitElsewhere} onChange={(e) => setLastVisitElsewhere(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </FormField>
              <FormField label="Tratamientos previos">
                <textarea value={previousTreatments} onChange={(e) => setPreviousTreatments(e.target.value)} placeholder="Ej: Coronas, ortodoncia..." rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </FormField>
              <FormField label="Complicaciones previas">
                <textarea value={complications} onChange={(e) => setComplications(e.target.value)} placeholder="Ej: Reaccion a anestesia local..." rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </FormField>
            </FormSection>

            <FormSection title="Habitos" icon={<Activity className="h-4 w-4 text-amber-600" />}>
              <FormField label="Fumador?">
                <YesNoSelect value={smoker} onChange={setSmoker} />
              </FormField>
              <FormField label="Consumo de alcohol">
                <select value={alcohol} onChange={(e) => setAlcohol(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
                  <option value="">Sin registrar</option>
                  <option value="no">No consume</option>
                  <option value="ocasional">Ocasional</option>
                  <option value="frecuente">Frecuente</option>
                </select>
              </FormField>
              <FormField label="Bruxismo?">
                <YesNoSelect value={bruxism} onChange={setBruxism} />
              </FormField>
              <FormField label="Otros habitos relevantes">
                <textarea value={otherHabit} onChange={(e) => setOtherHabit(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              </FormField>
            </FormSection>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setEditing(false)} disabled={isPending} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              <Save className="h-4 w-4" />
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasMedicalData =
    med.diseases || med.surgeries || med.current_medications || med.blood_pressure ||
    med.is_pregnant != null || med.other || patientAllergiesText || patientBloodType;

  const hasDentalData = dental.previous_treatments || dental.complications || dental.last_visit_elsewhere;
  const hasHabits = habits.smoker != null || habits.alcohol || habits.bruxism != null || habits.other;
  const hasAnyData = hasMedicalData || hasDentalData || hasHabits;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">Expediente clinico</h2>
        <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
          <Edit className="h-4 w-4" />
          {hasAnyData ? 'Editar' : 'Crear expediente'}
        </button>
      </div>

      {!hasAnyData ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-base font-bold text-slate-900">Sin expediente clinico</p>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Registra antecedentes medicos, odontologicos y habitos del paciente.
          </p>
          <button type="button" onClick={() => setEditing(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            Crear expediente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(hasMedicalData || patientAllergiesText || patientBloodType) && (
            <ReadSection title="Antecedentes medicos" icon={<Heart className="h-4 w-4 text-rose-600" />}>
              {patientBloodType && <ReadRow icon={<Activity className="h-3.5 w-3.5" />} label="Tipo de sangre" value={patientBloodType} />}
              {patientAllergiesText && <ReadRow icon={<AlertTriangle className="h-3.5 w-3.5 text-amber-500" />} label="Alergias" value={patientAllergiesText} highlight="amber" />}
              <ReadRow icon={<Pill className="h-3.5 w-3.5" />} label="Enfermedades" value={med.diseases || null} />
              <ReadRow icon={<Scissors className="h-3.5 w-3.5" />} label="Cirugias" value={med.surgeries || null} />
              <ReadRow icon={<Pill className="h-3.5 w-3.5" />} label="Medicamentos actuales" value={med.current_medications || null} />
              <ReadRow icon={<Heart className="h-3.5 w-3.5" />} label="Presion arterial" value={med.blood_pressure || null} />
              {med.is_pregnant != null && <ReadRow icon={<Heart className="h-3.5 w-3.5" />} label="Embarazo" value={ynLabel(med.is_pregnant)} />}
              <ReadRow icon={<ClipboardList className="h-3.5 w-3.5" />} label="Otros" value={med.other || null} />
            </ReadSection>
          )}

          {hasDentalData && (
            <ReadSection title="Antecedentes odontologicos" icon={<Stethoscope className="h-4 w-4 text-blue-600" />}>
              <ReadRow icon={<Calendar className="h-3.5 w-3.5" />} label="Ultima visita externa" value={dental.last_visit_elsewhere || null} />
              <ReadRow icon={<ClipboardList className="h-3.5 w-3.5" />} label="Tratamientos previos" value={dental.previous_treatments || null} />
              <ReadRow icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Complicaciones" value={dental.complications || null} />
            </ReadSection>
          )}

          {hasHabits && (
            <ReadSection title="Habitos" icon={<Activity className="h-4 w-4 text-amber-600" />}>
              {habits.smoker != null && <ReadRow icon={<Cigarette className="h-3.5 w-3.5" />} label="Fumador" value={ynLabel(habits.smoker)} />}
              {habits.alcohol && <ReadRow icon={<Wine className="h-3.5 w-3.5" />} label="Alcohol" value={alcoholLabel(habits.alcohol)} />}
              {habits.bruxism != null && <ReadRow icon={<Brain className="h-3.5 w-3.5" />} label="Bruxismo" value={ynLabel(habits.bruxism)} />}
              <ReadRow icon={<Activity className="h-3.5 w-3.5" />} label="Otros" value={habits.other || null} />
            </ReadSection>
          )}
        </div>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-violet-600" />
            <h3 className="text-sm font-bold text-slate-900">Notas evolutivas ({notes.length})</h3>
          </div>
          {!addingNote && (
            <button type="button" onClick={() => setAddingNote(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
              <Plus className="h-3.5 w-3.5" />
              Nueva nota
            </button>
          )}
        </div>

        <div className="px-5 py-4">
          {addingNote && (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Ej: Paciente refiere dolor en pieza 36..." rows={3} autoFocus className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => { setAddingNote(false); setNewNote(''); }} disabled={isPending} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white">
                  Cancelar
                </button>
                <button type="button" onClick={handleAddNote} disabled={isPending || !newNote.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isPending ? 'Guardando...' : 'Guardar nota'}
                </button>
              </div>
            </div>
          )}

          {notes.length === 0 ? (
            <div className="py-8 text-center">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">Sin notas evolutivas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note: EvolutionNote) => (
                <div key={note.id} className="rounded-xl border border-slate-200 bg-white p-3 hover:border-slate-300 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="font-semibold text-slate-700">{formatDateTime(note.date)}</span>
                      <span className="text-slate-300">.</span>
                      <User className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-500">{note.author}</span>
                    </div>
                    <button type="button" onClick={() => handleDeleteNote(note.id)} disabled={isPending} className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-30" aria-label="Eliminar nota">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <OdontogramClient
        patientId={patientId}
        patientBirthDate={patientBirthDate}
        data={odontogramData}
      />
    </div>
  );
}

function FormSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
        {icon}
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode; }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function YesNoSelect({ value, onChange }: { value: boolean | null; onChange: (v: boolean | null) => void; }) {
  const stringValue = value === true ? 'yes' : value === false ? 'no' : '';
  return (
    <select value={stringValue} onChange={(e) => { const v = e.target.value; if (v === 'yes') onChange(true); else if (v === 'no') onChange(false); else onChange(null); }} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">
      <option value="">Sin registrar</option>
      <option value="yes">Si</option>
      <option value="no">No</option>
    </select>
  );
}

function ReadSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100">
        {icon}
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      </div>
      <div className="px-5 py-2">{children}</div>
    </section>
  );
}

function ReadRow({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string | null; highlight?: 'amber'; }) {
  if (!value) return null;
  const valueCls = highlight === 'amber' ? 'text-amber-900 bg-amber-50 px-2 py-1 rounded-md font-medium' : 'text-slate-900 font-medium';
  return (
    <div className="flex items-start gap-2 py-2 border-b border-slate-50 last:border-b-0">
      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500">{label}</div>
        <div className={'text-sm mt-0.5 ' + valueCls}>{value}</div>
      </div>
    </div>
  );
}
