'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (authError) { 
        setError('Email o contrasena incorrectos'); 
        return; 
      }

      // Detectar vertical del tenant para redirigir al dashboard correcto
      const userId = authData.user?.id;
      let redirectPath = '/dental/dashboard'; // default al dental

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenants(vertical)')
          .eq('id', userId)
          .single();

        // @ts-expect-error — el tipo anidado de Supabase a veces no se infiere bien
        const vertical = profile?.tenants?.vertical;
        
        if (vertical === 'legal') {
          redirectPath = '/legal/dashboard';
        }
      }

      router.push(redirectPath);
      router.refresh();
    } catch { 
      setError('Error al iniciar sesion'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">InnovaAVGT</h1>
          <p className="mt-2 text-gray-600">Inicia sesion en tu cuenta</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="tu@email.com" 
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="********" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesion'}
          </button>
          <p className="mt-4 text-center text-sm text-gray-600">
            No tienes cuenta?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Crea tu cuenta gratis
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}