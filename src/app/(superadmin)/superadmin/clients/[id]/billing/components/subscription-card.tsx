'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, ChevronDown, Pencil } from 'lucide-react';

interface Props {
  client: any;
  summary: any;
}

export function SubscriptionCard({ client, summary }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(client.billing_notes || '');
  const [period, setPeriod] = useState(client.billing_period || 'monthly');
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    active: { label: 'Activa', color: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
    trial: { label: 'En prueba', color: 'text-violet-700 bg-violet-50', dot: 'bg-violet-500' },
    suspended: { label: 'Suspendida', color: 'text-rose-700 bg-rose-50', dot: 'bg-rose-500' },
    cancelled: { label: 'Cancelada', color: 'text-slate-700 bg-slate-100', dot: 'bg-slate-500' },
  };

  const status = statusConfig[client.tenant_status || 'active'] || statusConfig.active;
  const currency = client.currency || 'GTQ';
  const monthlyFee = Number(client.monthly_fee || 150);

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date + 'T12:00:00').toLocaleDateString('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setSavedMsg('');
    try {
      const sanitized = notes.replace(/<[^>]*>/g, '').slice(0, 500);
      const res = await fetch(`/api/superadmin/clients/${client.id}/billing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing_notes: sanitized, billing_period: period }),
      });
      if (res.ok) {
        setSavedMsg('Guardado');
        router.refresh();
        setTimeout(() => setSavedMsg(''), 2500);
      }
    } catch {} finally { setLoading(false); }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">Información de suscripción</h2>
      </div>

      <div className="p-6 space-y-5">
        {/* Fila 1: Estado, Mensualidad, Período, Próximo cobro */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Estado</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
            <p className="text-lg font-bold text-slate-900">{currency} {summary.accumulatedBalance.toFixed(0)}</p>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Mensualidad</span>
            <p className="mt-1.5 text-lg font-bold text-slate-900">{currency} {monthlyFee.toFixed(0)}</p>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Período</label>
            <div className="relative mt-1.5">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="monthly">Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Próximo cobro</span>
            <div className="mt-1.5 flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900">{formatDate(client.next_due_date)}</p>
              <button type="button" className="rounded p-1 text-slate-400 hover:bg-slate-100" aria-label="Editar fecha">
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Fila 2: Método pago, Tarjeta, Fechas, ID */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Métodos de pago</span>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-7 w-11 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-blue-800 text-[10px] font-bold text-white">VISA</div>
              <span className="text-sm font-medium text-slate-700">Visa</span>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Tarjeta</span>
            <div className="mt-2 flex items-center gap-2">
              <p className="font-mono text-sm text-slate-900">**** 1234</p>
              <button className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                <Pencil className="h-3 w-3" />
                Editar
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Fechas</span>
            <p className="mt-1.5 text-xs text-slate-500">Inicio: <span className="font-medium text-slate-900">{formatDate(client.subscription_start_date || client.created_at?.split('T')[0])}</span></p>
            <p className="text-xs text-slate-500 mt-0.5">Fin: <span className="font-medium text-slate-900">{formatDate(client.subscription_end_date)}</span></p>
          </div>

          <div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">ID suscripción</span>
            <p className="mt-1.5 font-mono text-sm font-medium text-slate-900">{(client.id || '').slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Notas + Guardar */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center">
          <label htmlFor="billing-notes" className="text-sm font-medium text-slate-700 flex-shrink-0">Notas</label>
          <input
            id="billing-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="Añade notas sobre esta suscripción..."
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex items-center gap-3">
            {savedMsg && <span className="text-xs font-medium text-emerald-600">{savedMsg}</span>}
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
