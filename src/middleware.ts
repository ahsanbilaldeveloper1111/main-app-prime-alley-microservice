import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages even without token
        if (req.nextUrl.pathname.startsWith('/auth/')) {
          return true;
        }
        
        // Allow access to public assets and API routes
        if (req.nextUrl.pathname.startsWith('/_next/') || 
            req.nextUrl.pathname.startsWith('/api/auth/') ||
            req.nextUrl.pathname.startsWith('/api/') ||
            req.nextUrl.pathname.includes('favicon.ico') ||
            req.nextUrl.pathname.includes('images/') ||
            req.nextUrl.pathname.includes('assets/')) {
          return true;
        }
        
        // Require token for all other protected routes
        if (!token) {
          //console.log('No token found, redirecting to login');
          return false;
        }
        
        // Check if token has required user data
        if (!token.access_token) {
          //console.log('Token missing access_token, redirecting to login');
          return false;
        }
        
        return true;
      },
    },
    pages: {
      signIn: "/auth/signin"
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|assets).*)",
  ],
}; 