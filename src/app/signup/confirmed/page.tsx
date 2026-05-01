import Link from 'next/link';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function SignupConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            <span className="inline-flex items-center gap-2">
              Email confirmado
              <Sparkles className="h-5 w-5 text-amber-500" />
            </span>
          </h1>
          <p className="text-gray-600 mb-6">
            Tu cuenta esta lista. Ahora vamos a configurar tu clinica en 5 sencillos pasos.
          </p>

          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center w-full gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-base font-bold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            Empezar configuracion
          </Link>

          <p className="mt-4 text-xs text-gray-500">
            Tomara solo 3-5 minutos. Podras ajustar todo despues desde Configuracion.
          </p>
        </div>
      </div>
    </div>
  );
}
