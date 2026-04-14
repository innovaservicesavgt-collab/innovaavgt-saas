import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'innovaavgt.com';
  const PORT = process.env.PORT || '3000';

  let slug = hostname
    .replace(`.${APP_DOMAIN}`, '')
    .replace(`.localhost:${PORT}`, '')
    .replace('.localhost', '');

  const isMainDomain =
    hostname === APP_DOMAIN ||
    hostname === `www.${APP_DOMAIN}` ||
    hostname === `localhost:${PORT}` ||
    hostname === 'localhost';

  const isSubdomain = !isMainDomain && slug !== hostname;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (isSubdomain) {
    response.headers.set('x-tenant-slug', slug);
    response.headers.set('x-is-tenant', 'true');
  } else {
    response.headers.set('x-is-tenant', 'false');
    slug = '';
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request: { headers: request.headers } });
          if (isSubdomain) {
            response.headers.set('x-tenant-slug', slug);
            response.headers.set('x-is-tenant', 'true');
          } else {
            response.headers.set('x-is-tenant', 'false');
          }
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const p = request.nextUrl.pathname;
  const protectedPaths = ['/dashboard','/appointments','/calendar','/patients','/professionals','/services','/branches','/settings','/reports','/users'];
  const adminPaths = ['/admin'];
  const isProtected = protectedPaths.some((x) => p.startsWith(x));
  const isAdminPath = adminPaths.some((x) => p.startsWith(x));

  if ((isProtected || isAdminPath) && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', p);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (p === '/login' || p === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
