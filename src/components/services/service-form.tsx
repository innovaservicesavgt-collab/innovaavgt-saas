'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Tag,
  DollarSign,
  Clock,
  Palette,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import { createService, updateService } from '@/server/actions/services';
import {
  DENTAL_CATEGORIES,
  getCategoryColor,
  type Service,
} from '@/lib/types/service';

type Props =
  | { mode: 'create'; service?: never }
  | { mode: 'edit'; service: Service };

const COLORS = [
  '#10b981', '#3b82f6', '#7c3aed', '#f59e0b', '#ef4444',
  '#06b6d4', '#a855f7', '#ec4899', '#f43f5e', '#14b8a6',
  '#0ea5e9', '#6366f1', '#dc2626', '#16a34a', '#64748b',
];

export function ServiceForm(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initial = props.mode === 'edit' ? props.service : null;

  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [duration, setDuration] = useState(initial?.duration_minutes || 30);
  const [buffer, setBuffer] = useState(initial?.buffer_minutes || 0);
  const [price, setPrice] = useState<string>(
    initial?.price != null ? String(initial.price) : ''
  );
  const [category, setCategory] = useState(initial?.category || '');
  const [color, setColor] = useState(initial?.color || '#10b981');
  const [requiresConfirmation, setRequiresConfirmation] = useState(
    initial?.requires_confirmation === true
  );
  const [isActive, setIsActive] = useState(initial?.is_active !== false);

  // Auto-elegir color por categoria si el usuario no lo cambia
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (newCat) {
      const cfg = DENTAL_CATEGORIES.find((c) => c.value === newCat);
      if (cfg) setColor(cfg.color);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const priceNum = price === '' ? null : Number(price);
    if (price !== '' && (isNaN(priceNum as number) || (priceNum as number) < 0)) {
      toast.error('Precio inválido');
      return;
    }

    startTransition(async () => {
      const payload = {
        name,
        description: description || null,
        duration_minutes: duration,
        buffer_minutes: buffer,
        price: priceNum,
        category: category || null,
        color,
        requires_confirmation: requiresConfirmation,
        is_active: isActive,
      };

      const res =
        props.mode === 'create'
          ? await createService(payload)
          : await updateService({ ...payload, id: props.service.id });

      if (!res.ok) {
        toast.error(res.error || 'Error al guardar');
        return;
      }

      toast.success(
        props.mode === 'create' ? 'Servicio creado' : 'Servicio actualizado'
      );
      router.push('/dental/services');
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Datos basicos */}
      <Section title="Información del servicio" icon={<Tag className="h-4 w-4 text-blue-600" />}>
        <Field label="Nombre del servicio" required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            className="form-input"
            placeholder="Ej: Limpieza dental profunda, Resina compuesta..."
          />
        </Field>

        <Field label="Descripción">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="form-input"
            placeholder="Detalles del procedimiento, qué incluye, observaciones..."
          />
        </Field>

        <Field label="Categoría">
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="form-input"
          >
            <option value="">Sin categoría</option>
            {DENTAL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* Precio y duracion */}
      <Section title="Precio y duración" icon={<DollarSign className="h-4 w-4 text-emerald-600" />}>
        <Grid2>
          <Field label="Precio (Q)" icon={<DollarSign className="h-3 w-3" />}>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="form-input"
              placeholder="350.00"
            />
          </Field>
          <Field label="Duración (minutos)" icon={<Clock className="h-3 w-3" />} required>
            <input
              type="number"
              min="5"
              max="480"
              step="5"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              required
              className="form-input"
            />
          </Field>
          <FieldFull
            label="Tiempo de buffer entre citas (minutos)"
            help="Tiempo que se reserva DESPUÉS de esta cita para limpieza/preparación"
          >
            <input
              type="number"
              min="0"
              max="120"
              step="5"
              value={buffer}
              onChange={(e) => setBuffer(parseInt(e.target.value) || 0)}
              className="form-input"
            />
          </FieldFull>
        </Grid2>
      </Section>

      {/* Visual */}
      <Section title="Color en calendario" icon={<Palette className="h-4 w-4 text-violet-600" />}>
        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-lg border-2 transition ${
                  color === c ? 'border-slate-900 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </Field>
      </Section>

      {/* Opciones */}
      <Section title="Opciones" icon={<AlertCircle className="h-4 w-4 text-amber-600" />}>
        <CheckboxField
          label="Requiere confirmación"
          help="Se marcará la cita como pendiente hasta que la confirme el paciente"
          checked={requiresConfirmation}
          onChange={setRequiresConfirmation}
        />
        <CheckboxField
          label="Servicio activo"
          help="Si está inactivo, no aparecerá en formularios de cita ni cotización"
          checked={isActive}
          onChange={setIsActive}
        />
      </Section>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-2">
        <Link
          href="/dental/services"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <X className="h-4 w-4" />
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {isPending
            ? 'Guardando...'
            : props.mode === 'create'
            ? 'Crear servicio'
            : 'Guardar cambios'}
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
          transition: all 0.15s;
        }
        :global(.form-input:focus) {
          border-color: rgb(16 185 129);
          box-shadow: 0 0 0 4px rgb(209 250 229);
        }
      `}</style>
    </form>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
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

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function FieldFull({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="sm:col-span-2">
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label}
      </label>
      {children}
      {help && <p className="mt-1 text-[11px] text-slate-500">{help}</p>}
    </div>
  );
}

function CheckboxField({
  label,
  help,
  checked,
  onChange,
}: {
  label: string;
  help?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {help && <div className="text-xs text-slate-500 mt-0.5">{help}</div>}
      </div>
    </label>
  );
}