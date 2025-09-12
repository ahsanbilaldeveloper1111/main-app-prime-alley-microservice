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
  
  // Check for TMS routes - require TMS session ID
  if (req.nextUrl.pathname.startsWith('/tms/')) {
    // Allow access to TMS verification page without authentication
    if (req.nextUrl.pathname === '/tms/verification') {
      console.log('Middleware: Allowing access to TMS verification page');
      return NextResponse.next();
    }
    
    // For other TMS routes, check for TMS session ID
    const tmsSessionId = req.cookies.get('tmsSessionId');
    console.log('Middleware: Checking TMS session ID for route:', req.nextUrl.pathname);
    console.log('Middleware: Available cookies:', req.cookies.getAll().map(c => c.name));
    console.log('Middleware: TMS session ID value:', tmsSessionId?.value);
    
    // Note: Middleware can't access localStorage, so we'll rely on cookies
    // If cookie is not set, the client-side will handle the fallback
    if (!tmsSessionId) {
      console.log('Middleware: No TMS session ID found, redirecting to TMS verification');
      return NextResponse.redirect(new URL('/tms/verification', req.url));
    }
    
    console.log('Middleware: TMS session ID found, allowing access to TMS route');
    return NextResponse.next();
  }
  
  // Require NextAuth token for all other protected routes
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