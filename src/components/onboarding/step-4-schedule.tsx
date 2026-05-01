'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { saveOnboardingStep4 } from '@/server/actions/onboarding';
import type { ScheduleData } from '@/lib/types/onboarding';
import { DAY_LABELS } from '@/lib/types/onboarding';

type Props = {
  data: ScheduleData;
  onChange: (data: ScheduleData) => void;
  onNext: () => void;
  onBack: () => void;
};

export function Step4Schedule({ data, onChange, onNext, onBack }: Props) {
  const [isPending, startTransition] = useTransition();

  const toggleDay = (day: keyof ScheduleData['days']) => {
    onChange({ ...data, days: { ...data.days, [day]: !data.days[day] } });
  };

  const updateField = <K extends keyof ScheduleData>(key: K, value: ScheduleData[K]) => {
    onChange({ ...data, [key]: value });
  };

  // Plantillas rapidas
  const presetWeekday = () => {
    onChange({
      ...data,
      days: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
      start_time: '09:00',
      end_time: '18:00',
    });
  };
  const presetWeekendIncluded = () => {
    onChange({
      ...data,
      days: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false },
      start_time: '08:00',
      end_time: '18:00',
    });
  };

  const activeDaysCount = Object.values(data.days).filter(Boolean).length;
  const canSubmit = activeDaysCount > 0 && data.start_time < data.end_time;

  const handleNext = () => {
    if (activeDaysCount === 0) {
      toast.error('Selecciona al menos un dia de atencion');
      return;
    }
    if (data.start_time >= data.end_time) {
      toast.error('La hora de cierre debe ser despues de la apertura');
      return;
    }
    if (data.has_lunch_break && (data.lunch_start <= data.start_time || data.lunch_end >= data.end_time || data.lunch_start >= data.lunch_end)) {
      toast.error('Verifica los horarios del almuerzo');
      return;
    }

    startTransition(async () => {
      const res = await saveOnboardingStep4(data);
      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }
      onNext();
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
          <Clock className="h-6 w-6 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Horario de atencion</h2>
        <p className="text-sm text-slate-500 mt-1">
          Define los dias y horas en que tu clinica recibe pacientes
        </p>
      </div>

      {/* Plantillas rapidas */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={presetWeekday}
          className="text-[11px] rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:bg-slate-50"
        >
          L-V 9:00 a 18:00
        </button>
        <button
          type="button"
          onClick={presetWeekendIncluded}
          className="text-[11px] rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 hover:bg-slate-50"
        >
          L-S 8:00 a 18:00
        </button>
      </div>

      {/* Dias */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-700 mb-2">Dias de atencion</label>
        <div className="grid grid-cols-7 gap-1.5">
          {(Object.keys(DAY_LABELS) as Array<keyof typeof DAY_LABELS>).map((day) => {
            const isActive = data.days[day];
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={
                  'rounded-lg border-2 py-2 text-xs font-bold transition ' +
                  (isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300')
                }
              >
                {DAY_LABELS[day].substring(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Horario */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Apertura</label>
          <input
            type="time"
            value={data.start_time}
            onChange={(e) => updateField('start_time', e.target.value)}
            className="form-input"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Cierre</label>
          <input
            type="time"
            value={data.end_time}
            onChange={(e) => updateField('end_time', e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Almuerzo */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={data.has_lunch_break}
            onChange={(e) => updateField('has_lunch_break', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-bold text-slate-700">Tenemos hora de almuerzo</span>
        </label>
        {data.has_lunch_break && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Inicio</label>
              <input
                type="time"
                value={data.lunch_start}
                onChange={(e) => updateField('lunch_start', e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Fin</label>
              <input
                type="time"
                value={data.lunch_end}
                onChange={(e) => updateField('lunch_end', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Atras
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canSubmit || isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
        >
          {isPending ? 'Guardando...' : 'Siguiente'}
          {!isPending && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(209 213 219);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          background-color: white;
          outline: none;
        }
        :global(.form-input:focus) {
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 3px rgb(219 234 254);
        }
      `}</style>
    </div>
  );
}
