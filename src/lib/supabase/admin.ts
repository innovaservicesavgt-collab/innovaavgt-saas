import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con privilegios de administrador (bypass RLS).
 * SOLO usar en Server Actions, Route Handlers y Cron Jobs.
 * NUNCA expongas este cliente al navegador.
 */

// Validación de variables de entorno
function getEnvVars() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  return { url, serviceKey };
}

/**
 * Factory function para crear un cliente admin fresco.
 * Usada por el módulo legal (ej: cron de recordatorios).
 */
export function createAdminSupabase() {
  const { url, serviceKey } = getEnvVars();

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Cliente admin pre-creado (singleton).
 * Usado por el módulo superadmin del sistema dental.
 * Mantiene compatibilidad con código existente.
 */
export const supabaseAdmin = (() => {
  try {
    return createAdminSupabase();
  } catch {
    // Durante el build si no hay env vars, devolver null y lo manejamos al usar
    return null as unknown as ReturnType<typeof createAdminSupabase>;
  }
})();