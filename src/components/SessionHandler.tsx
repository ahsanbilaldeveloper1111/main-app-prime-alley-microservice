import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import tokenService from '../utils/tokenService';

interface SessionHandlerProps {
  children: React.ReactNode;
}

/** Stripe (or other) return URLs: must work without a session (e.g. incognito). */
function isSessionOptionalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/auth/") || pathname.startsWith("/public/payment")
  );
}

const SessionHandler: React.FC<SessionHandlerProps> = ({ children }) => {
  const { status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Handle session state changes
    if (status === 'loading') {
      // Still loading, do nothing
      return;
    }

    const { pathname } = router;

    if (isSessionOptionalPath(pathname)) {
      return;
    }

    if (status === 'unauthenticated') {
      // User is not authenticated, clear tokens and redirect
      tokenService.clearTokens();
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Show loading state while session is being determined
  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <output
          aria-live="polite"
          className="m-0 border-0 p-0 bg-transparent d-inline-flex align-items-center justify-content-center"
        >
          <span className="spinner-border text-primary" aria-hidden="true" />
          <span className="visually-hidden">Loading...</span>
        </output>
      </div>
    );
  }

  if (status === 'unauthenticated' && !isSessionOptionalPath(router.pathname)) {
    return null;
  }

  return <>{children}</>;
};

export default SessionHandler; 