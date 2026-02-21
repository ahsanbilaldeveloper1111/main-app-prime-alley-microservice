/**
 * Logout redirect URL: always use current origin so that when the app
 * is served from multiple domains (e.g. example.com, abc.com), logout
 * redirects the user to the same domain they're on, not always to NEXTAUTH_URL.
 */
export function getLogoutCallbackUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/signin`;
  }
  return '/auth/signin';
}
