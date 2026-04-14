import { requireAuth } from '@/lib/auth/guards';
import { createServerSupabase } from '@/lib/supabase/server';
import Link from 'next/link';
import { PatientSearch } from '@/components/patients/patient-search';

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAuth();
  const supabase = await createServerSupabase();
  const params = await searchParams;
  const q = params.q || '';

  let query = supabase.from('patients').select('*').eq('is_active', true).order('last_name');
  if (q) query = query.or('first_name.ilike.%' + q + '%,last_name.ilike.%' + q + '%,phone.ilike.%' + q + '%,email.ilike.%' + q + '%');

  const { data: patients } = await query;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PatientSearch currentQuery={q} />
        <Link href="/patients/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Nuevo paciente
        </Link>
      </div>
      <p className="text-sm text-slate-500">{patients?.length || 0} pacientes {q && 'encontrados'}</p>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {(!patients || patients.length === 0) ? (
          <div className="p-12 text-center text-slate-400"><p className="text-lg font-medium text-slate-500">No hay pacientes</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {patients.map((p: any) => {
              let age = '';
              if (p.date_of_birth) { const t = new Date(); const b = new Date(p.date_of_birth); let y = t.getFullYear()-b.getFullYear(); if(t.getMonth()<b.getMonth()||(t.getMonth()===b.getMonth()&&t.getDate()<b.getDate()))y--; age=y+' anos'; }
              return (
                <Link key={p.id} href={'/patients/' + p.id} className="px-4 lg:px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors block">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {p.first_name?.charAt(0)}{p.last_name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-slate-400 truncate">{age}{age && p.phone ? ' · ' : ''}{p.phone || ''}{p.email ? ' · ' + p.email : ''}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
