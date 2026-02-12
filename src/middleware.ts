import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getRequiredPermissions, isProtectedPath } from './config/permissions';
import { edgeJwtDecode } from './utils/authJwtEdge';

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

    // Check if it's a protected route
    if (!isPublicRoute(path)) {
        if (isProtectedPath(path)) {
            // For protected paths, check if permissions are defined
            if (requiredPermissions.length === 0) {
                // No permissions defined for this path, show 404
                // This covers both non-existent pages and undefined routes
                return NextResponse.rewrite(new URL('/404', request.url));
            }
        } else {
            // Path is not under any protected route structure
            return NextResponse.rewrite(new URL('/404', request.url));
        }
    }

    // Edge-safe decode (Web Crypto only; Node crypto not available in middleware)
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        decode: edgeJwtDecode,
    });
    console.log("token",token);

    if (!token) {
        // Redirect to login
        console.log('Redirecting to login');
        return NextResponse.redirect(
            new URL('/auth/signin', request.url)
        );
    }

    // Check if user has all required permissions
    // If requiredPermissions is empty or only contains empty string, bypass permission check
    if (requiredPermissions.length === 0 || (requiredPermissions.length === 1 && requiredPermissions[0] === '')) {
        return NextResponse.next();
    }

    const userPermissions = token.permissions as string[] || [];
    const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
        // Redirect to access-denied without query params
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
        '/ai-ml/analysis/:path*',
        '/live-calls/:path*',
        '/cti/:path*',
        // Add other protected paths
        '/dashboard/:path*',
        // Exclude paths that don't need permission checks
        '/((?!auth|api|_next/static|_next/image|favicon.ico).*)',
    ],
};