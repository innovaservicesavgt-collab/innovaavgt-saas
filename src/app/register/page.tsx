'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    businessName: '', slug: '', businessType: 'dental', phone: '',
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'businessName') {
      const s = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
      setForm((prev) => ({ ...prev, slug: s }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Las contrasenas no coinciden'); return; }
    if (form.password.length < 8) { setError('La contrasena debe tener al menos 8 caracteres'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName: form.businessName, slug: form.slug, businessType: form.businessType, phone: form.phone, firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al registrar'); return; }
      setSuccess(true);
    } catch { setError('Error de conexion'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center max-w-md">
      <div className="text-5xl mb-4">&#127881;</div>
      <h2 className="text-2xl font-bold text-gray-900">Registro exitoso!</h2>
      <p className="mt-3 text-gray-600">Tu negocio <strong>{form.businessName}</strong> ha sido creado.</p>
      <p className="mt-2 text-gray-600">Tu portal: <strong className="text-blue-600">{form.slug}.innovaavgt.com</strong></p>
      <Link href="/login" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ir a iniciar sesion</Link>
    </div></div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">InnovaAVGT</h1>
          <p className="mt-2 text-gray-600">Registra tu negocio</p>
        </div>
        <div className="flex gap-2 mb-6">
          <div className={"h-1 flex-1 rounded " + (step >= 1 ? "bg-blue-600" : "bg-gray-200")} />
          <div className={"h-1 flex-1 rounded " + (step >= 2 ? "bg-blue-600" : "bg-gray-200")} />
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
          {step === 1 && (<div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del negocio</h2>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio</label>
              <input type="text" value={form.businessName} onChange={(e) => updateForm('businessName', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Clinica Dental Sonrisa Feliz" /></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Subdominio</label>
              <div className="flex"><input type="text" value={form.slug} onChange={(e) => updateForm('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} required className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg outline-none" placeholder="sonrisa-feliz" />
              <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-500">.innovaavgt.com</span></div></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Tipo de negocio</label>
              <select value={form.businessType} onChange={(e) => updateForm('businessType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
                <option value="dental">Clinica dental</option><option value="medical">Consultorio medico</option><option value="beauty">Salon de belleza</option><option value="therapy">Terapia</option><option value="veterinary">Veterinaria</option><option value="general">Otro</option></select></div>
            <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1">Telefono (opcional)</label>
              <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="+502 2222-3333" /></div>
            <button type="button" onClick={() => { if (!form.businessName || !form.slug) { setError('Completa nombre y subdominio'); return; } setError(''); setStep(2); }} className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Siguiente</button>
          </div>)}
          {step === 2 && (<div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tu cuenta de administrador</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label><input type="text" value={form.firstName} onChange={(e) => updateForm('firstName', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Juan" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label><input type="text" value={form.lastName} onChange={(e) => updateForm('lastName', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Perez" /></div>
            </div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="juan@clinica.com" /></div>
            <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label><input type="password" value={form.password} onChange={(e) => updateForm('password', e.target.value)} required minLength={8} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Minimo 8 caracteres" /></div>
            <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contrasena</label><input type="password" value={form.confirmPassword} onChange={(e) => updateForm('confirmPassword', e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none" placeholder="Repite la contrasena" /></div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Atras</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Registrando...' : 'Crear mi cuenta'}</button>
            </div>
          </div>)}
          <p className="mt-4 text-center text-sm text-gray-600">Ya tienes cuenta? <Link href="/login" className="text-blue-600 hover:underline">Iniciar sesion</Link></p>
        </form>
      </div>
    </div>
  );
}
