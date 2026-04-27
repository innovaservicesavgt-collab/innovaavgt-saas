'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewProfessionalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', title: 'Dr.', specialty: '', email: '', phone: '', license_number: '', bio: '', color: '#3B82F6' });
  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) { setError('Nombre y apellido obligatorios'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/professionals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return; }
      router.push('/professionals'); router.refresh();
    } catch { setError('Error de conexion'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/professionals" className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></Link>
        <h2 className="text-xl font-bold text-slate-800">Nuevo profesional</h2>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 lg:p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Titulo</label><select value={form.title} onChange={e => update('title', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none bg-white"><option>Dr.</option><option>Dra.</option><option>Lic.</option><option>Ing.</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre *</label><input type="text" value={form.first_name} onChange={e => update('first_name', e.target.value)} required className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Apellido *</label><input type="text" value={form.last_name} onChange={e => update('last_name', e.target.value)} required className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Especialidad</label><input type="text" value={form.specialty} onChange={e => update('specialty', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ortodoncia, Endodoncia..." /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">No. licencia</label><input type="text" value={form.license_number} onChange={e => update('license_number', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Telefono</label><input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Color en calendario</label><input type="color" value={form.color} onChange={e => update('color', e.target.value)} className="w-12 h-10 rounded border border-slate-200 cursor-pointer" /></div>
        <div className="flex gap-3 pt-2">
          <Link href="/professionals" className="flex-1 py-2.5 text-center bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">Cancelar</Link>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar profesional'}</button>
        </div>
      </form>
    </div>
  );
}
