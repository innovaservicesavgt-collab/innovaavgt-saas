'use client';

import { Check, Building2, User, Briefcase, Clock, Sparkles } from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Clinica', icon: Building2 },
  { num: 2, label: 'Equipo', icon: User },
  { num: 3, label: 'Servicios', icon: Briefcase },
  { num: 4, label: 'Horario', icon: Clock },
  { num: 5, label: 'Listo', icon: Sparkles },
];

export function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between relative">
        {/* Linea de progreso */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-slate-200 -z-10">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: ((currentStep - 1) / (STEPS.length - 1)) * 100 + '%' }}
          />
        </div>

        {STEPS.map((s) => {
          const isComplete = s.num < currentStep;
          const isCurrent = s.num === currentStep;
          const Icon = s.icon;

          return (
            <div key={s.num} className="flex flex-col items-center gap-1.5">
              <div
                className={
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ' +
                  (isComplete
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-300 text-slate-400')
                }
              >
                {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
              </div>
              <span
                className={
                  'text-[10px] sm:text-xs font-bold ' +
                  (isCurrent ? 'text-blue-700' : isComplete ? 'text-emerald-700' : 'text-slate-400')
                }
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-slate-500">
        Paso {currentStep} de {STEPS.length}
      </p>
    </div>
  );
}
