'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  X,
  CircleDollarSign,
  Calendar,
  Hash,
  StickyNote,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { registerPayment } from '@/server/actions/payments';
import type { PaymentSchedule } from '@/lib/types/treatment-plan';

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed';

type Props = {
  treatmentPlanId: string;
  schedule: PaymentSchedule;
  patientName: string;
  onClose: () => void;
  onSuccess: (receiptNumber: string) => void;
};

export function RegisterPaymentModal({
  treatmentPlanId,
  schedule,
  patientName,
  onClose,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const remaining = Number(schedule.amount) - Number(schedule.amount_paid || 0);

  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const numAmount = parseFloat(amount) || 0;
  const isFullPayment = Math.abs(numAmount - remaining) < 0.01;
  const isPartialPayment = numAmount > 0 && numAmount < remaining - 0.01;
  const isInvalid = numAmount <= 0 || numAmount > remaining + 0.01;

  const handleSubmit = () => {
    if (isInvalid) {
      toast.error('El monto debe ser mayor a 0 y menor o igual a Q' + remaining.toFixed(2));
      return;
    }

    startTransition(async () => {
      const res = await registerPayment({
        treatment_plan_id: treatmentPlanId,
        payment_schedule_id: schedule.id,
        amount: numAmount,
        payment_method: paymentMethod,
        paid_at: paidAt,
        reference_number: referenceNumber || null,
        notes: notes || null,
      });

      if (!res.ok) {
        toast.error(res.error || 'Error al registrar pago');
        return;
      }

      onSuccess(res.receipt_number || '');
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-emerald-50">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900">
              Registrar pago
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 truncate">
              Cuota #{schedule.installment_number} · {patientName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg p-2 text-slate-400 hover:bg-white shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Info de la cuota */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Monto programado</span>
              <span className="font-bold text-slate-900 tabular-nums">
                Q{Number(schedule.amount).toFixed(2)}
              </span>
            </div>
            {Number(schedule.amount_paid || 0) > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-emerald-700">Ya pagado</span>
                <span className="font-semibold text-emerald-700 tabular-nums">
                  -Q{Number(schedule.amount_paid).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200">
              <span className="font-bold text-slate-900">Saldo a pagar</span>
              <span className="font-bold text-emerald-700 tabular-nums">
                Q{remaining.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Monto */}
          <Field label="Monto a pagar" required icon={<CircleDollarSign className="h-3 w-3" />}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                Q
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remaining}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 pl-7 pr-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            {/* Atajos */}
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              <button
                type="button"
                onClick={() => setAmount(remaining.toFixed(2))}
                className="text-[10px] rounded-full border border-slate-300 bg-white px-2 py-0.5 hover:bg-slate-50"
              >
                Pago total (Q{remaining.toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => setAmount((remaining / 2).toFixed(2))}
                className="text-[10px] rounded-full border border-slate-300 bg-white px-2 py-0.5 hover:bg-slate-50"
              >
                50%
              </button>
            </div>
            {/* Indicador */}
            {isFullPayment && (
              <p className="mt-1 text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3 w-3" />
                Pago total · La cuota quedara saldada
              </p>
            )}
            {isPartialPayment && (
              <p className="mt-1 text-[11px] text-amber-700 flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3 w-3" />
                Pago parcial · Queda saldo de Q{(remaining - numAmount).toFixed(2)}
              </p>
            )}
            {isInvalid && numAmount > 0 && (
              <p className="mt-1 text-[11px] text-rose-700 flex items-center gap-1 font-semibold">
                <AlertCircle className="h-3 w-3" />
                El monto excede el saldo de la cuota
              </p>
            )}
          </Field>

          {/* Metodo */}
          <Field label="Metodo de pago" required>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['cash', 'card', 'transfer', 'mixed'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={'rounded-lg border px-2 py-1.5 text-xs font-semibold transition ' + (paymentMethod === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50')}
                >
                  {paymentMethodLabel(m)}
                </button>
              ))}
            </div>
          </Field>

          {/* Fecha */}
          <Field label="Fecha del pago" required icon={<Calendar className="h-3 w-3" />}>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </Field>

          {/* Referencia */}
          <Field label="Numero de referencia (opcional)" icon={<Hash className="h-3 w-3" />}>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Ej: numero de transaccion, voucher, etc"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </Field>

          {/* Notas */}
          <Field label="Notas (opcional)" icon={<StickyNote className="h-3 w-3" />}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observaciones del pago..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || isInvalid}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
          >
            <CircleDollarSign className="h-4 w-4" />
            {isPending ? 'Registrando...' : 'Registrar pago'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponentes ──────────────────────────────────────
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

function paymentMethodLabel(m: PaymentMethod): string {
  if (m === 'cash') return 'Efectivo';
  if (m === 'card') return 'Tarjeta';
  if (m === 'transfer') return 'Transferencia';
  return 'Mixto';
}
