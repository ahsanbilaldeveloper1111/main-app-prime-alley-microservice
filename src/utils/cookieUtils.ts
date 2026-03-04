/**
 * Utility functions for managing session cookies
 * Centralized cookie clearing to avoid duplication
 */

const EXPIRED_DATE = 'Thu, 01 Jan 1970 00:00:00 GMT';

const nextAuthCookieNames = [
  // Session
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  // CSRF
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
  '__Secure-next-auth.csrf-token',
  // Callback URL
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
  // OAuth / PKCE temporary cookies (harmless to clear even if unused)
  'next-auth.pkce.code_verifier',
  '__Secure-next-auth.pkce.code_verifier',
  'next-auth.state',
  '__Secure-next-auth.state',
];

const buildClearCookie = (name: string, secure: boolean): string => {
  const base = `${name}=; Path=/; SameSite=Lax; Max-Age=0; Expires=${EXPIRED_DATE}`;
  return secure ? `${base}; Secure` : base;
};

/**
 * Get cookie clearing options for server-side (Next.js API routes)
 * @param includeNextAuth - Whether to include NextAuth cookies (default: false)
 * @returns Array of cookie strings to clear
 */
export const getSessionCookieClearOptions = (includeNextAuth: boolean = false): string[] => {
  const cookieOptions: string[] = [];

  // Add NextAuth cookies if requested
  if (includeNextAuth) {
    for (const name of nextAuthCookieNames) {
      // Clear both secure and non-secure variants. Browsers will ignore the one that doesn't apply.
      cookieOptions.push(buildClearCookie(name, false), buildClearCookie(name, true));
    }
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

