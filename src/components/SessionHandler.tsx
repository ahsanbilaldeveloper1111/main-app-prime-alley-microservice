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
      // User is authenticated, check if this is a TMS session
      const isTmsSession = session.user?.tmsSession;
      
      // Also check if we have a TMS session ID in cookies/localStorage
      let hasTmsSessionId = false;
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';');
        const tmsSessionIdCookie = cookies.find(cookie =>
          cookie.trim().startsWith('tmsSessionId=')
        );
        hasTmsSessionId = !!tmsSessionIdCookie || !!localStorage.getItem('tmsSessionId');
      }
      
      if (!isTmsSession && !hasTmsSessionId) {
        // This is a regular NextAuth session with no TMS session, clear any existing TMS session data
        if (typeof window !== 'undefined') {
          // Clear from localStorage
          localStorage.removeItem('tmsSessionId');
          console.log('Cleared tmsSessionId from localStorage on regular session');
          
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
          console.log('Cleared tmsSessionId cookies on regular session');
        }
      } else {
        // This is a TMS session or has TMS session ID, preserve the TMS session data
        console.log('TMS session detected or TMS session ID found, preserving TMS session data');
      }
      
      // Initialize token service
      //console.log('Session authenticated, initializing token service');
      tokenService.initializeFromSession(session);
    } else if (status === 'unauthenticated') {
      // User is not authenticated, clear tokens and redirect
      //console.log('Session unauthenticated, clearing tokens');
      tokenService.clearTokens();
      
      // Don't clear TMS session data if we're on TMS routes
      // TMS routes are handled by middleware and don't require NextAuth session
      if (!router.pathname.startsWith('/tms/')) {
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
      } else {
        console.log('On TMS route, preserving TMS session data');
      }
      
      // Only redirect if not already on auth page and not on TMS routes
      if (!router.pathname.startsWith('/auth/') && !router.pathname.startsWith('/tms/')) {
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

  // Don't render children if not authenticated and not on auth page or TMS routes
  if (status === 'unauthenticated' && !router.pathname.startsWith('/auth/') && !router.pathname.startsWith('/tms/')) {
    return null;
  }

  return <>{children}</>;
};

export default SessionHandler; 