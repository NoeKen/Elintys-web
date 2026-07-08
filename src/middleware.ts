import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = [
  '/tableau-de-bord',
  '/evenements/creer',
  '/invites',
  '/parametres',
  '/billetterie',
  '/scan',
];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    const loginUrl = new URL('/connexion', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
