'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle2,
  Calendar,
  Receipt,
  Phone,
  Mail,
  User,
  DollarSign,
  Clock,
  CircleDollarSign,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  XCircle,
} from 'lucide-react';
import {
  PLAN_STATUS_CONFIG,
  SCHEDULE_STATUS_CONFIG,
  type TreatmentPlan,
  type PaymentSchedule,
  type ScheduleStatus,
  type TreatmentPlanStatus,
} from '@/lib/types/treatment-plan';
import { paymentMethodLabel, type Payment } from '@/lib/types/payment';
import { RegisterPaymentModal } from './register-payment-modal';

type PlanWithPatient = TreatmentPlan & {
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
    document_number: string | null;
  } | null;
};

type Props = {
  plan: PlanWithPatient;
  schedules: PaymentSchedule[];
  payments: Payment[];
  tenantName: string;
};

export function TreatmentPlanDetail({ plan, schedules, payments, tenantName }: Props) {
  const router = useRouter();
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null);

  const patient = plan.patients;
  const planCfg = PLAN_STATUS_CONFIG[plan.status as TreatmentPlanStatus] || PLAN_STATUS_CONFIG.active;

  const total = Number(plan.final_amount || 0);
  const paid = Number(plan.paid_amount || 0);
  const pending = Math.max(0, total - paid);
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  // Cuotas pendientes ordenadas
  const pendingSchedules = schedules.filter(
    (s) => s.status === 'pending' || s.status === 'partial' || s.status === 'overdue'
  );
  const nextSchedule = pendingSchedules[0] || null;

  // Pagos validos (no anulados)
  const validPayments = payments.filter((p) => p.status === 'paid');

  const handleWhatsApp = () => {
    if (!patient?.phone) {
      toast.error('El paciente no tiene telefono registrado');
      return;
    }
    const phone = patient.phone.replace(/\D/g, '');
    const lines = [
      'Hola ' + patient.first_name + ', te comparto el estado de tu plan de tratamiento:',
      '',
      'Plan: ' + plan.title,
      'Total: ' + formatMoney(total),
      'Pagado: ' + formatMoney(paid),
      'Saldo: ' + formatMoney(pending),
      '',
    ];
    if (nextSchedule) {
      const remaining = Number(nextSchedule.amount) - Number(nextSchedule.amount_paid || 0);
      lines.push('Proxima cuota: ' + formatDate(nextSchedule.due_date) + ' por ' + formatMoney(remaining));
    }
    lines.push('Cualquier consulta estoy a tus ordenes.');
    const msg = encodeURIComponent(lines.join('\n'));
    window.open('https://wa.me/' + phone + '?text=' + msg, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePaymentSuccess = (receiptNumber: string) => {
    toast.success('Pago registrado Â· Recibo ' + receiptNumber);
    setSelectedSchedule(null);
    router.refresh();
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto print:max-w-none">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/dental/treatments"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </button>
          {patient?.phone && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Send className="h-3.5 w-3.5" />
              Estado de cuenta WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Header del plan */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 sm:px-7 py-5 border-b-2 border-emerald-600">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                {tenantName}
              </p>
              <h1 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900">
                {plan.title}
              </h1>
              {plan.description && (
                <p className="mt-1 text-sm text-slate-600">{plan.description}</p>
              )}
            </div>
            <span className={'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shrink-0 ' + planCfg.bg + ' ' + planCfg.color + ' ' + planCfg.border}>
              {plan.status === 'completed' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
              {planCfg.label}
            </span>
          </div>
        </div>

        {/* Datos paciente */}
        {patient && (
          <div className="px-5 sm:px-7 py-4 bg-slate-50/50 border-b border-slate-200">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
              <User className="h-3 w-3" />
              Paciente
            </h3>
            <p className="font-bold text-slate-900">
              {patient.first_name} {patient.last_name}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-600">
              {patient.document_number && <span>DPI: {patient.document_number}</span>}
              {patient.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {patient.phone}
                </span>
              )}
              {patient.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {patient.email}
                </span>
              )}
            </div>
          </div>
        )}

        {/* KPIs financieros */}
        <div className="px-5 sm:px-7 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiBox
              label="Total"
              value={formatMoney(total)}
              icon={<DollarSign className="h-4 w-4" />}
              color="slate"
            />
            <KpiBox
              label="Pagado"
              value={formatMoney(paid)}
              sub={progress + '%'}
              icon={<CheckCircle2 className="h-4 w-4" />}
              color="emerald"
            />
            <KpiBox
              label="Pendiente"
              value={formatMoney(pending)}
              icon={<Clock className="h-4 w-4" />}
              color="amber"
            />
            <KpiBox
              label="Cuotas"
              value={(plan.num_installments || 1).toString()}
              sub={pendingSchedules.length + ' pendientes'}
              icon={<Calendar className="h-4 w-4" />}
              color="blue"
            />
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-slate-600">Progreso de pago</span>
              <span className="text-xs font-bold text-emerald-700 tabular-nums">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                style={{ width: progress + '%' }}
              />
            </div>
          </div>

          {/* Proxima cuota destacada */}
          {nextSchedule && plan.status === 'active' && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-900">
                    Proxima cuota #{nextSchedule.installment_number}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Vence: {formatDate(nextSchedule.due_date)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchedule(nextSchedule)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shrink-0 print:hidden"
              >
                <CircleDollarSign className="h-3.5 w-3.5" />
                Registrar pago
              </button>
            </div>
          )}

          {/* Plan completado */}
          {plan.status === 'completed' && (
            <div className="mt-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-bold text-emerald-900">Plan completado Â· Todas las cuotas pagadas</p>
            </div>
          )}
        </div>
      </div>

      {/* Cronograma de cuotas */}
      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 sm:px-7 py-3 border-b border-slate-100 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-violet-600" />
          <h2 className="text-sm font-bold text-slate-900">Cronograma de cuotas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="px-3 py-2 text-left w-12">#</th>
                <th className="px-3 py-2 text-left">Vencimiento</th>
                <th className="px-3 py-2 text-right">Monto</th>
                <th className="px-3 py-2 text-right hidden sm:table-cell">Pagado</th>
                <th className="px-3 py-2 text-center">Estado</th>
                <th className="px-3 py-2 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedules.map((s) => <ScheduleRow key={s.id} schedule={s} onPay={() => setSelectedSchedule(s)} />)}
            </tbody>
          </table>
        </div>
      </section>

      {/* Historial de pagos */}
      {validPayments.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 sm:px-7 py-3 border-b border-slate-100 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Historial de pagos ({validPayments.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-3 py-2 text-left">Recibo</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left hidden sm:table-cell">Metodo</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                  <th className="px-3 py-2 text-left hidden md:table-cell">Referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {validPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-bold text-emerald-700 tabular-nums">
                      <Link
                        href={'/dental/payments/' + p.id}
                        className="hover:underline inline-flex items-center gap-1"
                      >
                        {p.receipt_number || '-'}
                        <Receipt className="h-3 w-3" />
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {p.paid_at ? formatDateTime(p.paid_at) : '-'}
                    </td>
                    <td className="px-3 py-2 text-slate-700 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <CreditCard className="h-3 w-3" />
                        {paymentMethodLabel(p.payment_method)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
                      {formatMoney(p.amount)}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 hidden md:table-cell">
                      {p.reference_number || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal registrar pago */}
      {selectedSchedule && (
        <RegisterPaymentModal
          treatmentPlanId={plan.id}
          schedule={selectedSchedule}
          patientName={patient ? patient.first_name + ' ' + patient.last_name : 'Paciente'}
          onClose={() => setSelectedSchedule(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

// â”€â”€â”€ ScheduleRow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ScheduleRow({ schedule, onPay }: { schedule: PaymentSchedule; onPay: () => void; }) {
  const cfg = SCHEDULE_STATUS_CONFIG[schedule.status as ScheduleStatus] || SCHEDULE_STATUS_CONFIG.pending;
  const remaining = Number(schedule.amount) - Number(schedule.amount_paid || 0);
  const isOverdue = schedule.status === 'pending' && new Date(schedule.due_date + 'T23:59:59') < new Date();
  const canPay = schedule.status === 'pending' || schedule.status === 'partial' || schedule.status === 'overdue';

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-3 py-2 text-slate-700 tabular-nums font-semibold">#{schedule.installment_number}</td>
      <td className="px-3 py-2">
        <div className="text-slate-700">{formatDate(schedule.due_date)}</div>
        {isOverdue && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700">
            <AlertTriangle className="h-3 w-3" />
            Vencida
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums">
        {formatMoney(schedule.amount)}
      </td>
      <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell">
        <span className={(schedule.amount_paid && schedule.amount_paid > 0) ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
          {formatMoney(schedule.amount_paid || 0)}
        </span>
      </td>
      <td className="px-3 py-2 text-center">
        <span className={'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ' + cfg.bg + ' ' + cfg.color + ' ' + cfg.border}>
          {cfg.label}
        </span>
      </td>
      <td className="px-3 py-2 print:hidden">
        {canPay ? (
          <button
            type="button"
            onClick={onPay}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 whitespace-nowrap"
          >
            <CircleDollarSign className="h-3 w-3" />
            <span className="hidden sm:inline">Pagar</span>
            <span className="sm:hidden">{formatMoney(remaining)}</span>
          </button>
        ) : schedule.status === 'paid' ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
        ) : (
          <XCircle className="h-4 w-4 text-slate-400 mx-auto" />
        )}
      </td>
    </tr>
  );
}

// â”€â”€â”€ KpiBox â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function KpiBox({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: 'slate' | 'emerald' | 'amber' | 'blue'; }) {
  const cls = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  }[color];

  return (
    <div className={'rounded-xl border p-3 ' + cls}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">{label}</span>
        {icon}
      </div>
      <p className="mt-1 text-base sm:text-lg font-bold tabular-nums">{value}</p>
      {sub && <p className="text-[10px] opacity-70">{sub}</p>}
    </div>
  );
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function formatMoney(n: number | null | undefined): string {
  return 'Q' + (Number(n) || 0).toLocaleString('es-GT', {
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

function formatDateTime(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
