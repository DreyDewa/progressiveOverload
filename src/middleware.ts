import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/jwt';

const PUBLIC_PAGES = ['/login', '/register'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userId = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PAGES.includes(pathname);
  if (!userId && !isPublic) return NextResponse.redirect(new URL('/login', req.url));
  if (userId && isPublic) return NextResponse.redirect(new URL('/', req.url));
  return NextResponse.next();
}

export const config = {
  // API routes do their own 401 handling; static assets, icons and the manifest must stay public.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|icons|manifest.webmanifest).*)'],
};
