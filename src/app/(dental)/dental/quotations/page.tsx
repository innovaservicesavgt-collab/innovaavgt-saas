import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function QuotationsPage() {
  await requireAuth();
  const supabase = await createServerSupabase();
  const { data: quotations } = await supabase.from('quotations').select('*, patients(first_name, last_name)').order('created_at', { ascending: false });

  const statusColors: Record<string, string> = { draft: 'bg-slate-100 text-slate-600', sent: 'bg-blue-100 text-blue-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-600', expired: 'bg-amber-100 text-amber-700' };
  const statusLabels: Record<string, string> = { draft: 'Borrador', sent: 'Enviada', approved: 'Aprobada', rejected: 'Rechazada', expired: 'Expirada' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{quotations?.length || 0} cotizaciones</p>
        <Link href="/dental/quotations/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nueva cotizacion
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {(!quotations || quotations.length === 0) ? (
          <div className="p-12 text-center text-slate-400"><p>Sin cotizaciones</p></div>
        ) : quotations.map((q: any) => (
          <div key={q.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/50">
            <div>
              <p className="text-sm font-medium text-slate-800">{(q.patients as any)?.first_name} {(q.patients as any)?.last_name || 'Sin paciente'}</p>
              <p className="text-xs text-slate-400">{new Date(q.created_at).toLocaleDateString('es')} {q.quotation_number ? '· #' + q.quotation_number : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-700">Q{Number(q.total || 0).toFixed(2)}</span>
              <span className={"px-2 py-0.5 rounded-full text-xs font-medium " + (statusColors[q.status] || 'bg-slate-100')}>{statusLabels[q.status] || q.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
