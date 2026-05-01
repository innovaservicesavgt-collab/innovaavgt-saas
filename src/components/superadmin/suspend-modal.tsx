'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X, AlertTriangle, Pause } from 'lucide-react';
import { suspendTenant } from '@/server/actions/superadmin';

const REASONS_PRESETS = [
  { id: 'payment', label: 'Falta de pago' },
  { id: 'terms', label: 'Violacion de terminos' },
  { id: 'request', label: 'Solicitud del cliente' },
  { id: 'suspicious', label: 'Actividad sospechosa' },
  { id: 'other', label: 'Otra razon' },
];

type Props = {
  tenantId: string;
  tenantName: string;
  onClose: () => void;
};

export function SuspendModal(props: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [presetId, setPresetId] = useState<string>('payment');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    let reason = '';
    if (presetId === 'other') {
      reason = customReason.trim();
    } else {
      const preset = REASONS_PRESETS.find((r) => r.id === presetId);
      reason = preset?.label || '';
    }

    if (reason.length < 5) {
      toast.error('La razon debe tener al menos 5 caracteres');
      return;
    }

    startTransition(async () => {
      const res = await suspendTenant(props.tenantId, reason);
      if (!res.ok) {
        toast.error(res.error || 'Error al suspender');
        return;
      }
      toast.success('Tenant suspendido');
      props.onClose();
      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={props.onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-5 border-b border-slate-200">
          <div className="shrink-0 h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">Suspender tenant</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Vas a suspender <strong className="text-slate-900">{props.tenantName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
            <p className="font-bold mb-1">Que pasa al suspender?</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Los datos del tenant NO se eliminan</li>
              <li>Los usuarios no podran iniciar sesion</li>
              <li>Puedes reactivarlo cuando quieras</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Razon de suspension *
            </label>
            <div className="space-y-1.5">
              {REASONS_PRESETS.map((r) => (
                <label
                  key={r.id}
                  className={
                    'flex items-center gap-2 rounded-lg border-2 p-2.5 cursor-pointer transition ' +
                    (presetId === r.id
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-slate-200 hover:border-slate-300')
                  }
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={presetId === r.id}
                    onChange={() => setPresetId(r.id)}
                    className="h-4 w-4 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-sm font-medium text-slate-900">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {presetId === 'other' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Especifica la razon (minimo 5 caracteres)
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe el motivo de la suspension..."
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 resize-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {customReason.length}/500 caracteres
              </p>
            </div>
          ) : null}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onClose}
            disabled={isPending}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <Pause className="h-4 w-4" />
            {isPending ? 'Suspendiendo...' : 'Confirmar suspension'}
          </button>
        </div>
      </div>
    </div>
  );
}
