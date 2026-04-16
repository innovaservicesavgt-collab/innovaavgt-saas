'use client';

import { Bell, CreditCard } from 'lucide-react';

interface Props {
  summary: {
    accumulatedBalance: number;
    overdueBalance: number;
    currentBalance: number;
    nextDueDate: string | null;
    totalPaid: number;
    pendingBalance: number;
    riskLevel: 'low' | 'medium' | 'high';
    currency: string;
  };
  onRegisterPayment: () => void;
  onSendReminder: () => void;
}

export function FinancialSummaryCard({ summary, onRegisterPayment, onSendReminder }: Props) {
  const { accumulatedBalance, overdueBalance, currentBalance, nextDueDate, totalPaid, pendingBalance, riskLevel, currency } = summary;

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date + 'T12:00:00').toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const riskConfig = {
    high: { label: 'Alto', color: 'text-rose-600', dot: 'bg-rose-500' },
    medium: { label: 'Medio', color: 'text-amber-600', dot: 'bg-amber-500' },
    low: { label: 'Bajo', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  };
  const risk = riskConfig[riskLevel];

  const total = overdueBalance + currentBalance;
  const overduePct = total > 0 ? (overdueBalance / total) : 0.5;
  const radius = 60;
  const circumference = Math.PI * radius;
  const overdueLen = overduePct * circumference;
  const currentLen = circumference - overdueLen;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">Resumen financiero</h2>
      </div>

      <div className="p-6 space-y-5">
        {/* Donut + saldo */}
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 140 80" className="h-16 w-28 flex-shrink-0">
            <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="#f97316" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${overdueLen} ${circumference}`} />
            <path d="M 10 70 A 60 60 0 0 1 130 70" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${currentLen} ${circumference}`} strokeDashoffset={`-${overdueLen}`} />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Saldo acumulado</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{currency} {accumulatedBalance.toFixed(0)}</p>
          </div>
        </div>

        {/* Saldo vencido / al día */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-sm text-slate-600">Saldo vencido</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">{currency} {overdueBalance.toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-600">Saldo al día</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">{currency} {currentBalance.toFixed(0)}</span>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Próximo cobro</span>
            <span className="text-sm font-semibold text-slate-900">{formatDate(nextDueDate)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Total pagado</span>
            <span className="text-sm font-semibold text-slate-900">{currency} {totalPaid.toFixed(0)}</span>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Saldo pendiente</span>
            <span className="text-base font-bold text-slate-900">{currency} {pendingBalance.toFixed(0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Nivel de riesgo</span>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${risk.dot}`} />
              <span className={`text-sm font-semibold ${risk.color}`}>{risk.label}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={onRegisterPayment}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <CreditCard className="h-4 w-4" />
            Registrar pago
          </button>
          <button
            type="button"
            onClick={onSendReminder}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Bell className="h-4 w-4" />
            Enviar recordatorio
          </button>
        </div>
      </div>
    </section>
  );
}
