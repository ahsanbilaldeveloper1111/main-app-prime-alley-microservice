import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import { getLogoutCallbackUrl } from '../utils/logoutRedirect';
import { clearSessionCookiesClient } from '../utils/cookieUtils';

const BROWSER_SESSION_KEY = 'app_browser_session_active';

/**
 * Hook to detect browser close (not tab close) and clear all sessions
 * This distinguishes between:
 * - Browser closing (should clear sessions)
 * - Tab closing (should NOT clear sessions)
 * - Navigation within the app (should NOT clear sessions)
 */
export const useBrowserCloseDetection = () => {
  const router = useRouter();
  const sessionCheckDoneRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Don't run browser close detection on auth pages (signin/signout)
    // These pages handle their own authentication flow
    const currentPath = router.pathname;
    const isAuthPage = currentPath.startsWith('/auth/');
    
    if (isAuthPage) {
      // On auth pages, just set the session flag if it doesn't exist
      // This prevents false positives when navigating to signin
      try {
        if (!sessionStorage.getItem(BROWSER_SESSION_KEY)) {
          sessionStorage.setItem(BROWSER_SESSION_KEY, 'true');
        }
      } catch (error) {
        // Ignore errors on auth pages
      }
      return;
    }

    // Check on page load if this is a fresh browser session
    // sessionStorage is cleared when browser closes, so if the flag doesn't exist,
    // it means the browser was closed and reopened
    const checkBrowserSession = async () => {
      if (sessionCheckDoneRef.current) return;
      sessionCheckDoneRef.current = true;

      try {
        const isSessionActive = sessionStorage.getItem(BROWSER_SESSION_KEY);
        
        // If no session flag exists, it means browser was closed and reopened
        // sessionStorage is cleared on browser close, so this is a fresh session
        if (!isSessionActive) {
          console.log('Fresh browser session detected (browser was closed) - clearing all sessions');
          
          // Clear sessions via API
          try {
            await fetch('/api/auth/clear-all-sessions', {
              method: 'POST',
              credentials: 'include',
            });
          } catch (error) {
            console.error('Error calling clear-all-sessions API:', error);
          }

          // Clear NextAuth cookies and session
          clearSessionCookiesClient(true);
          try {
            const callbackUrl = getLogoutCallbackUrl();
            await signOut({
              callbackUrl,
              redirect: true,
            });
            return; // signOut will redirect, so we can return here
          } catch (error) {
            console.error('Error signing out:', error);
            if (typeof window !== 'undefined') {
              window.location.href = getLogoutCallbackUrl();
            }
            return;
          }
        }

        // Session is active (tab was not closed), set the flag if not already set
        // This flag will be cleared when browser closes (sessionStorage is cleared)
        sessionStorage.setItem(BROWSER_SESSION_KEY, 'true');
      } catch (error) {
        console.error('Error checking browser session:', error);
      }
    };

    // Check session on mount
    checkBrowserSession();
  }, [router]);
};

