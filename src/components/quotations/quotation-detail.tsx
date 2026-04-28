'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Printer,
  Send,
  CheckCircle2,
  XCircle,
  Edit,
  Copy,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Stethoscope,
  FileText,
  Building2,
  Hash,
  StickyNote,
  Ban,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  changeQuotationStatus,
  duplicateQuotation,
} from '@/server/actions/quotations';
import {
  getStatusConfig,
  parseQuotationNotes,
  type Quotation,
  type QuotationItem,
  type QuotationStatus,
} from '@/lib/types/quotation';

type QuotationFull = Quotation & {
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

type Props = {
  quotation: QuotationFull;
  items: QuotationItem[];
  tenantName: string;
};

export function QuotationDetail({ quotation, items, tenantName }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const cfg = getStatusConfig(quotation.status);
  const patient = quotation.patients;
  const professional = null;
  const parsed = parseQuotationNotes(quotation.notes);
  const title = parsed.title;
  const description = parsed.description;

  const subtotal = Number(quotation.subtotal || 0);
  const discountValue = Number(quotation.discount_value || 0);
  const total = Number(quotation.total_amount || 0);
  const discountAmount = subtotal - total;

  const handleChangeStatus = (newStatus: QuotationStatus, reason?: string) => {
    startTransition(async () => {
      const res = await changeQuotationStatus({
        id: quotation.id,
        status: newStatus,
        reason: reason || null,
      });
      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }
      const labels: Record<string, string> = {
        sent: 'Cotizacion enviada',
        accepted: 'Cotizacion aceptada',
        rejected: 'Cotizacion rechazada',
        cancelled: 'Cotizacion cancelada',
      };
      toast.success(labels[newStatus] || 'Estado actualizado');
      router.refresh();
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      const res = await duplicateQuotation({ id: quotation.id });
      if (!res.ok) {
        toast.error(res.error || 'Error');
        return;
      }
      toast.success('Cotizacion duplicada');
      router.push('/dental/quotations/' + res.id);
    });
  };

  const handleWhatsApp = () => {
    if (!patient?.phone) {
      toast.error('El paciente no tiene telefono registrado');
      return;
    }
    const phone = patient.phone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      'Hola ' + patient.first_name + ', te comparto la cotizacion ' + (quotation.quotation_number || '') + ' por ' + formatMoney(total) + '. Cualquier consulta estoy a tus ordenes.'
    );
    window.open('https://wa.me/' + phone + '?text=' + msg, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAcceptAndCreatePlan = () => {
    router.push('/dental/quotations/' + quotation.id + '/accept');
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto print:max-w-none">
      {/* Barra superior - solo en pantalla */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href="/dental/quotations"
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

          {patient?.phone && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <Send className="h-3.5 w-3.5" />
              WhatsApp
            </button>
          )}

          <button
            type="button"
            onClick={handleDuplicate}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicar
          </button>
        </div>
      </div>

      {/* Documento principal - imprimible */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden print:shadow-none print:border-0">
        {/* Encabezado */}
        <div className="px-6 sm:px-8 py-6 border-b-2 border-emerald-600">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">{tenantName}</h2>
              </div>
              <p className="text-xs text-slate-500">Cotizacion de tratamientos dentales</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-center gap-2 sm:justify-end">
                <Hash className="h-4 w-4 text-slate-400" />
                <p className="text-base font-bold text-slate-900 tabular-nums">
                  {quotation.quotation_number || 'Sin numero'}
                </p>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Emitida: {formatDate(quotation.issued_at || quotation.created_at)}
              </p>
              {quotation.valid_until && (
                <p className="text-xs text-slate-500">
                  Vence: {formatDate(quotation.valid_until)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Estado actual */}
        <div className="px-6 sm:px-8 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 print:hidden">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Estado
            </span>
            <div className="mt-1">
              <span
                className={'inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-bold ' + cfg.bg + ' ' + cfg.color + ' ' + cfg.border}
              >
                {cfg.label}
              </span>
            </div>
          </div>
          {quotation.accepted_at && (
            <p className="text-xs text-emerald-700">
              Aceptada: {formatDate(quotation.accepted_at)}
            </p>
          )}
          {quotation.rejected_at && (
            <p className="text-xs text-rose-700">
              Rechazada: {formatDate(quotation.rejected_at)}
            </p>
          )}
        </div>

        {/* Titulo */}
        <div className="px-6 sm:px-8 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          )}
        </div>

        {/* Datos paciente y profesional */}
        <div className="px-6 sm:px-8 py-4 border-y border-slate-200 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Paciente
              </h3>
              {patient ? (
                <div className="space-y-1 text-sm">
                  <p className="font-bold text-slate-900">
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
                  {patient.address && (
                    <p className="flex items-start gap-1 text-xs text-slate-600">
                      <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{patient.address}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Sin paciente</p>
              )}
            </div>

            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Profesional
              </h3>
              <p className="text-sm text-slate-500">Sin asignar</p>
            </div>
          </div>
        </div>

        {/* Tabla de items */}
        <div className="px-6 sm:px-8 py-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Tratamientos
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="px-2 py-2 text-left w-10">#</th>
                  <th className="px-2 py-2 text-left">Concepto</th>
                  <th className="px-2 py-2 text-center w-24 hidden sm:table-cell">Piezas</th>
                  <th className="px-2 py-2 text-center w-16">Cant</th>
                  <th className="px-2 py-2 text-right w-24">P. unit</th>
                  <th className="px-2 py-2 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                      Sin items
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-2 py-2 text-slate-500 tabular-nums">{idx + 1}</td>
                      <td className="px-2 py-2">
                        <p className="font-semibold text-slate-900">{item.description}</p>
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.notes}</p>
                        )}
                        {item.tooth_numbers && item.tooth_numbers.length > 0 && (
                          <p className="text-[11px] text-slate-500 mt-0.5 sm:hidden">
                            Piezas: {item.tooth_numbers.join(', ')}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center text-xs text-slate-600 hidden sm:table-cell">
                        {item.tooth_numbers && item.tooth_numbers.length > 0
                          ? item.tooth_numbers.join(', ')
                          : '-'}
                      </td>
                      <td className="px-2 py-2 text-center tabular-nums">{item.quantity}</td>
                      <td className="px-2 py-2 text-right tabular-nums">
                        {formatMoney(item.unit_price)}
                      </td>
                      <td className="px-2 py-2 text-right font-bold tabular-nums">
                        {formatMoney(item.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-200">
          <div className="ml-auto sm:max-w-xs space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Subtotal</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatMoney(subtotal)}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-rose-700">
                <span>
                  Descuento{' '}
                  {quotation.discount_type === 'percent' && discountValue
                    ? '(' + discountValue + '%)'
                    : ''}
                </span>
                <span className="font-semibold tabular-nums">
                  -{formatMoney(discountAmount)}
                </span>
              </div>
            )}
            <div className="pt-2 mt-2 border-t-2 border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-900">TOTAL</span>
                <span className="text-2xl font-bold text-emerald-700 tabular-nums">
                  {formatMoney(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Terminos */}
        {quotation.terms && (
          <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-slate-50/50">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Terminos y condiciones
            </h3>
            <p className="text-xs text-slate-700 whitespace-pre-wrap">
              {quotation.terms}
            </p>
          </div>
        )}

        {/* Notas internas - solo en pantalla */}
        {quotation.internal_notes && (
          <div className="px-6 sm:px-8 py-4 border-t border-slate-200 bg-amber-50 print:hidden">
            <h3 className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-2">
              <StickyNote className="h-3 w-3" />
              Notas internas (no se imprimen)
            </h3>
            <p className="text-xs text-amber-900 whitespace-pre-wrap">
              {quotation.internal_notes}
            </p>
          </div>
        )}
      </div>

      {/* Acciones de estado - solo en pantalla */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Acciones disponibles
        </h3>

        <StatusActions
          status={quotation.status}
          isPending={isPending}
          onSend={() => handleChangeStatus('sent')}
          onAccept={handleAcceptAndCreatePlan}
          onReject={() => setShowRejectModal(true)}
          onCancel={() => {
            if (confirm('Cancelar esta cotizacion?')) {
              handleChangeStatus('cancelled');
            }
          }}
          onReopen={() => handleChangeStatus('draft')}
        />
      </section>

      {/* Modal de rechazo */}
      {showRejectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setShowRejectModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Rechazar cotizacion
              </h3>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-slate-600">
                Ãƒâ€šÃ‚Â¿Por que se rechaza esta cotizacion? (opcional)
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="El paciente decidio no proceder con el tratamiento..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleChangeStatus('rejected', rejectReason);
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                disabled={isPending}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                Rechazar cotizacion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Subcomponente: acciones segun estado ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function StatusActions({
  status,
  isPending,
  onSend,
  onAccept,
  onReject,
  onCancel,
  onReopen,
}: {
  status: QuotationStatus;
  isPending: boolean;
  onSend: () => void;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  onReopen: () => void;
}) {
  const baseBtn = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50';

  if (status === 'draft') {
    return (
      <div className="flex flex-wrap gap-2">
        <button onClick={onSend} disabled={isPending} className={baseBtn + ' bg-blue-600 text-white hover:bg-blue-700'}>
          <Send className="h-3.5 w-3.5" />
          Marcar como enviada
        </button>
        <button onClick={onAccept} disabled={isPending} className={baseBtn + ' bg-emerald-600 text-white hover:bg-emerald-700'}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Aceptar y crear plan
        </button>
        <button onClick={onCancel} disabled={isPending} className={baseBtn + ' border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}>
          <Ban className="h-3.5 w-3.5" />
          Cancelar
        </button>
      </div>
    );
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-wrap gap-2">
        <button onClick={onAccept} disabled={isPending} className={baseBtn + ' bg-emerald-600 text-white hover:bg-emerald-700'}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Aceptar y crear plan de pago
        </button>
        <button onClick={onReject} disabled={isPending} className={baseBtn + ' bg-rose-600 text-white hover:bg-rose-700'}>
          <XCircle className="h-3.5 w-3.5" />
          Rechazar
        </button>
        <button onClick={onReopen} disabled={isPending} className={baseBtn + ' border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}>
          <Edit className="h-3.5 w-3.5" />
          Volver a borrador
        </button>
        <button onClick={onCancel} disabled={isPending} className={baseBtn + ' border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}>
          <Ban className="h-3.5 w-3.5" />
          Cancelar
        </button>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-900">Cotizacion aceptada</p>
            <p className="text-xs text-emerald-800 mt-1">
              Proximamente desde aqui podras crear el plan de tratamiento con cuotas y registrar pagos. Disponible en el siguiente sprint.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="flex flex-wrap gap-2">
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2 w-full mb-2">
          <XCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-rose-900">Cotizacion rechazada</p>
            <p className="text-xs text-rose-800 mt-1">
              Puedes reabrirla si el paciente decide proceder.
            </p>
          </div>
        </div>
        <button onClick={onReopen} disabled={isPending} className={baseBtn + ' bg-blue-600 text-white hover:bg-blue-700'}>
          <PlayCircle className="h-3.5 w-3.5" />
          Reabrir como borrador
        </button>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-start gap-2">
        <Ban className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-slate-900">Cotizacion cancelada</p>
          <p className="text-xs text-slate-600 mt-1">
            Esta cotizacion ya no esta activa.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="flex flex-wrap gap-2">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 w-full mb-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-900">Cotizacion vencida</p>
            <p className="text-xs text-amber-800 mt-1">
              Reactivala como borrador para enviar una version actualizada.
            </p>
          </div>
        </div>
        <button onClick={onReopen} disabled={isPending} className={baseBtn + ' bg-blue-600 text-white hover:bg-blue-700'}>
          <PlayCircle className="h-3.5 w-3.5" />
          Reabrir como borrador
        </button>
      </div>
    );
  }

  return null;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Helpers ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
function formatMoney(n: number | null | undefined): string {
  return 'Q' + (Number(n) || 0).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(s: string | null): string {
  if (!s) return '-';
  const d = new Date(s);
  return d.toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
