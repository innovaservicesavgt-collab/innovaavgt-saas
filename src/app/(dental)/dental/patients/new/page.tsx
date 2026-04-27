'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    date_of_birth: '', gender: 'unspecified', address: '',
    document_type: 'DPI', document_number: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    allergies: '', medical_notes: '',
  });

  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name) { setError('Nombre y apellido son obligatorios'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error'); return; }
      router.push('/patients'); router.refresh();
    } catch { setError('Error de conexion'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/patients" className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></Link>
        <h2 className="text-xl font-bold text-slate-800">Nuevo paciente</h2>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 lg:p-6 space-y-4">
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre *</label><input type="text" value={form.first_name} onChange={e => update('first_name', e.target.value)} required className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Juan" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Apellido *</label><input type="text" value={form.last_name} onChange={e => update('last_name', e.target.value)} required className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Perez" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label><input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="juan@email.com" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Telefono</label><input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="+502 5555-1234" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de nacimiento</label><input type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Genero</label><select value={form.gender} onChange={e => update('gender', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"><option value="male">Masculino</option><option value="female">Femenino</option><option value="other">Otro</option><option value="unspecified">No especificado</option></select></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Direccion</label><input type="text" value={form.address} onChange={e => update('address', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Zona 10, Ciudad de Guatemala" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo documento</label><select value={form.document_type} onChange={e => update('document_type', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"><option value="DPI">DPI</option><option value="Pasaporte">Pasaporte</option><option value="Otro">Otro</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1.5">No. documento</label><input type="text" value={form.document_number} onChange={e => update('document_number', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" /></div>
        </div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Alergias</label><input type="text" value={form.allergies} onChange={e => update('allergies', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Penicilina, latex..." /></div>
        <div><label className="block text-sm font-medium text-slate-700 mb-1.5">Notas medicas</label></div>
        <div className="flex gap-3 pt-2">
          <Link href="/patients" className="flex-1 py-2.5 text-center bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">Cancelar</Link>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar paciente'}</button>
        </div>
      </form>
    </div>
  );
}
