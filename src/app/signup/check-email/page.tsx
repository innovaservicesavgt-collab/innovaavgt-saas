import Link from 'next/link';
import { Mail, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

type PageProps = {
  searchParams: Promise<{ email?: string; warning?: string }>;
};

export default async function CheckEmailPage({ searchParams }: PageProps) {
  const { email, warning } = await searchParams;
  const hasWarning = warning === '1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mx-auto h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cuenta creada exitosamente</h1>
          <p className="text-gray-600 mb-6">
            Enviamos un enlace de confirmacion a:
          </p>

          {email ? <p className="font-bold text-gray-900 mb-6 break-all">{email}</p> : null}

          {hasWarning ? (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 text-left mb-4">
              <p className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Email no enviado
              </p>
              <p className="text-xs text-amber-900">
                Tu cuenta fue creada pero no pudimos enviar el email de confirmacion (probablemente por limite del proveedor SMTP).
              </p>
              <p className="text-xs text-amber-900 mt-2">
                <strong>Que hacer?</strong> Contacta a soporte y te activamos manualmente.
              </p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
              <p className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Que sigue?
              </p>
              <ol className="text-sm text-blue-900 space-y-1 ml-6 list-decimal">
                <li>Abre tu bandeja de entrada</li>
                <li>Busca el correo de InnovaAVGT</li>
                <li>Haz click en el enlace de confirmacion</li>
                <li>Te llevaremos al asistente de configuracion</li>
              </ol>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left mb-6">
            <p className="text-xs text-amber-900 flex items-start gap-2">
              <Clock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                <strong>No te llega el correo?</strong> Revisa la carpeta de spam o promociones. El email puede tardar hasta 5 minutos en llegar.
              </span>
            </p>
          </div>

          <p className="text-sm text-gray-600">
            Ya confirmaste tu email?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Iniciar sesion
            </Link>
          </p>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Necesitas ayuda? Escribenos a{' '}
          <a href="mailto:contacto@innovaavgt.com" className="text-blue-600 hover:underline">
            contacto@innovaavgt.com
          </a>
        </p>
      </div>
    </div>
  );
}
