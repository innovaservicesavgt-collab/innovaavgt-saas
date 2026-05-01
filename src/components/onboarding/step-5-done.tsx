'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Building2,
  User,
  Briefcase,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { completeOnboarding } from '@/server/actions/onboarding';
import type { ProfessionalData, ScheduleData } from '@/lib/types/onboarding';
import { DAY_LABELS } from '@/lib/types/onboarding';

type Props = {
  clinicName: string;
  professional: ProfessionalData;
  servicesCount: number;
  schedule: ScheduleData;
  vertical: string;
};

export function Step5Done({
  clinicName,
  professional,
  servicesCount,
  schedule,
  vertical,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const activeDays = (Object.keys(schedule.days)).filter((d) => schedule.days[d]).map((d) => DAY_LABELS[d].substring(0, 3));

  const dashboardPath = vertical === 'legal' ? '/legal/dashboard' : '/dental/dashboard';

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const res = await completeOnboarding();
      console.log('[step-5] respuesta:', res);
      if (!res.ok) {
        const err = res.error || 'Error al guardar';
        setErrorMsg(err);
        toast.error(err);
        setIsSaving(false);
        return;
      }
      toast.success('Configuracion guardada!');
      setIsComplete(true);
      setIsSaving(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado';
      setErrorMsg(msg);
      toast.error(msg);
      setIsSaving(false);
    }
  };

  const profName = (professional.title ? professional.title + ' ' : '') + professional.first_name + ' ' + professional.last_name;
  const horarioStr = activeDays.join(', ') + ' ' + schedule.start_time + '-' + schedule.end_time;
  const serviciosStr = servicesCount + ' servicio' + (servicesCount === 1 ? '' : 's');
  const labelClinica = vertical === 'legal' ? 'Despacho' : 'Clinica';
  const labelDescripcion = vertical === 'legal' ? 'despacho' : 'clinica';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center mb-3 shadow-lg">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Todo listo!</h2>
        <p className="text-sm text-slate-500 mt-1">Tu {labelDescripcion} esta configurada y lista.</p>
      </div>

      <div className="space-y-2 mb-6">
        <SummaryItem icon={<Building2 className="h-4 w-4 text-blue-600" />} label={labelClinica} value={clinicName} />
        <SummaryItem icon={<User className="h-4 w-4 text-violet-600" />} label="Profesional" value={profName} />
        <SummaryItem icon={<Briefcase className="h-4 w-4 text-emerald-600" />} label="Servicios" value={serviciosStr} />
        <SummaryItem icon={<Clock className="h-4 w-4 text-amber-600" />} label="Horario" value={horarioStr} />
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 mb-6">
        <p className="text-xs font-bold text-blue-900 mb-2">Que sigue?</p>
        <ul className="space-y-1 text-xs text-blue-900">
          <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />Registrar tu primer paciente</li>
          <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />Agendar la primera cita</li>
          <li className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />Generar cotizaciones</li>
        </ul>
      </div>

      {errorMsg ? (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 text-sm text-rose-900">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Error</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
        </div>
      ) : null}

      {!isComplete ? (
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition"
        >
          {isSaving ? (
            <span>Guardando...</span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Confirmar y finalizar
            </span>
          )}
        </button>
      ) : (
        <div>
          <div className="mb-3 rounded-xl bg-emerald-50 border-2 border-emerald-300 p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-emerald-900">Configuracion guardada exitosamente</p>
            <p className="text-xs text-emerald-800 mt-1">Click el boton de abajo para entrar al dashboard</p>
          </div>
          <a
            href={dashboardPath}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-bold text-white hover:bg-blue-700 shadow-sm"
            style={{ textDecoration: 'none' }}
          >
            Ir al dashboard
            <ArrowRight className="h-5 w-5" />
          </a>
          <p className="mt-3 text-center text-xs text-slate-500">
            URL directa: <a href={dashboardPath} className="text-blue-600 hover:underline">{dashboardPath}</a>
          </p>
        </div>
      )}
    </div>
  );
}

function SummaryItem(props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center gap-3">
      <div className="shrink-0">{props.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase text-slate-500">{props.label}</p>
        <p className="text-sm font-bold text-slate-900 truncate">{props.value}</p>
      </div>
    </div>
  );
}
