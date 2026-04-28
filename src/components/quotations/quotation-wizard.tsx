'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  User,
  Stethoscope,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Search,
  X,
  Save,
  Send,
  ArrowRight,
  ArrowLeft,
  Tag,
  Hash,
  StickyNote,
  Percent,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { createQuotation } from '@/server/actions/quotations';

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  date_of_birth: string | null;
};

type Professional = {
  id: string;
  first_name: string;
  last_name: string;
  title: string | null;
  specialty: string | null;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_minutes: number | null;
  category: string | null;
  color: string | null;
};

type Item = {
  tempId: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  tooth_numbers: string[];
  notes: string;
};

type Props = {
  patients: Patient[];
  professionals: Professional[];
  services: Service[];
  preselectedPatientId: string | null;
};

export function QuotationWizard({
  patients,
  professionals,
  services,
  preselectedPatientId,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [patientId, setPatientId] = useState<string>(preselectedPatientId || '');
  const [patientFilter, setPatientFilter] = useState('');
  const [professionalId, setProfessionalId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  // Step 2
  const [items, setItems] = useState<Item[]>([]);
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'amount'>('none');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [terms, setTerms] = useState(
    'Cotizacion valida por 30 dias. Los precios pueden variar segun la complejidad del caso. Se requiere abono inicial para iniciar tratamientos.'
  );
  const [internalNotes, setInternalNotes] = useState('');

  const [showServiceModal, setShowServiceModal] = useState(false);

  // Filtrado de pacientes
  const filteredPatients = useMemo(() => {
    const q = patientFilter.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const name = (p.first_name + ' ' + p.last_name).toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [patients, patientFilter]);

  const selectedPatient = useMemo(
    () => patients.find((p) => p.id === patientId) || null,
    [patients, patientId]
  );

  // Calculos
  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0),
    [items]
  );

  const discountAmount = useMemo(() => {
    if (discountType === 'none' || !discountValue) return 0;
    const v = parseFloat(discountValue) || 0;
    if (discountType === 'percent') return (subtotal * v) / 100;
    return v;
  }, [discountType, discountValue, subtotal]);

  const total = Math.max(0, subtotal - discountAmount);

  // Validacion paso 1
  const step1Valid = patientId.length > 0 && title.trim().length > 0;

  const goToStep2 = () => {
    if (!patientId) {
      toast.error('Selecciona un paciente');
      return;
    }
    if (!title.trim()) {
      toast.error('Escribe un titulo para la cotizacion');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addItemFromService = (s: Service) => {
    const newItem: Item = {
      tempId: Math.random().toString(36).slice(2),
      service_id: s.id,
      description: s.name,
      quantity: 1,
      unit_price: Number(s.price || 0),
      tooth_numbers: [],
      notes: '',
    };
    setItems((prev) => [...prev, newItem]);
    setShowServiceModal(false);
    toast.success('Tratamiento agregado');
  };

  const addCustomItem = () => {
    const newItem: Item = {
      tempId: Math.random().toString(36).slice(2),
      service_id: null,
      description: '',
      quantity: 1,
      unit_price: 0,
      tooth_numbers: [],
      notes: '',
    };
    setItems((prev) => [...prev, newItem]);
    setShowServiceModal(false);
  };

  const updateItem = (tempId: string, patch: Partial<Item>) => {
    setItems((prev) =>
      prev.map((it) => (it.tempId === tempId ? { ...it, ...patch } : it))
    );
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  const handleSubmit = (status: 'draft' | 'sent') => {
    if (items.length === 0) {
      toast.error('Agrega al menos un tratamiento');
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      toast.error('Todos los items deben tener descripcion');
      return;
    }

    startTransition(async () => {
      const res = await createQuotation({
        patient_id: patientId,
        professional_id: professionalId || null,
        title,
        description: description || null,
        valid_until: validUntil || null,
        discount_type: discountType === 'none' ? null : discountType,
        discount_value:
          discountType === 'none' ? 0 : parseFloat(discountValue) || 0,
        terms: terms || null,
        internal_notes: internalNotes || null,
        status,
        items: items.map((it, idx) => ({
          service_id: it.service_id,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
          tooth_numbers: it.tooth_numbers.length > 0 ? it.tooth_numbers : null,
          notes: it.notes || null,
          sort_order: idx,
        })),
      });

      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }

      toast.success(
        status === 'draft' ? 'Borrador guardado' : 'Cotizacion creada'
      );
      router.push('/dental/quotations/' + res.id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className={step === 1 ? 'text-emerald-700' : 'text-emerald-700'}>
            <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
            Paso 1: Datos generales
          </span>
          <span className="flex-1" />
          <span className={step === 2 ? 'text-emerald-700' : 'text-slate-400'}>
            Paso 2: Items y descuentos
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Paciente */}
          <Section
            title="Paciente"
            icon={<User className="h-4 w-4 text-blue-600" />}
          >
            {selectedPatient ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <p className="font-bold text-slate-900 truncate">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                  </div>
                  {selectedPatient.phone && (
                    <p className="text-xs text-slate-600 mt-0.5 ml-6">
                      {selectedPatient.phone}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPatientId('');
                    setPatientFilter('');
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-white"
                  title="Cambiar paciente"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Filtro opcional */}
                {patients.length > 5 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={patientFilter}
                      onChange={(e) => setPatientFilter(e.target.value)}
                      placeholder="Filtrar paciente por nombre o telefono..."
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                )}

                {/* Lista de pacientes */}
                {filteredPatients.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
                    <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-2 text-sm text-slate-600">
                      {patients.length === 0
                        ? 'No tienes pacientes registrados'
                        : 'Sin coincidencias'}
                    </p>
                    {patients.length === 0 && (
                      <Link
                        href="/dental/patients/new"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Registrar primer paciente
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPatientId(p.id);
                          setPatientFilter('');
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {p.first_name} {p.last_name}
                          </p>
                          {p.phone && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {p.phone}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                <p className="text-[11px] text-slate-500">
                  {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente disponible' : 'pacientes disponibles'}. Haz click en uno para seleccionarlo.
                </p>
              </div>
            )}
          </Section>

          {/* Datos generales */}
          <Section
            title="Datos generales"
            icon={<FileText className="h-4 w-4 text-emerald-600" />}
          >
            <Field label="Titulo de la cotizacion" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Plan ortodoncia 18 meses, Endodoncia molar..."
                className="form-input"
              />
            </Field>

            <Field label="Descripcion">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Detalle del plan de tratamiento..."
                className="form-input"
              />
            </Field>

            <Grid2>
              <Field
                label="Profesional"
                icon={<Stethoscope className="h-3 w-3" />}
              >
                <select
                  value={professionalId}
                  onChange={(e) => setProfessionalId(e.target.value)}
                  className="form-input"
                >
                  <option value="">Sin asignar</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title ? p.title + ' ' : ''}
                      {p.first_name} {p.last_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Valido hasta"
                icon={<Calendar className="h-3 w-3" />}
              >
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="form-input"
                />
              </Field>
            </Grid2>
          </Section>

          {/* Mensaje de validacion */}
          {!step1Valid && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2 text-sm text-amber-900">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {!patientId && !title.trim()
                  ? 'Selecciona un paciente y escribe un titulo para continuar'
                  : !patientId
                  ? 'Selecciona un paciente para continuar'
                  : 'Escribe un titulo para la cotizacion'}
              </span>
            </div>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-2">
            <Link
              href="/dental/quotations"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="button"
              onClick={goToStep2}
              disabled={!step1Valid}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Siguiente: Items
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Resumen del paciente arriba */}
          {selectedPatient && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <User className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </p>
                <span className="text-slate-300">.</span>
                <p className="text-xs text-slate-600 truncate">{title}</p>
              </div>
            </div>
          )}

          {/* Items */}
          <Section
            title="Tratamientos / Servicios"
            icon={<Tag className="h-4 w-4 text-violet-600" />}
            action={
              <button
                type="button"
                onClick={() => setShowServiceModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar tratamiento
              </button>
            }
          >
            {items.length === 0 ? (
              <div className="py-8 text-center">
                <Tag className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-600">
                  Sin tratamientos
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Agrega al menos uno para continuar
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <ItemRow
                    key={it.tempId}
                    item={it}
                    index={idx}
                    onChange={(patch) => updateItem(it.tempId, patch)}
                    onRemove={() => removeItem(it.tempId)}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Descuento */}
          <Section
            title="Descuento"
            icon={<Percent className="h-4 w-4 text-amber-600" />}
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <DiscountToggle value="none" current={discountType} onChange={setDiscountType} label="Sin descuento" />
              <DiscountToggle value="percent" current={discountType} onChange={setDiscountType} label="Porcentaje (%)" />
              <DiscountToggle value="amount" current={discountType} onChange={setDiscountType} label="Monto fijo (Q)" />
            </div>

            {discountType !== 'none' && (
              <Field label={discountType === 'percent' ? 'Porcentaje' : 'Monto en quetzales'}>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={discountType === 'percent' ? '100' : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                    className="form-input pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    {discountType === 'percent' ? '%' : 'Q'}
                  </span>
                </div>
              </Field>
            )}
          </Section>

          {/* Terminos */}
          <Section
            title="Terminos y condiciones"
            icon={<StickyNote className="h-4 w-4 text-slate-600" />}
          >
            <Field label="Terminos para el paciente">
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                placeholder="Validez, formas de pago, garantias..."
                className="form-input"
              />
            </Field>
            <Field label="Notas internas (no visibles al paciente)">
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={2}
                placeholder="Recordatorios para el equipo, observaciones..."
                className="form-input"
              />
            </Field>
          </Section>

          {/* Resumen totales */}
          <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 shadow-sm">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">
                  Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatMoney(subtotal)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-rose-700">
                  <span>
                    Descuento{' '}
                    {discountType === 'percent' && discountValue
                      ? '(' + discountValue + '%)'
                      : ''}
                  </span>
                  <span className="font-semibold tabular-nums">
                    -{formatMoney(discountAmount)}
                  </span>
                </div>
              )}
              <div className="pt-2 mt-2 border-t border-emerald-300">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">TOTAL</span>
                  <span className="text-2xl font-bold text-emerald-700 tabular-nums">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Atras
            </button>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={isPending || items.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isPending ? 'Guardando...' : 'Guardar borrador'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('sent')}
                disabled={isPending || items.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
              >
                <Send className="h-4 w-4" />
                {isPending ? 'Creando...' : 'Crear y enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showServiceModal && (
        <ServiceModal
          services={services}
          onSelectService={addItemFromService}
          onAddCustom={addCustomItem}
          onClose={() => setShowServiceModal(false)}
        />
      )}

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
    </div>
  );
}

// ─── ItemRow ──────────────────────────────────────────────
function ItemRow({
  item,
  index,
  onChange,
  onRemove,
}: {
  item: Item;
  index: number;
  onChange: (patch: Partial<Item>) => void;
  onRemove: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const totalLine = item.quantity * item.unit_price;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
          {index + 1}
        </span>

        <div className="flex-1 min-w-0 space-y-2">
          <input
            type="text"
            value={item.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Descripcion del tratamiento"
            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <label className="text-[10px] font-medium text-slate-500">Cantidad</label>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => onChange({ quantity: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500">Precio unit.</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unit_price}
                onChange={(e) => onChange({ unit_price: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500">Total</label>
              <div className="px-2 py-1 text-sm font-bold text-emerald-700 tabular-nums bg-emerald-50 rounded-lg border border-emerald-200">
                {formatMoney(totalLine)}
              </div>
            </div>
          </div>

          {showDetails && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                  <Hash className="h-3 w-3" />
                  Piezas dentales (separadas por coma)
                </label>
                <input
                  type="text"
                  value={item.tooth_numbers.join(', ')}
                  onChange={(e) => {
                    const arr = e.target.value.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
                    onChange({ tooth_numbers: arr });
                  }}
                  placeholder="Ej: 14, 15, 24, 25"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                  <StickyNote className="h-3 w-3" />
                  Notas adicionales
                </label>
                <input
                  type="text"
                  value={item.notes}
                  onChange={(e) => onChange({ notes: e.target.value })}
                  placeholder="Detalles especificos de este item"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              {showDetails ? 'Ocultar' : '+ Piezas y notas'}
            </button>
            {item.tooth_numbers.length > 0 && !showDetails && (
              <span className="text-[10px] text-slate-500">
                Piezas: {item.tooth_numbers.join(', ')}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── ServiceModal ─────────────────────────────────────────
function ServiceModal({
  services,
  onSelectService,
  onAddCustom,
  onClose,
}: {
  services: Service[];
  onSelectService: (s: Service) => void;
  onAddCustom: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) =>
      (s.name + ' ' + (s.category || '') + ' ' + (s.description || '')).toLowerCase().includes(q)
    );
  }, [services, search]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Agregar tratamiento</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              placeholder="Buscar por nombre, categoria..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-600">
                {services.length === 0 ? 'No tienes servicios en el catalogo' : 'Sin coincidencias'}
              </p>
              <button
                type="button"
                onClick={onAddCustom}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar item personalizado
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelectService(s)}
                  className="w-full text-left rounded-lg p-3 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-emerald-700 tabular-nums">
                        {s.price ? formatMoney(s.price) : '-'}
                      </p>
                      {s.duration_minutes && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {s.duration_minutes} min
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onAddCustom}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Agregar item personalizado (sin servicio)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────
function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-5 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        {action}
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

function DiscountToggle({
  value,
  current,
  onChange,
  label,
}: {
  value: 'none' | 'percent' | 'amount';
  current: 'none' | 'percent' | 'amount';
  onChange: (v: 'none' | 'percent' | 'amount') => void;
  label: string;
}) {
  const active = value === current;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition ' + (active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50')}
    >
      {label}
    </button>
  );
}

function formatMoney(n: number): string {
  return 'Q' + n.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
