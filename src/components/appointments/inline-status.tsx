'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props { appointmentId: string; currentStatus: string }

const nextActions: Record<string, { label: string; status: string; color: string }[]> = {
  scheduled: [
    { label: 'Confirmar', status: 'confirmed', color: 'text-emerald-600 hover:bg-emerald-50' },
    { label: 'Cancelar', status: 'cancelled', color: 'text-red-500 hover:bg-red-50' },
  ],
  confirmed: [
    { label: 'Iniciar', status: 'in_progress', color: 'text-purple-600 hover:bg-purple-50' },
    { label: 'No asistio', status: 'no_show', color: 'text-amber-600 hover:bg-amber-50' },
  ],
  in_progress: [
    { label: 'Completar', status: 'completed', color: 'text-slate-700 hover:bg-slate-100' },
  ],
};

export function InlineStatusButton({ appointmentId, currentStatus }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const actions = nextActions[currentStatus];
  if (!actions || actions.length === 0) return null;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doAction = async (status: string) => {
    setLoading(true);
    try {
      await fetch('/api/appointments/' + appointmentId, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch {} finally { setLoading(false); setOpen(false); }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} disabled={loading}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
          {actions.map((a) => (
            <button key={a.status} onClick={() => doAction(a.status)}
              className={"w-full text-left px-3 py-2 text-sm font-medium transition-colors " + a.color}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
