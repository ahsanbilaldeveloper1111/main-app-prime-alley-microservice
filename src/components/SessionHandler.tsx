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
  
  // Detect browser close and clear all sessions
  //useBrowserCloseDetection();

  useEffect(() => {
    // Handle session state changes
    if (status === 'loading') {
      // Still loading, do nothing
      return;
    }


    if (status === 'authenticated' && session) {
      // User is authenticated, initialize token service
      //console.log('Session authenticated, initializing token service');
      tokenService.initializeFromSession(session).catch((error) => {
        console.error('Failed to initialize token service:', error);
      });
    } else if (status === 'unauthenticated') {
      // User is not authenticated, clear tokens and redirect
      //console.log('Session unauthenticated, clearing tokens');
      tokenService.clearTokens();
      
      // Only redirect if not already on auth page
      if (!router.pathname.startsWith('/auth/')) {
        router.push('/auth/signin');
      }
    }
  }, [status, session, router]);

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