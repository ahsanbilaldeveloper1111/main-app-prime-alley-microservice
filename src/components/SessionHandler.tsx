import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import tokenService from '../utils/tokenService';

interface SessionHandlerProps {
  children: React.ReactNode;
}

const SessionHandler: React.FC<SessionHandlerProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Handle session state changes
    if (status === 'loading') {
      // Still loading, do nothing
      return;
    }

    const { pathname } = router;

    // Don't run auth enforcement on auth pages.
    if (pathname.startsWith('/auth/')) {
      return;
    }

    if (status === 'unauthenticated') {
      // User is not authenticated, clear tokens and redirect
      tokenService.clearTokens();
      
      // Only redirect if not already on auth page
      if (!pathname.startsWith('/auth/')) {
        router.push('/auth/signin');
      }
    }
  }, [status, router]);

  // Show loading state while session is being determined
  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated and not on auth page
  if (status === 'unauthenticated' && !router.pathname.startsWith('/auth/')) {
    return null;
  }

  return <>{children}</>;
};

export default SessionHandler; 