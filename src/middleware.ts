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

    // Get required permissions for this route (for 404 when path has no permission config)
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

    // Edge-safe decode: cookie only has sessionId, exp, iat, id (no permissions to avoid 431)
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        decode: edgeJwtDecode,
    });

    if (!token) {
        return NextResponse.redirect(
            new URL('/auth/signin', request.url)
        );
    }

    // Permission checks are done in Layout/pages via getServerSession + canAccessRoute
    // (full session with permissions comes from store when session is requested)
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
    return publicRoutes.includes(path);
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