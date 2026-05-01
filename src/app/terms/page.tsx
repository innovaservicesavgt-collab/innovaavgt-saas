import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terminos y Condiciones - InnovaAVGT',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <Link href="/signup" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mb-4">
          <ArrowLeft className="h-4 w-4" />
          Volver al registro
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Terminos y Condiciones</h1>
        <p className="text-sm text-gray-500 mb-6">Ultima actualizacion: 29 de abril de 2026</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <section>
            <h2 className="text-lg font-bold text-gray-900">1. Aceptacion</h2>
            <p>Al registrarte y usar InnovaAVGT (en adelante &quot;el Servicio&quot;), aceptas estos terminos y condiciones en su totalidad. Si no estas de acuerdo, no debes utilizar el Servicio.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">2. Descripcion del servicio</h2>
            <p>InnovaAVGT es una plataforma SaaS multi-tenant para la gestion de clinicas dentales, despachos legales y otros verticales empresariales. Cada cliente (tenant) tiene acceso aislado a sus propios datos.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">3. Periodo de prueba</h2>
            <p>El Servicio incluye un periodo de prueba gratuito sin tarjeta de credito segun el plan elegido (7, 14 o 21 dias). Al finalizar el periodo, debes contratar un plan de pago para continuar usando el Servicio.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">4. Pagos y facturacion</h2>
            <p>Los precios estan expresados en Quetzales (GTQ) y se facturan mensualmente. El pago se procesa al inicio de cada periodo. No se realizan reembolsos por periodos parcialmente utilizados.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">5. Uso aceptable</h2>
            <p>Te comprometes a NO usar el Servicio para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Actividades ilegales o que violen leyes de Guatemala</li>
              <li>Almacenar contenido que infrinja derechos de terceros</li>
              <li>Realizar ingenieria inversa, copiar o redistribuir el codigo</li>
              <li>Sobrecargar deliberadamente la infraestructura</li>
              <li>Suplantar identidad de otros usuarios o entidades</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">6. Propiedad intelectual</h2>
            <p>El codigo, diseno e infraestructura del Servicio son propiedad de InnovaAVGT. Los datos que ingresas (pacientes, citas, expedientes) son de tu propiedad. Te otorgamos licencia limitada para usar el Servicio mientras tengas una suscripcion activa.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">7. Privacidad y proteccion de datos</h2>
            <p>El tratamiento de datos personales se rige por nuestra <Link href="/privacy" className="text-blue-600 hover:underline">Politica de Privacidad</Link>. Cumplimos con la normativa aplicable en Guatemala.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">8. Suspension y cancelacion</h2>
            <p>Podemos suspender o cancelar tu cuenta si: (a) violas estos terminos, (b) no realizas el pago, (c) detectamos uso fraudulento. Tienes derecho a exportar tus datos antes de la cancelacion definitiva.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">9. Limitacion de responsabilidad</h2>
            <p>El Servicio se proporciona &quot;tal cual&quot;. No garantizamos disponibilidad 100% del tiempo. Nuestra responsabilidad maxima esta limitada al monto pagado en los ultimos 12 meses.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">10. Cambios a los terminos</h2>
            <p>Podemos actualizar estos terminos con notificacion previa de 30 dias. El uso continuado constituye aceptacion de las modificaciones.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">11. Ley aplicable</h2>
            <p>Estos terminos se rigen por las leyes de la Republica de Guatemala. Cualquier disputa se resolvera en los tribunales de la ciudad de Guatemala.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900">12. Contacto</h2>
            <p>Para consultas sobre estos terminos: contacto@innovaavgt.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
