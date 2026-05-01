import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getPublicPlans } from '@/server/actions/signup';
import { SignupClient } from '@/components/signup/signup-client';

type PageProps = {
  searchParams: Promise<{ vertical?: string }>;
};

export const metadata = {
  title: 'Crear cuenta gratis - InnovaAVGT',
  description: 'Registra tu clinica dental o despacho legal. 7-21 dias de prueba sin tarjeta.',
};

export default async function SignupPage({ searchParams }: PageProps) {
  const { vertical: rawVertical } = await searchParams;

  // Si ya hay sesion, redirigir al dashboard
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect('/dental/dashboard');
  }

  const vertical: 'dental' | 'legal' = rawVertical === 'legal' ? 'legal' : 'dental';
  const plans = await getPublicPlans(vertical);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            InnovaAVGT
          </Link>
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
            Ya tengo cuenta
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Crea tu cuenta gratis
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Sin tarjeta de credito · Sin compromiso · Cancela cuando quieras
          </p>
        </div>

        <SignupClient initialVertical={vertical} plans={plans} />

        <p className="mt-8 text-center text-sm text-gray-500">
          Al registrarte aceptas nuestros{' '}
          <Link href="/terms" className="text-blue-600 hover:underline">Terminos</Link>
          {' y '}
          <Link href="/privacy" className="text-blue-600 hover:underline">Politica de Privacidad</Link>
        </p>
      </main>
    </div>
  );
}
