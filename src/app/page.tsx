import Link from 'next/link';
import { headers } from 'next/headers';

export default async function HomePage() {
  const headersList = await headers();
  const isTenant = headersList.get('x-is-tenant') === 'true';
  const tenantSlug = headersList.get('x-tenant-slug');

  if (isTenant && tenantSlug) {
    return <TenantLanding slug={tenantSlug} />;
  }

  return <MainLanding />;
}

function MainLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-900">InnovaAVGT</h1>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition">
            Iniciar sesión
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Registrar mi negocio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 leading-tight">
          Gestión de citas
          <span className="block text-blue-600">para tu negocio</span>
        </h2>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Plataforma profesional para clínicas dentales, consultorios médicos y negocios con agenda. Tu propio portal de reservas en minutos.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <Link href="/register" className="px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/30">
            Comenzar gratis
          </Link>
          <Link href="#features" className="px-8 py-3 bg-white text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-50 transition border border-gray-200">
            Ver funciones
          </Link>
        </div>
      </main>

      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Multi-sucursal', desc: 'Gestiona varias sucursales desde un solo panel.', icon: '🏢' },
            { title: 'Agenda inteligente', desc: 'Calendario con vista diaria, semanal y mensual.', icon: '📅' },
            { title: 'Portal de reservas', desc: 'Tus pacientes reservan online desde tu subdominio.', icon: '🌐' },
            { title: 'Expediente digital', desc: 'Historial completo de cada paciente.', icon: '📋' },
            { title: 'Roles y permisos', desc: 'Admin, recepcionista, doctor y paciente.', icon: '🔐' },
            { title: 'Recordatorios', desc: 'Notificaciones automáticas para tus pacientes.', icon: '🔔' },
          ].map((f) => (
            <div key={f.title} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-gray-500">
        © {new Date().getFullYear()} InnovaAVGT. Todos los derechos reservados.
      </footer>
    </div>
  );
}

function TenantLanding({ slug }: { slug: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Portal: {slug}</h1>
        <p className="mt-4 text-gray-600">Este es el subdominio del cliente <strong>{slug}</strong></p>
        <div className="mt-6 flex gap-4 justify-center">
          <Link href="/book" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Reservar cita</Link>
          <Link href="/login" className="px-6 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition">Iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
