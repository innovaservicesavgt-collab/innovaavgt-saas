'use client';

import { Check } from 'lucide-react';

type Plan = {
  id: string;
  code: string;
  name: string;
  monthly_price: number;
  trial_days: number;
  description: string | null;
  max_users: number | null;
  storage_mb: number | null;
};

type Props = {
  plans: Plan[];
  selectedId: string;
  onChange: (id: string) => void;
};

export function PlanSelector({ plans, selectedId, onChange }: Props) {
  if (plans.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No hay planes disponibles para este vertical en este momento.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {plans.map((plan) => {
        const isSelected = plan.id === selectedId;
        const isMostPopular = plan.code.includes('pro');

        return (
          <button
            key={plan.id}
            type="button"
            onClick={() => onChange(plan.id)}
            className={
              'relative rounded-xl border-2 p-4 text-left transition ' +
              (isSelected
                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-100'
                : 'border-gray-200 hover:border-gray-300 bg-white')
            }
          >
            {isMostPopular && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-900 shadow">
                MAS POPULAR
              </span>
            )}

            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-gray-900">{plan.name}</h3>
              {isSelected && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shrink-0">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>

            <div className="mt-2">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                Q{plan.monthly_price.toLocaleString('es-GT', { maximumFractionDigits: 0 })}
                <span className="text-sm font-normal text-gray-500">/mes</span>
              </p>
              <p className="text-xs text-emerald-700 font-bold mt-0.5">
                {plan.trial_days} dias de prueba gratis
              </p>
            </div>

            {plan.description && (
              <p className="mt-2 text-xs text-gray-600">{plan.description}</p>
            )}

            <ul className="mt-3 space-y-1 text-xs text-gray-700">
              <li className="flex items-start gap-1.5">
                <Check className="h-3 w-3 mt-0.5 shrink-0 text-emerald-600" />
                {plan.max_users ? plan.max_users + ' usuarios' : 'Usuarios ilimitados'}
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3 w-3 mt-0.5 shrink-0 text-emerald-600" />
                {plan.storage_mb ? Math.round(plan.storage_mb / 1024) + ' GB de almacenamiento' : 'Storage ilimitado'}
              </li>
            </ul>
          </button>
        );
      })}
    </div>
  );
}
