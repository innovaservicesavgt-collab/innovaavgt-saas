import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ProfessionalsPage() {
  await requireAuth();
  const supabase = await createServerSupabase();
  const { data: profs } = await supabase.from('professionals').select('*').eq('is_active', true).order('last_name');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{profs?.length || 0} profesionales</p>
        <Link href="/professionals/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nuevo profesional
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(!profs || profs.length === 0) ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <p className="text-lg font-medium text-slate-500">No hay profesionales</p>
            <Link href="/professionals/new" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Agregar primero</Link>
          </div>
        ) : profs.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{backgroundColor: p.color || '#3b82f6'}}>
                {p.first_name?.charAt(0)}{p.last_name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.title} {p.first_name} {p.last_name}</p>
                <p className="text-xs text-slate-400">{p.specialty || 'General'}</p>
              </div>
            </div>
            {p.email && <p className="text-xs text-slate-400 mt-3 truncate">{p.email}</p>}
            {p.phone && <p className="text-xs text-slate-400 truncate">{p.phone}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
