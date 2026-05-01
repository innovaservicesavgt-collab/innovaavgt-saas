'use client';

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { Briefcase, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { saveOnboardingStep3 } from '@/server/actions/onboarding';
import type { SelectedService } from '@/lib/types/onboarding';

type ServiceTemplate = {
  id: string;
  vertical: string;
  category: string | null;
  name: string;
  default_price: number;
  default_duration_minutes: number;
};

type Props = {
  templates: ServiceTemplate[];
  selected: SelectedService[];
  onChange: (selected: SelectedService[]) => void;
  onNext: () => void;
  onBack: () => void;
};

export function Step3Services({ templates, selected, onChange, onNext, onBack }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);

  // Agrupar por categoria
  const grouped = useMemo(() => {
    const map: Record<string, ServiceTemplate[]> = {};
    templates.forEach((t) => {
      const cat = t.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(t);
    });
    return map;
  }, [templates]);

  const isSelected = (id: string) => selected.some((s) => s.template_id === id);

  const toggle = (template: ServiceTemplate) => {
    if (isSelected(template.id)) {
      onChange(selected.filter((s) => s.template_id !== template.id));
    } else {
      onChange([
        ...selected,
        {
          template_id: template.id,
          name: template.name,
          category: template.category || 'General',
          price: template.default_price,
          duration_minutes: template.default_duration_minutes,
        },
      ]);
    }
  };

  const updatePrice = (templateId: string, newPrice: number) => {
    onChange(selected.map((s) => s.template_id === templateId ? { ...s, price: newPrice } : s));
  };

  // Marcar populares (Diagnostico, Preventivo, Restaurador y Cirugia simple)
  const selectPopular = () => {
    const popularNames = [
      'Consulta de evaluacion',
      'Limpieza dental (profilaxis)',
      'Resina compuesta simple',
      'Resina compuesta amplia',
      'Extraccion simple',
      'Radiografia panoramica',
    ];
    const popular = templates
      .filter((t) => popularNames.some((p) => t.name.includes(p)))
      .map((t) => ({
        template_id: t.id,
        name: t.name,
        category: t.category || 'General',
        price: t.default_price,
        duration_minutes: t.default_duration_minutes,
      }));
    onChange(popular);
    toast.success(popular.length + ' servicios populares marcados');
  };

  const canSubmit = selected.length >= 3;

  const handleNext = () => {
    if (!canSubmit) {
      toast.error('Selecciona al menos 3 servicios');
      return;
    }
    startTransition(async () => {
      const res = await saveOnboardingStep3({ services: selected });
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
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
          <Briefcase className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Catalogo de servicios</h2>
        <p className="text-sm text-slate-500 mt-1">
          Selecciona los servicios que ofreces. Los precios estan basados en el mercado guatemalteco.
        </p>
      </div>

      {/* Acciones rapidas */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={selectPopular}
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          + Marcar servicios populares
        </button>
        <span className="text-xs font-bold text-slate-700">
          {selected.length} seleccionado{selected.length === 1 ? '' : 's'} {canSubmit ? '✓' : '(min 3)'}
        </span>
      </div>

      {/* Listado por categoria */}
      <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-[11px] font-bold uppercase text-slate-500 mb-2">{category}</h3>
            <div className="space-y-1.5">
              {items.map((t) => {
                const sel = isSelected(t.id);
                const selectedItem = selected.find((s) => s.template_id === t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => toggle(t)}
                    className={
                      'rounded-lg border-2 p-3 cursor-pointer transition flex items-center gap-3 ' +
                      (sel
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 bg-white hover:border-slate-300')
                    }
                  >
                    <div
                      className={
                        'flex h-5 w-5 items-center justify-center rounded border-2 shrink-0 ' +
                        (sel ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300')
                      }
                    >
                      {sel && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{t.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.default_duration_minutes} min
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs text-slate-500">Q</span>
                      {sel && editingPriceId === t.id ? (
                        <input
                          type="number"
                          value={selectedItem?.price || 0}
                          onChange={(e) => updatePrice(t.id, parseFloat(e.target.value) || 0)}
                          onBlur={() => setEditingPriceId(null)}
                          autoFocus
                          className="w-20 rounded border border-slate-300 px-2 py-0.5 text-sm font-bold text-right tabular-nums"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => sel && setEditingPriceId(t.id)}
                          className={'text-sm font-bold tabular-nums ' + (sel ? 'text-slate-900 hover:underline cursor-pointer' : 'text-slate-500')}
                        >
                          {(selectedItem?.price || t.default_price).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between gap-3">
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
    </div>
  );
}
