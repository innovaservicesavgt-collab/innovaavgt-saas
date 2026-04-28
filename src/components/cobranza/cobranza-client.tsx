'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  Receipt,
  Send,
  Calendar,
  Trophy,
  Phone,
  CircleDollarSign,
  Banknote,
  CreditCard,
  Smartphone,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

type PaymentRow = {
  id: string;
  amount: number;
  payment_method: string | null;
  paid_at: string | null;
  receipt_number: string | null;
  patient_id: string;
  patients: { first_name: string; last_name: string } | null;
};

type ScheduleRow = {
  id: string;
  treatment_plan_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  amount_paid: number | null;
  status: string;
  treatment_plans: {
    id: string;
    title: string;
    patient_id: string;
    status: string;
    patients: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string | null;
    } | null;
  } | null;
};

type Debtor = {
  patient_id: string;
  patient_name: string;
  phone: string | null;
  total_pending: number;
  schedules_count: number;
};

type Props = {
  paymentsToday: PaymentRow[];
  totalToday: number;
  totalMonth: number;
  totalPending: number;
  overdueSchedules: ScheduleRow[];
  upcomingSchedules: ScheduleRow[];
  topDebtors: Debtor[];
  tenantName: string;
};

export function CobranzaClient({
  paymentsToday,
  totalToday,
  totalMonth,
  totalPending,
  overdueSchedules,
  upcomingSchedules,
  topDebtors,
  tenantName,
}: Props) {
  const topDebtorAmount = topDebtors[0]?.total_pending || 0;

  const handleShareDailyClose = () => {
    const today = new Date().toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const lines = [
      '*' + tenantName + '*',
      'Cierre del dia: ' + today,
      '',
      'Pagos recibidos: ' + paymentsToday.length,
      'Total cobrado: ' + formatMoney(totalToday),
      '',
    ];
    if (paymentsToday.length > 0) {
      lines.push('Detalle:');
      paymentsToday.forEach((p) => {
        const name = p.patients ? p.patients.first_name + ' ' + p.patients.last_name : 'Sin paciente';
        const time = p.paid_at ? new Date(p.paid_at).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '';
        lines.push(`- ${time} ${name} ${formatMoney(p.amount)} (${methodLabel(p.payment_method)})`);
      });
    }
    const text = encodeURIComponent(lines.join('\n'));
    window.open('https://wa.me/?text=' + text, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Dashboard de cobranza
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Estado financiero de tratamientos en curso
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          {new Date().toLocaleDateString('es-GT', { weekday: 'long', day: '2-digit', month: 'long' })}
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          label="Cobrado del mes"
          value={formatMoney(totalMonth)}
          icon={<TrendingUp className="h-4 w-4" />}
          color="emerald"
          big
        />
        <Kpi
          label="Por cobrar"
          value={formatMoney(totalPending)}
          sub="Saldos pendientes"
          icon={<DollarSign className="h-4 w-4" />}
          color="violet"
          big
        />
        <Kpi
          label="Cuotas vencidas"
          value={overdueSchedules.length.toString()}
          sub={overdueSchedules.length > 0 ? 'Requieren atencion' : 'Todas al dia'}
          icon={<AlertTriangle className="h-4 w-4" />}
          color={overdueSchedules.length > 0 ? 'rose' : 'emerald'}
        />
        <Kpi
          label="Top deudor"
          value={formatMoney(topDebtorAmount)}
          sub={topDebtors[0]?.patient_name || 'Sin deudores'}
          icon={<Trophy className="h-4 w-4" />}
          color="amber"
        />
      </div>

      {/* Caja diaria */}
      <Section
        title="Caja del dia"
        icon={<Receipt className="h-4 w-4 text-emerald-600" />}
        subtitle={paymentsToday.length + ' pagos hoy · Total ' + formatMoney(totalToday)}
        action={paymentsToday.length > 0 && (
          <button
            type="button"
            onClick={handleShareDailyClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Send className="h-3.5 w-3.5" />
            Compartir cierre
          </button>
        )}
      >
        {paymentsToday.length === 0 ? (
          <EmptyMini icon={<Receipt className="h-6 w-6 text-slate-300" />} text="Aun no hay pagos hoy" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase text-slate-500 border-b border-slate-100">
                  <th className="text-left py-2">Hora</th>
                  <th className="text-left py-2">Paciente</th>
                  <th className="text-left py-2 hidden sm:table-cell">Recibo</th>
                  <th className="text-left py-2 hidden md:table-cell">Metodo</th>
                  <th className="text-right py-2">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentsToday.map((p) => {
                  const name = p.patients ? p.patients.first_name + ' ' + p.patients.last_name : 'Sin paciente';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2 text-xs text-slate-500 tabular-nums">
                        {p.paid_at ? formatTime(p.paid_at) : '-'}
                      </td>
                      <td className="py-2 text-slate-900 font-medium">{name}</td>
                      <td className="py-2 text-xs text-emerald-700 font-bold tabular-nums hidden sm:table-cell">
                        {p.receipt_number || '-'}
                      </td>
                      <td className="py-2 hidden md:table-cell">
                        <MethodBadge method={p.payment_method} />
                      </td>
                      <td className="py-2 text-right font-bold tabular-nums">
                        {formatMoney(p.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-emerald-50 border-t-2 border-emerald-300">
                <tr>
                  <td colSpan={4} className="py-2 text-right text-sm font-bold text-slate-900">
                    Total del dia
                  </td>
                  <td className="py-2 text-right text-base font-bold text-emerald-700 tabular-nums">
                    {formatMoney(totalToday)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Section>

      {/* Cuotas vencidas */}
      <Section
        title="Cuotas vencidas"
        icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
        subtitle={overdueSchedules.length === 0 ? 'Todas las cuotas estan al dia' : overdueSchedules.length + ' cuotas requieren atencion'}
        accent="rose"
      >
        {overdueSchedules.length === 0 ? (
          <EmptyMini
            icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
            text="No hay cuotas vencidas"
            color="emerald"
          />
        ) : (
          <div className="space-y-2">
            {overdueSchedules.slice(0, 10).map((s) => (
              <ScheduleAlertCard key={s.id} schedule={s} type="overdue" />
            ))}
            {overdueSchedules.length > 10 && (
              <p className="text-xs text-slate-500 text-center pt-2">
                Mostrando 10 de {overdueSchedules.length}. Ve al detalle de cada plan para gestionar el resto.
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Proximas a vencer */}
      <Section
        title="Proximas a vencer (7 dias)"
        icon={<Clock className="h-4 w-4 text-amber-600" />}
        subtitle={upcomingSchedules.length + ' cuotas vencen en los proximos 7 dias'}
        accent="amber"
      >
        {upcomingSchedules.length === 0 ? (
          <EmptyMini icon={<Clock className="h-6 w-6 text-slate-300" />} text="Ninguna cuota proxima a vencer" />
        ) : (
          <div className="space-y-2">
            {upcomingSchedules.slice(0, 10).map((s) => (
              <ScheduleAlertCard key={s.id} schedule={s} type="upcoming" />
            ))}
            {upcomingSchedules.length > 10 && (
              <p className="text-xs text-slate-500 text-center pt-2">
                Mostrando 10 de {upcomingSchedules.length}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Top deudores */}
      <Section
        title="Top deudores"
        icon={<Trophy className="h-4 w-4 text-violet-600" />}
        subtitle={topDebtors.length + ' pacientes con saldos pendientes'}
      >
        {topDebtors.length === 0 ? (
          <EmptyMini icon={<Trophy className="h-6 w-6 text-slate-300" />} text="Sin deudores activos" />
        ) : (
          <div className="space-y-1">
            {topDebtors.map((d, idx) => (
              <div
                key={d.patient_id}
                className="flex items-center justify-between gap-3 rounded-lg p-2.5 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ' + (idx === 0 ? 'bg-amber-100 text-amber-700' : idx < 3 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-500')}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{d.patient_name}</p>
                    <p className="text-xs text-slate-500">
                      {d.schedules_count} {d.schedules_count === 1 ? 'cuota pendiente' : 'cuotas pendientes'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-bold text-amber-700 tabular-nums">
                    {formatMoney(d.total_pending)}
                  </span>
                  {d.phone && (
                    <a
                      href={'https://wa.me/' + d.phone.replace(/\D/g, '') + '?text=' + encodeURIComponent('Hola ' + d.patient_name.split(' ')[0] + ', te recordamos que tienes un saldo pendiente en tu plan de tratamiento de ' + formatMoney(d.total_pending) + '. Pasa con nosotros para ponerte al dia o avisanos si necesitas ayuda.')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                    >
                      <Send className="h-3 w-3" />
                      WA
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

// ─── ScheduleAlertCard ───────────────────────────────────
function ScheduleAlertCard({ schedule, type }: { schedule: ScheduleRow; type: 'overdue' | 'upcoming'; }) {
  const plan = schedule.treatment_plans;
  const patient = plan?.patients;
  const remaining = Number(schedule.amount) - Number(schedule.amount_paid || 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(schedule.due_date + 'T00:00:00');
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const dayLabel = type === 'overdue'
    ? Math.abs(diffDays) + ' dias vencida'
    : diffDays === 0
    ? 'Vence hoy'
    : diffDays === 1
    ? 'Vence manana'
    : 'Vence en ' + diffDays + ' dias';

  const cardCls = type === 'overdue'
    ? 'border-rose-200 bg-rose-50'
    : 'border-amber-200 bg-amber-50';

  const labelCls = type === 'overdue'
    ? 'text-rose-900'
    : 'text-amber-900';

  const phone = patient?.phone || null;
  const patientName = patient ? patient.first_name + ' ' + patient.last_name : 'Sin paciente';

  const waMessage = type === 'overdue'
    ? encodeURIComponent('Hola ' + (patient?.first_name || '') + ', tu cuota #' + schedule.installment_number + ' del plan "' + (plan?.title || '') + '" venció el ' + formatDate(schedule.due_date) + '. Saldo: ' + formatMoney(remaining) + '. Por favor avisanos cuando puedas pasar al pago.')
    : encodeURIComponent('Hola ' + (patient?.first_name || '') + ', te recordamos que tu cuota #' + schedule.installment_number + ' del plan "' + (plan?.title || '') + '" vence ' + (diffDays === 0 ? 'HOY' : 'el ' + formatDate(schedule.due_date)) + '. Monto: ' + formatMoney(remaining) + '. Te esperamos.');

  return (
    <div className={'rounded-xl border p-3 ' + cardCls}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900 truncate">{patientName}</p>
          <p className="text-xs text-slate-600 truncate">
            {plan?.title || 'Sin plan'} · Cuota #{schedule.installment_number}
          </p>
          <div className={'text-[11px] font-bold mt-1 ' + labelCls}>
            {dayLabel} · {formatDate(schedule.due_date)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-slate-900 tabular-nums">
            {formatMoney(remaining)}
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {plan && (
          <Link
            href={'/dental/treatments/' + plan.id}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
          >
            <CircleDollarSign className="h-3 w-3" />
            Cobrar
          </Link>
        )}
        {phone && (
          <a
            href={'https://wa.me/' + phone.replace(/\D/g, '') + '?text=' + waMessage}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
          >
            <Send className="h-3 w-3" />
            {type === 'overdue' ? 'Cobrar por WA' : 'Recordatorio WA'}
          </a>
        )}
        {phone && (
          <a
            href={'tel:' + phone}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-50"
          >
            <Phone className="h-3 w-3" />
            Llamar
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Subcomponentes ──────────────────────────────────────
function Section({
  title,
  subtitle,
  icon,
  action,
  accent,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  accent?: 'rose' | 'amber';
  children: React.ReactNode;
}) {
  const headerCls = accent === 'rose' ? 'bg-rose-50 border-rose-200' : accent === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100';

  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className={'flex items-center justify-between gap-2 px-5 py-3 border-b ' + headerCls}>
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function EmptyMini({ icon, text, color }: { icon: React.ReactNode; text: string; color?: 'emerald'; }) {
  return (
    <div className="py-6 text-center">
      <div className="flex justify-center">{icon}</div>
      <p className={'mt-2 text-sm ' + (color === 'emerald' ? 'text-emerald-700 font-bold' : 'text-slate-500')}>
        {text}
      </p>
    </div>
  );
}

function Kpi({ label, value, sub, icon, color, big }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: 'emerald' | 'amber' | 'violet' | 'rose'; big?: boolean; }) {
  const cls = {
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  }[color];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span className={'flex h-7 w-7 items-center justify-center rounded-lg ring-1 ' + cls}>
          {icon}
        </span>
      </div>
      <div className={'mt-2 font-bold text-slate-900 tabular-nums ' + (big ? 'text-2xl' : 'text-xl')}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-slate-500 truncate">{sub}</div>}
    </div>
  );
}

function MethodBadge({ method }: { method: string | null }) {
  if (!method) return <span className="text-xs text-slate-400">-</span>;
  const icon =
    method === 'cash' ? <Banknote className="h-3 w-3" /> :
    method === 'card' ? <CreditCard className="h-3 w-3" /> :
    method === 'transfer' ? <Smartphone className="h-3 w-3" /> :
    <CircleDollarSign className="h-3 w-3" />;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
      {icon}
      {methodLabel(method)}
    </span>
  );
}

function methodLabel(m: string | null): string {
  if (!m) return '-';
  if (m === 'cash') return 'Efectivo';
  if (m === 'card') return 'Tarjeta';
  if (m === 'transfer') return 'Transferencia';
  if (m === 'mixed') return 'Mixto';
  return m;
}

function formatMoney(n: number): string {
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
  });
}

function formatTime(s: string): string {
  const d = new Date(s);
  return d.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
