import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Politica de Privacidad - InnovaAVGT',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <Link href="/signup" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al registro
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Politica de Privacidad</h1>
        <p className="text-sm text-gray-500 mb-6">Ultima actualizacion: 29 de abril de 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <section>
            <h2 className="text-lg font-bold text-gray-900">1. Informacion que recopilamos</h2>
            <p>Recopilamos:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Datos de cuenta:</strong> nombre, email, telefono, contrasena (hash)</li>
              <li><strong>Datos de la clinica:</strong> nombre, direccion, logo, configuracion</li>
              <li><strong>Datos operativos:</strong> pacientes, citas, expedientes que tu ingresas</li>
              <li><strong>Datos de uso:</strong> logs, IP, navegador, paginas visitadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">2. Como usamos tu informacion</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Proveer y mejorar el Servicio</li>
              <li>Procesar pagos</li>
              <li>Enviar notificaciones del sistema</li>
              <li>Soporte tecnico</li>
              <li>Cumplir obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">3. Aislamiento entre clientes</h2>
            <p>Implementamos Row Level Security (RLS) a nivel de base de datos. Es <strong>tecnicamente imposible</strong> que un cliente vea datos de otro, incluso si conoce identificadores internos.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">4. Compartir con terceros</h2>
            <p>NO vendemos tu informacion. Solo la compartimos con:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Proveedores de infraestructura (Supabase, Vercel) bajo acuerdos de confidencialidad</li>
              <li>Pasarelas de pago (cuando contrates plan de pago)</li>
              <li>Autoridades cuando lo exija la ley</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">5. Seguridad</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Contrasenas hasheadas con bcrypt</li>
              <li>Conexiones SSL/TLS</li>
              <li>Tokens JWT firmados con expiracion</li>
              <li>Rate limiting</li>
              <li>Backups automaticos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">6. Tus derechos</h2>
            <p>Tienes derecho a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Acceso:</strong> ver tus datos en cualquier momento</li>
              <li><strong>Rectificacion:</strong> corregir datos incorrectos</li>
              <li><strong>Eliminacion:</strong> exportar y borrar tu cuenta</li>
              <li><strong>Portabilidad:</strong> exportar todos tus datos en formato estandar</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">7. Retencion de datos</h2>
            <p>Conservamos tus datos mientras tengas una cuenta activa. Si cancelas, mantenemos un periodo de gracia de 30 dias para reactivacion. Despues, los datos son eliminados permanentemente (excepto registros financieros que la ley exige conservar).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">8. Cookies</h2>
            <p>Usamos cookies tecnicas necesarias para mantener tu sesion activa. No usamos cookies de tracking publicitario.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">9. Menores</h2>
            <p>El Servicio esta dirigido a profesionales mayores de edad. No recopilamos intencionalmente datos de menores. Si tu clinica atiende menores, los datos de pacientes pediatricos son responsabilidad del profesional tratante.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">10. Cambios</h2>
            <p>Notificaremos cambios significativos por email con 30 dias de anticipacion.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">11. Contacto</h2>
            <p>Para ejercer tus derechos o consultas: privacidad@innovaavgt.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
