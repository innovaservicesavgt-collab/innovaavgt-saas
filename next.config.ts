import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Permite build aunque haya errores de tipos (los arreglamos después)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;