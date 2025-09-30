import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getRequiredPermissions } from './config/permissions';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Skip middleware for non-page requests
    if (
        path.startsWith('/_next') ||
        path.startsWith('/api') ||
        path.startsWith('/static') ||
        path.includes('.') ||
        path === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // Skip auth pages
    if (path.startsWith('/auth/')) {
        return NextResponse.next();
    }

    // Get required permissions for this route
    const requiredPermissions = getRequiredPermissions(path);

    // If route is not defined in permissions config, redirect to access denied
    if (requiredPermissions.length === 0 && !isPublicRoute(path)) {
        return NextResponse.rewrite(new URL('/access-denied', request.url));
    }

    // Get the session token
    const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
        // Store the current URL to redirect back after login
        const searchParams = new URLSearchParams({
            callbackUrl: request.nextUrl.pathname + request.nextUrl.search
        });
        
        // Redirect to login
        return NextResponse.redirect(
            new URL(`/auth/signin?${searchParams.toString()}`, request.url)
        );
    }

    // Check if user has all required permissions
    const userPermissions = token.permissions as string[] || [];
    const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
        // Create response with access denied page
        return NextResponse.rewrite(new URL('/access-denied', request.url));
    }

    return NextResponse.next();
}

// Helper function to check if a route is public
function isPublicRoute(path: string): boolean {
    const publicRoutes = [
        '/',
        '/auth/signin',
        '/auth/signup',
        '/auth/forgot-password',
        '/access-denied',
        '/dashboard'  // assuming dashboard is the default landing page
    ];
    return publicRoutes.some(route => path === route);
}

export const config = {
    matcher: [
        // Add paths that should be protected
        '/controlhub/:path*',
        // Add other protected paths
        '/dashboard/:path*',
        // Exclude paths that don't need permission checks
        '/((?!auth|api|_next/static|_next/image|favicon.ico).*)',
    ],
};