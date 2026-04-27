'use client';

import { useActionState } from 'react';
import { useState } from 'react';
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  updatePlan,
  type ActionState,
} from '@/server/actions/plans';
import { PlanFeaturesEditor } from '@/components/superadmin/plan-features-editor';
import {
  getGroupsForVertical,
} from '@/lib/features-catalog';
import { getVertical, type VerticalCode } from '@/lib/verticals';
import { cn } from '@/lib/utils/cn';

type Plan = {
  id: string;
  code: string;
  vertical: VerticalCode;
  name: string;
  description: string | null;
  monthly_price: number;
  annual_price: number | null;
  currency: string;
  max_users: number | null;
  max_branches: number | null;
  max_patients: number | null;
  max_cases: number | null;
  storage_mb: number | null;
  features: Record<string, unknown>;
  is_active: boolean;
  is_public: boolean;
  sort_order: number;
};

type Props = {
  plan: Plan;
  availableCurrencies: string[];
};

const INITIAL_STATE: ActionState = { ok: false };

export function PlanEditForm({ plan, availableCurrencies }: Props) {
  // Server action vinculada al id del plan
  const boundUpdate = updatePlan.bind(null, plan.id);
  const [state, formAction, isPending] = useActionState(
    boundUpdate,
    INITIAL_STATE
  );

  // Estado local: solo para inputs controlados de UX
  const [isActive, setIsActive] = useState(plan.is_active);
  const [isPublic, setIsPublic] = useState(plan.is_public);

  const verticalConfig = getVertical(plan.vertical);
  const groups = getGroupsForVertical(plan.vertical);

  const errors = state?.errors ?? {};
  const fieldError = (field: string) => errors[field]?.[0];

  return (
    <form action={formAction} className="space-y-6">
      {/* Banner de feedback */}
      {state?.message && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border p-4',
            state.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          )}
        >
          {state.ok ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
          )}
          <div className="flex-1 text-sm font-medium">{state.message}</div>
        </div>
      )}

      {/* SECCIÓN: Identidad (read-only) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Identidad del plan</h3>
        <p className="mt-1 text-sm text-slate-500">
          El código y vertical no son editables — son la identidad del plan.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Código
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <code className="text-sm font-mono text-slate-700">{plan.code}</code>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Vertical
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <span className="text-lg">{verticalConfig.emoji}</span>
              <span className="text-sm font-medium text-slate-700">
                {verticalConfig.brandName}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN: Metadatos */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Información del plan</h3>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
              Nombre del plan
            </label>
            <input
              id="name"
              name="name"
              type="text"
              defaultValue={plan.name}
              required
              className={cn(
                'mt-1.5 block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-4 focus:ring-blue-100',
                fieldError('name')
                  ? 'border-rose-300 focus:border-rose-500'
                  : 'border-slate-300 focus:border-blue-500'
              )}
            />
            {fieldError('name') && (
              <p className="mt-1 text-xs text-rose-600">{fieldError('name')}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={plan.description ?? ''}
              rows={2}
              className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              placeholder="Descripción visible para los clientes potenciales"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="sort_order" className="block text-sm font-semibold text-slate-700">
                Orden
              </label>
              <input
                id="sort_order"
                name="sort_order"
                type="number"
                min="0"
                defaultValue={plan.sort_order}
                className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <p className="mt-1 text-xs text-slate-500">Más bajo = aparece primero</p>
            </div>

            <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-300 bg-white p-3 transition hover:bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">Plan activo</span>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500">
                  {isActive ? 'Disponible para nuevos clientes' : 'Oculto'}
                </span>
              </div>
            </label>

            <label className="flex cursor-pointer flex-col gap-2 rounded-xl border border-slate-300 bg-white p-3 transition hover:bg-slate-50">
              <span className="text-sm font-semibold text-slate-700">Plan público</span>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-500">
                  {isPublic ? 'Visible en landing' : 'Privado / a medida'}
                </span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* SECCIÓN: Precios */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Precios</h3>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="monthly_price" className="block text-sm font-semibold text-slate-700">
              Precio mensual
            </label>
            <input
              id="monthly_price"
              name="monthly_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={plan.monthly_price}
              required
              className={cn(
                'mt-1.5 block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-4 focus:ring-blue-100',
                fieldError('monthly_price')
                  ? 'border-rose-300 focus:border-rose-500'
                  : 'border-slate-300 focus:border-blue-500'
              )}
            />
            {fieldError('monthly_price') && (
              <p className="mt-1 text-xs text-rose-600">{fieldError('monthly_price')}</p>
            )}
          </div>

          <div>
            <label htmlFor="annual_price" className="block text-sm font-semibold text-slate-700">
              Precio anual
            </label>
            <input
              id="annual_price"
              name="annual_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={plan.annual_price ?? ''}
              placeholder="Vacío = no disponible"
              className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-semibold text-slate-700">
              Moneda
            </label>
            <select
              id="currency"
              name="currency"
              defaultValue={plan.currency}
              required
              className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {availableCurrencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* SECCIÓN: Límites */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Límites del plan</h3>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
          <Info className="h-4 w-4" />
          Deja vacío para "ilimitado"
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <LimitInput
            id="max_users"
            label="Usuarios máximos"
            value={plan.max_users}
            error={fieldError('max_users')}
          />
          <LimitInput
            id="max_branches"
            label="Sucursales máximas"
            value={plan.max_branches}
            error={fieldError('max_branches')}
          />
          {plan.vertical === 'dental' && (
            <LimitInput
              id="max_patients"
              label="Pacientes máximos"
              value={plan.max_patients}
              error={fieldError('max_patients')}
            />
          )}
          {plan.vertical === 'legal' && (
            <LimitInput
              id="max_cases"
              label="Expedientes máximos"
              value={plan.max_cases}
              error={fieldError('max_cases')}
            />
          )}
          <LimitInput
            id="storage_mb"
            label="Almacenamiento (MB)"
            value={plan.storage_mb}
            error={fieldError('storage_mb')}
          />
        </div>
      </section>

      {/* SECCIÓN: Features */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900">Funciones incluidas</h3>
        <p className="mt-1 text-sm text-slate-500">
          Activa o desactiva las funciones que vienen con este plan. Los módulos
          marcados como "Core" son obligatorios y no pueden desactivarse.
        </p>

        <div className="mt-5">
          <PlanFeaturesEditor
            groups={groups}
            initialFeatures={plan.features}
          />
        </div>
      </section>

      {/* Botón submit */}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            'inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-base font-semibold text-white shadow-lg transition',
            isPending
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Guardar cambios
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helper: input de límite con manejo de null/ilimitado
// ─────────────────────────────────────────────────────────────────
function LimitInput({
  id,
  label,
  value,
  error,
}: {
  id: string;
  label: string;
  value: number | null;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="number"
        min="0"
        defaultValue={value ?? ''}
        placeholder="Ilimitado"
        className={cn(
          'mt-1.5 block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-4 focus:ring-blue-100',
          error
            ? 'border-rose-300 focus:border-rose-500'
            : 'border-slate-300 focus:border-blue-500'
        )}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}