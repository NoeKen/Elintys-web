import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = [
  '/tableau-de-bord',
  '/dashboard',
  '/onboarding',
  '/evenements/creer',
  '/invites',
  '/parametres',
  '/billetterie',
  '/scan',
  '/profil',
  '/admin',
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const hasSession =
    request.cookies.has('access_token') ||
    request.cookies.has('refresh_token');
  if (!hasSession) {
    const loginUrl = new URL('/connexion', request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
