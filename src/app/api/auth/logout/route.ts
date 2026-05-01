import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  console.log('[logout] iniciando cierre de sesion');

  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
    console.log('[logout] supabase.auth.signOut() OK');
  } catch (e) {
    console.error('[logout] error en signOut:', e);
  }

  // Borrar TODAS las cookies de Supabase explicitamente (fix Edge cache)
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    let deletedCount = 0;
    allCookies.forEach((c) => {
      if (c.name.includes('sb-') || c.name.includes('supabase')) {
        cookieStore.delete(c.name);
        deletedCount++;
      }
    });
    console.log('[logout] cookies borradas:', deletedCount);
  } catch (e) {
    console.error('[logout] error borrando cookies:', e);
  }

  // Construir URL absoluta de redirect usando el host de la request
  const url = new URL('/login', request.url);

  // Status 303 fuerza al navegador a hacer GET (correcto despues de POST)
  const response = NextResponse.redirect(url, { status: 303 });

  // Headers anti-cache para forzar a Edge a no usar cache vieja
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  // Borrar cookies en el response tambien (doble seguridad)
  response.cookies.getAll().forEach((c) => {
    if (c.name.includes('sb-') || c.name.includes('supabase')) {
      response.cookies.delete(c.name);
    }
  });

  console.log('[logout] redirigiendo a /login con cookies limpias');
  return response;
}

// Permitir tambien GET por si el navegador hace refresh (algunos browsers convierten POST en GET)
export async function GET(request: NextRequest) {
  return POST(request);
}
