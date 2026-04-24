import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
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
  clearFinesseManualReconnectRequired,
  getFinesseManualReconnectRequired,
  type FinesseUserData,
} from '@utils/finesse';

function getFinesseLinkErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object' &&
    'message' in err.response.data
  ) {
    return String((err.response.data as { message?: string }).message);
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Authentication failed.';
}

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
 * On first visit without a Finesse session, auto-links with finesseLink({ teamId }).
 * After explicit Finesse logout, shows "Connect to Finesse" until the user clicks.
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
  const [manualConnectMode, setManualConnectMode] = useState(false);
  const linkInFlightRef = useRef(false);

  useLayoutEffect(() => {
    if (globalThis.window === undefined) return;
    if (getFinesseManualReconnectRequired()) {
      setManualConnectMode(true);
    }
  }, []);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    const token = getFinesseToken();
    const userData = getFinesseUserData();
    if (token && userData) {
      setIsFinesseAuthenticated(true);
    }
  }, []);

  const attemptAutoLink = useCallback(async () => {
    if (globalThis.window === undefined) return;
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
        clearFinesseManualReconnectRequired();
        setManualConnectMode(false);
        setIsFinesseAuthenticated(true);
        if (globalThis.window !== undefined) {
          globalThis.window.dispatchEvent(new CustomEvent('finesse-authenticated'));
        }
      } else {
        setFinesseError(
          response?.message || response?.statusCode || 'Authentication failed.',
        );
      }
    } catch (err: unknown) {
      setFinesseError(getFinesseLinkErrorMessage(err));
    } finally {
      setIsFinesseLoading(false);
      linkInFlightRef.current = false;
    }
  }, []);

  const onRequireReauth = useCallback(
    (e: Event) => {
      const manual = (e as CustomEvent<{ manualConnect?: boolean }>).detail?.manualConnect === true;
      setIsFinesseAuthenticated(false);
      setFinesseError(null);
      if (manual) {
        setManualConnectMode(true);
        return;
      }
      attemptAutoLink().catch(() => undefined);
    },
    [attemptAutoLink],
  );

  useEffect(() => {
    if (globalThis.window === undefined) return;
    globalThis.window.addEventListener('finesse-require-reauth', onRequireReauth);
    return () =>
      globalThis.window.removeEventListener('finesse-require-reauth', onRequireReauth);
  }, [onRequireReauth]);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    if (sessionStatus === 'loading') return;
    if (!session?.user) return;
    const token = getFinesseToken();
    const userData = getFinesseUserData();
    if (token && userData) {
      setIsFinesseAuthenticated(true);
      clearFinesseManualReconnectRequired();
      setManualConnectMode(false);
      return;
    }
    if (getFinesseManualReconnectRequired()) {
      setManualConnectMode(true);
      return;
    }
    if (!isFinesseAuthenticated) {
      attemptAutoLink().catch(() => undefined);
    }
  }, [session?.user, sessionStatus, isFinesseAuthenticated, attemptAutoLink]);

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

  if (!isFinesseAuthenticated) {
    const manualCard = manualConnectMode ? (
      <>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
          Connect to Finesse
        </h2>
        <p
          style={{
            color: '#64748b',
            fontSize: '14px',
            marginBottom: '24px',
            marginTop: '10px',
          }}
        >
          {authMessage ??
            'You signed out from Finesse. Click below to sign in again and continue.'}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isFinesseLoading}
          onClick={() => {
            attemptAutoLink().catch(() => undefined);
          }}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: 600,
            border: 'none',
            cursor: isFinesseLoading ? 'wait' : 'pointer',
          }}
        >
          {isFinesseLoading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
              Connecting…
            </span>
          ) : (
            'Connect to Finesse'
          )}
        </button>
      </>
    ) : (
      <>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
          Connecting to Finesse
        </h2>
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
      </>
    );

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
            {manualCard}
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
