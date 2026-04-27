import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ServicesPage() {
  await requireAuth();
  const supabase = await createServerSupabase();
  const { data: services } = await supabase.from('services').select('*').eq('is_active', true).order('name');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{services?.length || 0} servicios</p>
        <Link href="/dental/services/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nuevo servicio
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(!services || services.length === 0) ? (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            <p className="text-lg font-medium text-slate-500">No hay servicios</p>
            <Link href="/dental/services/new" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Crear primero</Link>
          </div>
        ) : services.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{backgroundColor: s.color || '#10b981'}} />
              <p className="text-sm font-semibold text-slate-800">{s.name}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{s.duration_minutes} min</span>
              {s.price && <span className="font-medium text-slate-600">Q{Number(s.price).toFixed(2)}</span>}
            </div>
            {s.description && <p className="text-xs text-slate-400 mt-2 line-clamp-2">{s.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
