import { NextResponse } from 'next/server';

export function middleware(request) {
  const session = request.cookies.get('dashboard_session_v2')?.value;

  if (session !== 'authenticated') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

export const config = {
  matcher: [ '/staff-dashboard/:path*'],
};