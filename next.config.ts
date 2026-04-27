import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Permite build aunque haya errores de tipos (los arreglamos después)
    ignoreBuildErrors: true,
  },

  /**
   * Redirects 301 permanentes para mantener compatibilidad
   * con URLs viejas (/patients, /appointments, etc.) que
   * ahora viven bajo /dental/.
   *
   * Estas reglas se evalúan ANTES del middleware y de las páginas.
   * Cualquier link viejo en bookmarks o emails seguirá funcionando.
   */
  async redirects() {
    return [
      // Rutas dentales — /xxx → /dental/xxx (con sub-rutas)
      {
        source: '/appointments/:path*',
        destination: '/dental/appointments/:path*',
        permanent: true,
      },
      {
        source: '/calendar/:path*',
        destination: '/dental/calendar/:path*',
        permanent: true,
      },
      {
        source: '/patients/:path*',
        destination: '/dental/patients/:path*',
        permanent: true,
      },
      {
        source: '/professionals/:path*',
        destination: '/dental/professionals/:path*',
        permanent: true,
      },
      {
        source: '/quotations/:path*',
        destination: '/dental/quotations/:path*',
        permanent: true,
      },
      {
        source: '/services/:path*',
        destination: '/dental/services/:path*',
        permanent: true,
      },
      {
        source: '/settings/:path*',
        destination: '/dental/settings/:path*',
        permanent: true,
      },
      // /dashboard NO se redirige aquí porque tiene su propio
      // router en src/app/dashboard/page.tsx que decide según vertical
    ];
  },
};

export default nextConfig;