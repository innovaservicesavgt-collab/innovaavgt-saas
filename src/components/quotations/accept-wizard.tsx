'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  CheckCircle2,
  CreditCard,
  Wallet,
  Calendar,
  Hash,
  ArrowRight,
  ArrowLeft,
  Save,
  AlertCircle,
  Info,
  User,
  Banknote,
  Building2,
  Receipt,
} from 'lucide-react';
import {
  acceptQuotationAndCreatePlan,
} from '@/server/actions/treatment-plans';
import {
  calculateInstallments,
  frequencyLabel,
  type InstallmentFrequency,
} from '@/lib/installments';

type Props = {
  quotationId: string;
  quotationNumber: string;
  title: string;
  total: number;
  patientName: string;
  patientPhone: string | null;
};

type Step = 1 | 2 | 3;
type PaymentTerms = 'full' | 'installments';
type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';

export function AcceptWizard({
  quotationId,
  quotationNumber,
  title,
  total,
  patientName,
  patientPhone,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('installments');

  // Step 2
  const [numInstallments, setNumInstallments] = useState(6);
  const [frequency, setFrequency] = useState<InstallmentFrequency>('monthly');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [initialPayment, setInitialPayment] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  // Calculo de cuotas en vivo
  const installments = useMemo(() => {
    if (paymentTerms === 'full') {
      return [{ number: 1, due_date: startDate, amount: total }];
    }
    return calculateInstallments({
      total,
      numInstallments,
      frequency,
      startDate,
      initialPayment: initialPayment ? parseFloat(initialPayment) : undefined,
    });
  }, [paymentTerms, total, numInstallments, frequency, startDate, initialPayment]);

  const sumOfInstallments = installments.reduce((s, i) => s + i.amount, 0);
  const isExact = Math.abs(sumOfInstallments - total) < 0.01;

  // Validacion
  const initialNum = initialPayment ? parseFloat(initialPayment) : 0;
  const initialValid =
    !initialPayment || (initialNum > 0 && initialNum < total);

  const canSubmit =
    isExact &&
    initialValid &&
    startDate.length > 0 &&
    (paymentTerms === 'full' || numInstallments >= 1);

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Revisa los datos antes de continuar');
      return;
    }

    startTransition(async () => {
      const res = await acceptQuotationAndCreatePlan({
        quotation_id: quotationId,
        payment_terms: paymentTerms,
        num_installments: paymentTerms === 'installments' ? numInstallments : undefined,
        installment_frequency: paymentTerms === 'installments' ? frequency : undefined,
        start_date: startDate,
        initial_payment: initialPayment ? parseFloat(initialPayment) : null,
        payment_method: paymentMethod,
        notes: notes || null,
      });

      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }

      toast.success('Plan de tratamiento creado con ' + res.schedules_count + ' cuotas');
      router.push('/dental/treatments/' + res.plan_id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Resumen superior */}
      <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-bold text-slate-900">
                {quotationNumber || 'Cotizacion'}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-700 font-medium">{title}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-600">
              <User className="h-3 w-3" />
              {patientName}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Total a financiar
            </p>
            <p className="text-3xl font-bold text-emerald-700 tabular-nums">
              {formatMoney(total)}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3 text-xs font-semibold">
          <StepLabel n={1} active={step === 1} done={step > 1} label="Forma de pago" />
          <ChevronDivider />
          <StepLabel n={2} active={step === 2} done={step > 2} label="Detalles" />
          <ChevronDivider />
          <StepLabel n={3} active={step === 3} done={false} label="Confirmar" />
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all"
            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
          />
        </div>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <Section
            title="¿Como pagara el paciente?"
            icon={<CreditCard className="h-4 w-4 text-blue-600" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PaymentTermsCard
                active={paymentTerms === 'full'}
                onClick={() => setPaymentTerms('full')}
                icon={<Banknote className="h-6 w-6" />}
                title="Pago unico"
                subtitle="El paciente paga el total de una vez"
                hint={'Total: ' + formatMoney(total)}
              />
              <PaymentTermsCard
                active={paymentTerms === 'installments'}
                onClick={() => setPaymentTerms('installments')}
                icon={<Wallet className="h-6 w-6" />}
                title="Pago en cuotas"
                subtitle="Dividir el monto en pagos periodicos"
                hint="Recomendado para tratamientos grandes"
                recommended
              />
            </div>
          </Section>

          <div className="flex justify-end gap-2">
            <Link
              href={'/dental/quotations/' + quotationId}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          {paymentTerms === 'installments' ? (
            <Section
              title="Configurar cuotas"
              icon={<Calendar className="h-4 w-4 text-violet-600" />}
            >
              <Grid2>
                <Field label="Numero de cuotas" required>
                  <select
                    value={numInstallments}
                    onChange={(e) => setNumInstallments(parseInt(e.target.value))}
                    className="form-input"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12,15,18,24,30,36].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'cuota' : 'cuotas'}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Frecuencia" required>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as InstallmentFrequency)}
                    className="form-input"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                  </select>
                </Field>
                <Field label="Fecha de la primera cuota" required>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                  />
                </Field>
                <Field label="Cuota inicial diferenciada (opcional)">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      Q
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={total}
                      value={initialPayment}
                      onChange={(e) => setInitialPayment(e.target.value)}
                      placeholder="Ej: enganche"
                      className="form-input pl-7"
                    />
                  </div>
                </Field>
              </Grid2>
            </Section>
          ) : (
            <Section
              title="Detalle de pago unico"
              icon={<Banknote className="h-4 w-4 text-emerald-600" />}
            >
              <Field label="Fecha del pago" required>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                />
              </Field>
            </Section>
          )}

          <Section
            title="Metodo de pago preferido"
            icon={<Receipt className="h-4 w-4 text-amber-600" />}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['cash', 'card', 'transfer', 'mixed'] as PaymentMethod[]).map((m) => (
                <PaymentMethodChip
                  key={m}
                  active={paymentMethod === m}
                  onClick={() => setPaymentMethod(m)}
                  label={paymentMethodLabel(m)}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-500">Puedes cambiar el metodo en cada pago individual mas tarde.</p>
          </Section>

          <Section
            title="Notas (opcional)"
            icon={<Info className="h-4 w-4 text-slate-600" />}
          >
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Acuerdos especiales con el paciente, observaciones internas..."
              className="form-input"
            />
          </Section>

          {/* Vista previa cuotas */}
          {paymentTerms === 'installments' && (
            <Section
              title={'Vista previa de cuotas (' + installments.length + ')'}
              icon={<Calendar className="h-4 w-4 text-emerald-600" />}
            >
              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      <th className="px-3 py-2 text-left">Cuota</th>
                      <th className="px-3 py-2 text-left">Fecha de vencimiento</th>
                      <th className="px-3 py-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {installments.map((inst) => (
                      <tr key={inst.number} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-slate-700 tabular-nums">
                          #{inst.number}
                          {inst.number === 1 && initialPayment && parseFloat(initialPayment) > 0 && (
                            <span className="ml-1 text-[9px] font-bold text-amber-700 bg-amber-100 rounded px-1">
                              INICIAL
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{formatDate(inst.due_date)}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
                          {formatMoney(inst.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-emerald-50 border-t-2 border-emerald-300">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-right font-bold text-slate-900">
                        TOTAL
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-emerald-700 tabular-nums">
                        {formatMoney(sumOfInstallments)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {!isExact && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    La suma de cuotas ({formatMoney(sumOfInstallments)}) no coincide con el total ({formatMoney(total)}).
                  </span>
                </div>
              )}
              {!initialValid && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>La cuota inicial debe ser mayor a 0 y menor al total.</span>
                </div>
              )}
            </Section>
          )}

          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Atras
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Revisar y confirmar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 - Confirmar */}
      {step === 3 && (
        <div className="space-y-4">
          <Section
            title="Resumen del plan"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          >
            <SummaryRow label="Cotizacion" value={quotationNumber || '-'} />
            <SummaryRow label="Paciente" value={patientName} />
            <SummaryRow label="Concepto" value={title} />
            <SummaryRow label="Total a financiar" value={formatMoney(total)} highlight />
            <SummaryRow
              label="Forma de pago"
              value={paymentTerms === 'full' ? 'Pago unico' : 'Pago en cuotas'}
            />
            {paymentTerms === 'installments' && (
              <>
                <SummaryRow
                  label="Numero de cuotas"
                  value={installments.length + ' cuotas'}
                />
                <SummaryRow
                  label="Frecuencia"
                  value={frequencyLabel(frequency)}
                />
                <SummaryRow
                  label="Primera cuota"
                  value={formatDate(startDate)}
                />
                {installments.length > 1 && (
                  <SummaryRow
                    label="Ultima cuota"
                    value={formatDate(installments[installments.length - 1].due_date)}
                  />
                )}
                {initialPayment && parseFloat(initialPayment) > 0 && (
                  <SummaryRow
                    label="Cuota inicial"
                    value={formatMoney(parseFloat(initialPayment))}
                  />
                )}
              </>
            )}
            <SummaryRow
              label="Metodo de pago"
              value={paymentMethodLabel(paymentMethod)}
            />
          </Section>

          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-start gap-2 text-xs text-blue-900">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">¿Que pasara al confirmar?</p>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>La cotizacion se marcara como ACEPTADA</li>
                <li>Se creara un plan de tratamiento activo</li>
                <li>
                  Se generaran {installments.length}{' '}
                  {installments.length === 1 ? 'cuota' : 'cuotas'} con sus fechas de vencimiento
                </li>
                <li>Podras registrar pagos contra cada cuota individual</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Editar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md"
            >
              <Save className="h-4 w-4" />
              {isPending ? 'Creando plan...' : 'Confirmar y crear plan'}
            </button>
          </div>
        </div>
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

// ─── Subcomponentes ───────────────────────────────────────
function StepLabel({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string; }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ' + (done ? 'bg-emerald-600 text-white' : active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500')}
      >
        {done ? <CheckCircle2 className="h-3 w-3" /> : n}
      </span>
      <span className={active || done ? 'text-emerald-700' : 'text-slate-400'}>{label}</span>
    </div>
  );
}

function ChevronDivider() {
  return <span className="flex-1 h-px bg-slate-200" />;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode; }) {
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode; }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function PaymentTermsCard({ active, onClick, icon, title, subtitle, hint, recommended }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string; hint: string; recommended?: boolean; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={'relative text-left rounded-2xl border-2 p-4 transition ' + (active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300')}
    >
      {recommended && (
        <span className="absolute top-2 right-2 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
          POPULAR
        </span>
      )}
      <div className={'inline-flex h-10 w-10 items-center justify-center rounded-xl ' + (active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600')}>
        {icon}
      </div>
      <p className="mt-2 text-base font-bold text-slate-900">{title}</p>
      <p className="mt-0.5 text-xs text-slate-600">{subtitle}</p>
      <p className="mt-2 text-[11px] font-semibold text-emerald-700">{hint}</p>
    </button>
  );
}

function PaymentMethodChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={'rounded-xl border px-3 py-2 text-xs font-semibold transition ' + (active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50')}
    >
      {label}
    </button>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean; }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-50 last:border-b-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={(highlight ? 'text-base font-bold text-emerald-700' : 'text-sm font-medium text-slate-900') + ' tabular-nums text-right'}>
        {value}
      </span>
    </div>
  );
}

function paymentMethodLabel(m: PaymentMethod): string {
  if (m === 'cash') return 'Efectivo';
  if (m === 'card') return 'Tarjeta';
  if (m === 'transfer') return 'Transferencia';
  return 'Mixto';
}

function formatMoney(n: number): string {
  return 'Q' + n.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(s: string): string {
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
