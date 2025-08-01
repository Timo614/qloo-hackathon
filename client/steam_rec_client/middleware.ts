import { NextRequest, NextResponse } from 'next/server';

const LOCALES = ['en', 'es', 'fr', 'de', 'ja', 'zh'];
const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')   ||
    PUBLIC_FILE.test(pathname)
  ) return NextResponse.next();

  const first = pathname.split('/')[1];
  if (!LOCALES.includes(first as any)) return NextResponse.next();

  // —— rewrite —— 
  const rewritePath = '/' + pathname.split('/').slice(2).join('/') || '/';
  const url = req.nextUrl.clone();
  url.pathname = rewritePath;

  // —— persist locale —— 
  const res = NextResponse.rewrite(url);
  res.cookies.set('i18next', first, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export const config = { matcher: '/((?!_next|api|favicon.ico).*)' };
