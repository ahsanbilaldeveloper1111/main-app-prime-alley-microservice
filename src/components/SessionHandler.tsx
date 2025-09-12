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


    if (status === 'authenticated' && session) {
      // User is authenticated, initialize token service
      //console.log('Session authenticated, initializing token service');
      tokenService.initializeFromSession(session);
    } else if (status === 'unauthenticated') {
      // User is not authenticated, clear tokens and redirect
      //console.log('Session unauthenticated, clearing tokens');
      tokenService.clearTokens();
      
      // Clear TMS session ID from localStorage and cookies on session unauthenticated
      if (typeof window !== 'undefined') {
        // Clear from localStorage
        localStorage.removeItem('tmsSessionId');
        console.log('Cleared tmsSessionId from localStorage on session unauthenticated');
        
        // Clear from cookies by setting them to expire
        const cookieOptions = [
          'tmsSessionId=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          'tmsSessionId=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          'tmsSessionId=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          'tmsSessionId=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          'tmsSessionId=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
        ];
        
        // Set cookies to expire
        cookieOptions.forEach(cookie => {
          document.cookie = cookie;
        });
        console.log('Cleared tmsSessionId cookies on session unauthenticated');
      }
      
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