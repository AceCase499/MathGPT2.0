// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  const protectedRoutes = ['/dashboard'];
  //const protectedRoutes = ['/dashboard', '/lectures'];

  if (protectedRoutes.some((path) => req.nextUrl.pathname.startsWith(path))) {
    if (!session) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
  //matcher: ['/dashboard/:path*', '/lectures/:path*'],
};
