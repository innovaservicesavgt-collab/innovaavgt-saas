'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Printer,
  Send,
  Building2,
  Receipt,
  User,
  Phone,
  Mail,
  MapPin,
  Hash,
  CheckCircle2,
  Calendar,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { paymentMethodLabel, type Payment } from '@/lib/types/payment';

type PaymentFull = Payment & {
  patients: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email: string | null;
    document_number: string | null;
    address: string | null;
  } | null;
};

type PlanInfo = {
  id: string;
  title: string;
  final_amount: number;
  paid_amount: number;
  num_installments: number | null;
};

type ScheduleInfo = {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  amount_paid: number | null;
  status: string;
};

type Props = {
  payment: PaymentFull;
  plan: PlanInfo | null;
  schedule: ScheduleInfo | null;
  accumulated: number;
  tenantName: string;
  tenantPhone: string | null;
  tenantAddress: string | null;
  cashierName: string;
};

export function PaymentReceipt({
  payment,
  plan,
  schedule,
  accumulated,
  tenantName,
  tenantPhone,
  tenantAddress,
  cashierName,
}: Props) {
  const patient = payment.patients;
  const isVoid = payment.status === 'void';

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!patient?.phone) {
      toast.error('El paciente no tiene telefono registrado');
      return;
    }
    const phone = patient.phone.replace(/\D/g, '');
    const lines = [
      'Hola ' + patient.first_name + ',',
      '',
      'Confirmamos tu pago:',
      'Recibo: ' + (payment.receipt_number || ''),
      'Monto: ' + formatMoney(Number(payment.amount)),
      'Metodo: ' + paymentMethodLabel(payment.payment_method),
    ];
    if (plan) {
      const remaining = Number(plan.final_amount) - Number(plan.paid_amount);
      lines.push('');
      lines.push('Plan: ' + plan.title);
      lines.push('Pagado total: ' + formatMoney(Number(plan.paid_amount)));
      lines.push('Saldo: ' + formatMoney(remaining));
    }
    lines.push('');
    lines.push('Gracias por tu preferencia.');
    const msg = encodeURIComponent(lines.join('\n'));
    window.open('https://wa.me/' + phone + '?text=' + msg, '_blank');
  };

  const planTotal = plan ? Number(plan.final_amount) : 0;
  const planRemaining = plan ? Math.max(0, planTotal - Number(plan.paid_amount)) : 0;
  const planProgress = planTotal > 0 ? Math.round((Number(plan?.paid_amount || 0) / planTotal) * 100) : 0;

  return (
    <div className="space-y-4 max-w-3xl mx-auto print:max-w-none">
      {/* Top bar - solo pantalla */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={plan ? '/dental/treatments/' + plan.id : '/dental/treatments'}
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
            Imprimir / PDF
          </button>
          {patient?.phone && !isVoid && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar por WhatsApp
            </button>
          )}
        </div>
      </div>

      {/* Documento del recibo */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden print:shadow-none print:border-0">
        {/* Banner anulado */}
        {isVoid && (
          <div className="bg-rose-100 border-b border-rose-300 px-6 py-2 flex items-center justify-center gap-2 text-rose-800">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-bold">RECIBO ANULADO</span>
          </div>
        )}

        {/* Encabezado */}
        <div className="px-6 sm:px-8 py-5 border-b-2 border-emerald-600">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">{tenantName}</h2>
              </div>
              <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                {tenantPhone && (
                  <p className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {tenantPhone}
                  </p>
                )}
                {tenantAddress && (
                  <p className="flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{tenantAddress}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2 sm:justify-end">
                <Receipt className="h-4 w-4 text-emerald-600" />
                <p className="text-base font-bold text-emerald-700 tabular-nums">
                  {payment.receipt_number || 'Sin numero'}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {payment.paid_at ? formatDateTime(payment.paid_at) : '-'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Atendio: {cashierName}
              </p>
            </div>
          </div>
        </div>

        {/* Titulo */}
        <div className="px-6 sm:px-8 py-3 bg-emerald-50 border-b border-emerald-100">
          <h1 className="text-center text-lg font-bold text-emerald-900 tracking-wide uppercase">
            Recibo de pago
          </h1>
        </div>

        {/* Datos del cliente */}
        <div className="px-6 sm:px-8 py-4 border-b border-slate-200">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
            <User className="h-3 w-3" />
            Recibimos de
          </h3>
          {patient ? (
            <div className="space-y-0.5 text-sm">
              <p className="font-bold text-slate-900 text-base">
                {patient.first_name} {patient.last_name}
              </p>
              {patient.document_number && (
                <p className="text-xs text-slate-600">
                  DPI: {patient.document_number}
                </p>
              )}
              {patient.phone && (
                <p className="flex items-center gap-1 text-xs text-slate-600">
                  <Phone className="h-3 w-3" />
                  {patient.phone}
                </p>
              )}
              {patient.email && (
                <p className="flex items-center gap-1 text-xs text-slate-600">
                  <Mail className="h-3 w-3" />
                  {patient.email}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Sin paciente</p>
          )}
        </div>

        {/* Concepto */}
        <div className="px-6 sm:px-8 py-4 border-b border-slate-200">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Concepto
          </h3>
          {plan ? (
            <div className="space-y-1">
              <p className="font-bold text-slate-900">{plan.title}</p>
              {schedule && (
                <p className="text-xs text-slate-600">
                  Cuota #{schedule.installment_number}
                  {plan.num_installments ? ' de ' + plan.num_installments : ''}
                  {' · Vence: '} {formatDate(schedule.due_date)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-700">Pago general</p>
          )}
        </div>

        {/* Detalles del pago */}
        <div className="px-6 sm:px-8 py-4 border-b border-slate-200 bg-slate-50/30">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Metodo de pago
              </h3>
              <p className="font-semibold text-slate-900">
                {paymentMethodLabel(payment.payment_method)}
              </p>
            </div>
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Referencia
              </h3>
              <p className="font-semibold text-slate-900">
                {payment.reference_number || '-'}
              </p>
            </div>
          </div>
          {payment.notes && (
            <div className="mt-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Observaciones
              </h3>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{payment.notes}</p>
            </div>
          )}
        </div>

        {/* Monto principal */}
        <div className="px-6 sm:px-8 py-5 border-b-2 border-emerald-600 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              Monto recibido
            </p>
            <p className="mt-1 text-4xl sm:text-5xl font-bold text-emerald-700 tabular-nums">
              {formatMoney(Number(payment.amount))}
            </p>
          </div>
        </div>

        {/* Estado del plan */}
        {plan && (
          <div className="px-6 sm:px-8 py-4 border-b border-slate-200">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Estado del plan
            </h3>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total del plan</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatMoney(planTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-emerald-700">
                <span>Acumulado pagado ({planProgress}%)</span>
                <span className="font-semibold tabular-nums">
                  {formatMoney(accumulated)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
                <span className="font-bold text-slate-900">Saldo pendiente</span>
                <span className={'font-bold tabular-nums ' + (planRemaining === 0 ? 'text-emerald-700' : 'text-amber-700')}>
                  {formatMoney(planRemaining)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: planProgress + '%' }}
              />
            </div>

            {planRemaining === 0 && (
              <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 flex items-center gap-2 text-sm text-emerald-900">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-bold">Plan totalmente pagado</span>
              </div>
            )}
          </div>
        )}

        {/* Firma */}
        <div className="px-6 sm:px-8 py-6">
          <div className="max-w-xs mx-auto text-center">
            <div className="border-t-2 border-slate-300 pt-2">
              <p className="text-xs text-slate-600">Firma y/o sello</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-3 bg-slate-50 border-t border-slate-200">
          <p className="text-center text-xs text-slate-500">
            Gracias por su preferencia · {tenantName}
          </p>
        </div>
      </div>

      {/* Estilos para impresion */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          aside, nav, header.app-header { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────
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
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(s: string): string {
  const d = new Date(s);
  return d.toLocaleString('es-GT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
