'use client';

import { useState } from 'react';
import { X, Bell } from 'lucide-react';

interface Props {
  clientId: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  currency: string;
  onClose: () => void;
}

export function SendReminderModal({ clientId, clientName, clientEmail, amount, currency, onClose }: Props) {
  const defaultMsg = `Hola ${clientName},\n\nTe recordamos que tienes un saldo pendiente de ${currency} ${amount.toFixed(0)} en tu suscripción.\n\nPor favor regulariza tu pago lo antes posible.\n\nSaludos cordiales.`;
  const [message, setMessage] = useState(defaultMsg);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail) { setError('El cliente no tiene email configurado'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/superadmin/clients/${clientId}/billing/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.slice(0, 2000) }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return; }
      setSent(true);
      setTimeout(onClose, 1500);
    } catch { setError('Error de conexión'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <Bell className="h-4 w-4 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Enviar recordatorio</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Para:</p>
            <p className="text-sm font-semibold text-slate-900">{clientName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{clientEmail || 'Sin email configurado'}</p>
          </div>

          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}
          {sent && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Recordatorio enviado correctamente</div>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mensaje</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={2000}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-400">{message.length}/2000 caracteres</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button type="submit" disabled={loading || sent || !clientEmail} className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Enviando...' : sent ? 'Enviado' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
