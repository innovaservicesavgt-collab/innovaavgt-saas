'use client';

interface Props {
  payments: any[];
  currency: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  paid: { label: 'Pagado', color: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  partial: { label: 'Parcial', color: 'bg-orange-100 text-orange-700' },
  refunded: { label: 'Reembolsado', color: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelado', color: 'bg-rose-100 text-rose-700' },
};

const methodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  check: 'Cheque',
  other: 'Otro',
};

export function PaymentsTab({ payments, currency }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">Pagos registrados</h2>
        <p className="mt-1 text-sm text-slate-500">{payments.length} pagos en total</p>
      </div>

      {payments.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-sm text-slate-500">Sin pagos registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Método</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Recibo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p: any) => {
                const status = statusLabels[p.status] || statusLabels.paid;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5 text-sm text-slate-600">
                      {new Date(p.paid_at || p.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-700">{methodLabels[p.payment_method] || p.payment_method}</td>
                    <td className="px-6 py-3.5 text-sm font-mono text-slate-600">{p.receipt_number || '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right text-sm font-semibold text-slate-900">
                      {currency} {Number(p.amount).toFixed(0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
