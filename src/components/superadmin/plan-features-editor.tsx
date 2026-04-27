'use client';

import { useState } from 'react';
import {
  Check,
  Lock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  type FeatureGroup,
  type FeatureDefinition,
} from '@/lib/features-catalog';
import { cn } from '@/lib/utils/cn';

type Props = {
  groups: FeatureGroup[];
  /** Estado inicial de las features (desde plan.features en BD) */
  initialFeatures: Record<string, unknown>;
};

/**
 * Editor visual de features. Las features se envían al servidor como
 * inputs con name="features.<key>" para que el server action las parsee.
 *
 * Cada checkbox booleano:
 *  - Si está marcado → envía features.<key>=true
 *  - Si NO está marcado → no envía nada (el parser lo trata como false)
 *
 * Cada input numérico:
 *  - Envía features.<key>=<número> o vacío (= null = ilimitado)
 */
export function PlanFeaturesEditor({ groups, initialFeatures }: Props) {
  // Estado local de booleans (para mostrar contadores y permitir UX fluida)
  const [boolValues, setBoolValues] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    groups.forEach((g) =>
      g.features.forEach((f) => {
        if (f.type === 'boolean') {
          init[f.key] = initialFeatures[f.key] === true;
        }
      })
    );
    return init;
  });

  // Estado local de números (para inputs)
  const [numValues, setNumValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    groups.forEach((g) =>
      g.features.forEach((f) => {
        if (f.type === 'number') {
          const v = initialFeatures[f.key];
          init[f.key] = v === null || v === undefined ? '' : String(v);
        }
      })
    );
    return init;
  });

  // Grupos colapsados (todos expandidos al inicio)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (groupId: string) => {
    setCollapsed((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleBoolChange = (key: string, checked: boolean) => {
    setBoolValues((prev) => ({ ...prev, [key]: checked }));
  };

  const handleNumChange = (key: string, value: string) => {
    setNumValues((prev) => ({ ...prev, [key]: value }));
  };

  // Activar / desactivar todas las del grupo (excepto las is_core)
  const toggleAllInGroup = (group: FeatureGroup, target: boolean) => {
    setBoolValues((prev) => {
      const next = { ...prev };
      group.features.forEach((f) => {
        if (f.type === 'boolean' && !f.is_core) {
          next[f.key] = target;
        }
      });
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const isCollapsed = collapsed[group.id] ?? false;
        const totalBools = group.features.filter((f) => f.type === 'boolean').length;
        const activeBools = group.features.filter(
          (f) => f.type === 'boolean' && boolValues[f.key]
        ).length;

        return (
          <section
            key={group.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            {/* Cabecera del grupo */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50 px-5 py-4">
              <button
                type="button"
                onClick={() => toggleCollapse(group.id)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span className="text-2xl" aria-hidden>
                  {group.icon}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {group.label}
                  </h3>
                  {group.description && (
                    <p className="text-xs text-slate-500">{group.description}</p>
                  )}
                </div>
                {totalBools > 0 && (
                  <span
                    className={cn(
                      'ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      activeBools === totalBools
                        ? 'bg-emerald-100 text-emerald-700'
                        : activeBools === 0
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {activeBools} / {totalBools}
                  </span>
                )}
                {isCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {!isCollapsed && totalBools > 1 && (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAllInGroup(group, true)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
                  >
                    Activar todas
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAllInGroup(group, false)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700"
                  >
                    Desactivar
                  </button>
                </div>
              )}
            </div>

            {/* Lista de features */}
            {!isCollapsed && (
              <div className="divide-y divide-slate-100">
                {group.features.map((feature) =>
                  feature.type === 'boolean' ? (
                    <BooleanFeatureRow
                      key={feature.key}
                      feature={feature}
                      checked={boolValues[feature.key] ?? false}
                      onChange={(c) => handleBoolChange(feature.key, c)}
                    />
                  ) : (
                    <NumberFeatureRow
                      key={feature.key}
                      feature={feature}
                      value={numValues[feature.key] ?? ''}
                      onChange={(v) => handleNumChange(feature.key, v)}
                    />
                  )
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Filas individuales
// ─────────────────────────────────────────────────────────────────

function BooleanFeatureRow({
  feature,
  checked,
  onChange,
}: {
  feature: FeatureDefinition;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const isCore = feature.is_core ?? false;
  const isPremium = feature.is_premium ?? false;

  // Si es core, forzamos checked=true y no permitimos cambios
  const effectiveChecked = isCore ? true : checked;

  return (
    <label
      className={cn(
        'group flex items-start gap-3 px-5 py-3.5 transition cursor-pointer',
        isCore ? 'bg-slate-50/50 cursor-not-allowed' : 'hover:bg-slate-50'
      )}
    >
      {/* Checkbox visual */}
      <span
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition',
          effectiveChecked
            ? isCore
              ? 'bg-slate-400 border-slate-400'
              : 'bg-emerald-500 border-emerald-500'
            : 'bg-white border-slate-300 group-hover:border-slate-400'
        )}
      >
        {effectiveChecked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      </span>

      {/* Input real (oculto pero participa del form) */}
      {/*
        Solo enviamos el input cuando está marcado.
        Si está desmarcado y no es core, no enviamos nada → el parser lo trata como false.
        Si es core, lo enviamos siempre como "true".
      */}
      {(effectiveChecked || isCore) && (
        <input
          type="hidden"
          name={`features.${feature.key}`}
          value="true"
        />
      )}

      {/* Checkbox real (no visible, pero clicable) */}
      {!isCore && (
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          tabIndex={-1}
          aria-label={feature.label}
        />
      )}

      {/* Etiquetas */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium',
              effectiveChecked ? 'text-slate-900' : 'text-slate-700'
            )}
          >
            {feature.label}
          </span>

          {isCore && (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
              <Lock className="h-2.5 w-2.5" />
              Core
            </span>
          )}

          {isPremium && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              <Sparkles className="h-2.5 w-2.5" />
              Premium
            </span>
          )}
        </div>

        {feature.description && (
          <p className="mt-0.5 text-xs text-slate-500">{feature.description}</p>
        )}
      </div>
    </label>
  );
}

function NumberFeatureRow({
  feature,
  value,
  onChange,
}: {
  feature: FeatureDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-blue-300 bg-blue-50">
        <span className="text-[10px] font-bold text-blue-700">N°</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-900">
            {feature.label}
          </span>
          {feature.is_premium && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              <Sparkles className="h-2.5 w-2.5" />
              Premium
            </span>
          )}
        </div>
        {feature.description && (
          <p className="mt-0.5 text-xs text-slate-500">{feature.description}</p>
        )}
      </div>

      <input
        type="number"
        name={`features.${feature.key}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        placeholder="Ilimitado"
        className="w-32 shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}