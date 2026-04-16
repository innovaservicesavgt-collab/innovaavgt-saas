'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, CreditCard } from 'lucide-react';

interface Props {
  clientId: string;
  clientName: string;
  currency: string;
  defaultAmount: number;
  onClose: () => void;
}

export function RegisterPaymentModal({ clientId, clientName, currency, defaultAmount, onClose }: Props) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(defaultAmount));
  const [method, setMethod] = useState('transfer');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) { setError('Monto inválido'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/superadmin/clients/${clientId}/billing/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, payment_method: method, notes: notes.slice(0, 500) }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return; }
      router.refresh();
      onClose();
    } catch { setError('Error de conexión'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Registrar pago</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-slate-600">Cliente: <span className="font-semibold text-slate-900">{clientName}</span></p>

          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">{currency}</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-200 bg-white pl-14 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Método de pago *</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="transfer">Transferencia</option>
              <option value="card">Tarjeta</option>
              <option value="cash">Efectivo</option>
              <option value="check">Cheque</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Opcional..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Registrando...' : 'Registrar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
