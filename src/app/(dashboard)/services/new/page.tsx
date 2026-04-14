'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', duration_minutes: '30', price: '', category: '', color: '#10B981' });
  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError('El nombre es obligatorio'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration_minutes: parseInt(form.duration_minutes), price: form.price ? parseFloat(form.price) : null }) });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Error'); return; }
      router.push('/services'); router.refresh();
    } catch { setError('Error'); } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/services" className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></Link>
        <h2 className="text-xl font-bold text-slate-800">Nuevo servicio</h2>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 lg:p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre *</label><input type="text" value={form.name} onChange={e => update('name', e.target.value)} required className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Limpieza dental" /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Descripcion</label><textarea value={form.description} onChange={e => update('description', e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Duracion (min)</label><input type="number" value={form.duration_minutes} onChange={e => update('duration_minutes', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Precio (Q)</label><input type="number" step="0.01" value={form.price} onChange={e => update('price', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="250.00" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label><input type="text" value={form.category} onChange={e => update('category', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none" placeholder="Preventivo" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Color</label><input type="color" value={form.color} onChange={e => update('color', e.target.value)} className="w-12 h-10 rounded border border-slate-200 cursor-pointer" /></div>
        </div>
        <div className="flex gap-3 pt-2">
          <Link href="/services" className="flex-1 py-2.5 text-center bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">Cancelar</Link>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar servicio'}</button>
        </div>
      </form>
    </div>
  );
}
