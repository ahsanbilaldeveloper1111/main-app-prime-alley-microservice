/**
 * Utility functions for managing session cookies
 * Centralized cookie clearing to avoid duplication
 */

/**
 * Get cookie clearing options for server-side (Next.js API routes)
 * @param includeNextAuth - Whether to include NextAuth cookies (default: false)
 * @returns Array of cookie strings to clear
 */
export const getSessionCookieClearOptions = (includeNextAuth: boolean = false): string[] => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions: string[] = [];

  // Add NextAuth cookies if requested
  if (includeNextAuth) {
    cookieOptions.push(
      'next-auth.session-token=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'next-auth.csrf-token=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );
  }

  // Add Secure flag variations for production
  if (isProduction && includeNextAuth) {
    cookieOptions.push(
      'next-auth.session-token=; Path=/; SameSite=Lax; Secure; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'next-auth.csrf-token=; Path=/; SameSite=Lax; Secure; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    );
  }

  return cookieOptions;
};

/**
 * Clear session cookies on the client side
 * @param includeNextAuth - Whether to include NextAuth cookies (default: false)
 */
export const clearSessionCookiesClient = (includeNextAuth: boolean = false): void => {
  if (typeof window === 'undefined') return;

  try {
    // Get cookie options (same as server-side but for client)
    const cookieOptions = getSessionCookieClearOptions(includeNextAuth);

    // Set cookies to expire on client side
    cookieOptions.forEach(cookie => {
      document.cookie = cookie;
    });

    console.log('Cleared session cookies client-side');
  } catch (error) {
    console.error('Error clearing session cookies client-side:', error);
  }
};

/**
 * Set cookie clearing headers in Next.js API response
 * @param res - Next.js API response object
 * @param includeNextAuth - Whether to include NextAuth cookies (default: false)
 */
export const setCookieClearHeaders = (
  res: { setHeader: (name: string, value: string | string[]) => void },
  includeNextAuth: boolean = false
): void => {
  const cookieOptions = getSessionCookieClearOptions(includeNextAuth);
  res.setHeader('Set-Cookie', cookieOptions);
};

