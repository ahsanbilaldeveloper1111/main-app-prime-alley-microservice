import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // Allow access to auth pages even without token
  if (req.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }
  
  // Allow access to public assets and API routes
  if (req.nextUrl.pathname.startsWith('/_next/') || 
      req.nextUrl.pathname.startsWith('/api/auth/') ||
      req.nextUrl.pathname.startsWith('/api/') ||
      req.nextUrl.pathname.includes('favicon.ico') ||
      req.nextUrl.pathname.includes('images/') ||
      req.nextUrl.pathname.includes('assets/')) {
    return NextResponse.next();
  }
  
  // Require token for all other protected routes
  if (!token) {
    // Redirect to signin without callbackUrl parameter
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
  
  // Check if token has required user data
  if (!token.access_token) {
    // Redirect to signin without callbackUrl parameter
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)",
  ],
}; 