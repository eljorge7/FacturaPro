import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get hostname of request (e.g. store.isotec.com, store.facturapro.com, localhost:3000)
  const hostname = req.headers.get('host') || 'localhost:3000';

  // Define our base domains that should NOT be rewritten
  // Add your base domains here. For example: facturapro.radiotecpro.com
  const isBaseDomain = 
    hostname.includes('localhost') || 
    hostname.includes('facturapro.radiotecpro.com');

  // If it's an API route, or next static file, or images, do nothing
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/static') ||
    url.pathname.includes('.') // like favicon.ico
  ) {
    return NextResponse.next();
  }

  // If the user visits a custom domain (e.g. store.isotec.com)
  if (!isBaseDomain) {
    // We rewrite the request to the dynamic route `/store/[domain]`
    // The backend will treat `store.isotec.com` as the "slug" and look it up in `storeCustomDomain`
    return NextResponse.rewrite(new URL(`/store/${hostname}${url.pathname}`, req.url));
  }

  // Otherwise, it's our base domain, do nothing (normal Next.js routing will handle /store/[slug])
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
