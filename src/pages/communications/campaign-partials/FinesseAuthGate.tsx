import React, { useState, useEffect, useRef, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Loader } from 'lucide-react';
import BreadcrumbItem from '@common/BreadcrumbItem';
import {
  finesseLink,
  setFinesseUserData,
  getFinesseUserData,
  getFinesseToken,
  setFinesseToken,
  normalizeFinesseUserData,
  getStoredTeamId,
  setStoredTeamId,
  type FinesseUserData,
} from '@utils/finesse';
export interface FinesseAuthGateProps {
  children: ReactNode;
  /** Breadcrumb subTitle (e.g. "Live Calls Campaigns Management") */
  subTitle: string;
  /** Short page label for the auth card (e.g. "Live Calls Campaigns" or "Live Calls Agents") */
  pageLabel?: string;
  /** Optional custom message below the title */
  authMessage?: string;
}

/**
 * Requires NextAuth session and Finesse token + user data.
 * If finesseToken or finesseUserData are not available, auto-links with finesseLink({ teamId }).
 * No user interaction (Campaign Console/Manager).
 */
export default function FinesseAuthGate({
  children,
  subTitle,
  pageLabel = 'this page',
  authMessage,
}: FinesseAuthGateProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [isFinesseAuthenticated, setIsFinesseAuthenticated] = useState(false);
  const [finesseError, setFinesseError] = useState<string | null>(null);
  const [isFinesseLoading, setIsFinesseLoading] = useState(false);
  const linkInFlightRef = useRef(false);
  // Require both token and user data to be considered authenticated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = getFinesseToken();
    const userData = getFinesseUserData();
    if (token && userData) {
      setIsFinesseAuthenticated(true);
    }
  }, []);

  const attemptAutoLink = async () => {
    if (typeof window === 'undefined') return;
    if (linkInFlightRef.current) return;
    linkInFlightRef.current = true;
    setFinesseError(null);
    setIsFinesseLoading(true);
    const teamIdToUse = getStoredTeamId();
    try {
      const response = await finesseLink({ teamId: teamIdToUse as number | string });
      if (response?.status === 'success' && response?.responseData) {
        const data = normalizeFinesseUserData(response.responseData as FinesseUserData);
        setFinesseUserData(data);
        setStoredTeamId(Number(teamIdToUse));
        if (response?.token) {
          setFinesseToken(response.token);
        }
        setIsFinesseAuthenticated(true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('finesse-authenticated'));
        }
      } else {
        setFinesseError(
          response?.message || response?.statusCode || 'Authentication failed.'
        );
      }
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data
          ? String((err.response.data as { message?: string }).message)
          : err instanceof Error
            ? err.message
            : 'Authentication failed.';
      setFinesseError(message);
    } finally {
      setIsFinesseLoading(false);
      linkInFlightRef.current = false;
    }
  };

  // When team is changed, storage is cleared and this event is fired; re-link without reload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onRequireReauth = () => {
      setIsFinesseAuthenticated(false);
      setFinesseError(null);
      void attemptAutoLink();
    };
    window.addEventListener('finesse-require-reauth', onRequireReauth);
    return () => window.removeEventListener('finesse-require-reauth', onRequireReauth);
  }, []);

  // Auto-link on mount when session is available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStatus === 'loading') return;
    if (!session?.user) return;
    const token = getFinesseToken();
    const userData = getFinesseUserData();
    if (token && userData) {
      setIsFinesseAuthenticated(true);
      return;
    }
    if (!isFinesseAuthenticated) {
      void attemptAutoLink();
    }
  }, [session?.user, sessionStatus, isFinesseAuthenticated]);

  // Session loading
  if (sessionStatus === 'loading') {
    return (
      <>
        <BreadcrumbItem mainTitle="" mainLink="" subTitle={subTitle} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <Loader
            size={40}
            className="text-primary"
            style={{ animation: 'spin 1s linear infinite' }}
          />
        </div>
      </>
    );
  }

  // Not signed in
  if (!session?.user) {
    return (
      <>
        <BreadcrumbItem mainTitle="" mainLink="" subTitle={subTitle} />
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          Please sign in to access {pageLabel}.
        </div>
      </>
    );
  }

  // Finesse authentication required (no token or no user data)
  if (!isFinesseAuthenticated) {
    return (
      <>
        <BreadcrumbItem mainTitle="" mainLink="" subTitle={subTitle} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '70vh',
            padding: '24px',
          }}
        >
          <div
            className="card"
            style={{ maxWidth: '420px', width: '100%', padding: '32px' }}
          >
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>Connecting to Finesse</h2>
            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
                marginBottom: '24px',
                marginTop: '10px',
              }}
            >
              {authMessage ?? `Preparing access to ${pageLabel}...`}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
              <span>{isFinesseLoading ? 'Connecting...' : 'Waiting for connection...'}</span>
            </div>
            {finesseError && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '10px 14px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#b91c1c',
                  fontSize: '14px',
                }}
              >
                {finesseError}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
