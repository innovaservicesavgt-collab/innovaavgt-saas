'use client';

import { FileText, Download } from 'lucide-react';

interface Props {
  clientId: string;
  currency: string;
}

// Mock data - reemplazar con fetch real
const mockInvoices = [
  { id: 'inv-082', number: '#00082', date: '2026-04-10', amount: 150, status: 'paid' },
  { id: 'inv-081', number: '#00081', date: '2026-03-15', amount: 150, status: 'paid' },
  { id: 'inv-080', number: '#00080', date: '2026-02-15', amount: 150, status: 'paid' },
];

export function InvoicesTab({ clientId, currency }: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Facturas emitidas</h2>
          <p className="mt-1 text-sm text-slate-500">{mockInvoices.length} facturas</p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {mockInvoices.map((inv) => (
          <div key={inv.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Factura {inv.number}</p>
              <p className="text-xs text-slate-500">
                {new Date(inv.date + 'T12:00:00').toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{currency} {inv.amount.toFixed(0)}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 mt-0.5">
                Pagada
              </span>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
