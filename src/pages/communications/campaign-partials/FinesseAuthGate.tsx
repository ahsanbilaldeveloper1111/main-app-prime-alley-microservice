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
  getStoredTeamId,
  setStoredTeamId,
  clearFinesseManualReconnectRequired,
  getFinesseManualReconnectRequired,
  applyFinesseLinkResponse,
  isFinesseSessionReady,
  getFinesseApiErrorMessage,
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

type GateShellProps = Readonly<{
  subTitle: string;
  children: ReactNode;
}>;

function GateShell({ subTitle, children }: GateShellProps) {
  return (
    <>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle={subTitle} />
      {children}
    </>
  );
}

function SessionLoadingView({ subTitle }: Readonly<{ subTitle: string }>) {
  return (
    <GateShell subTitle={subTitle}>
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
    </GateShell>
  );
}

function SignInRequiredView({
  subTitle,
  pageLabel,
}: Readonly<{ subTitle: string; pageLabel: string }>) {
  return (
    <GateShell subTitle={subTitle}>
      <div
        style={{
          padding: '32px',
          textAlign: 'center',
          color: '#6c757d',
        }}
      >
        Please sign in to access {pageLabel}.
      </div>
    </GateShell>
  );
}

type FinesseAuthCardProps = Readonly<{
  subTitle: string;
  pageLabel: string;
  authMessage?: string;
  manualConnectMode: boolean;
  isFinesseLoading: boolean;
  finesseError: string | null;
  onConnect: () => void;
}>;

function FinesseConnectButton({
  isFinesseLoading,
  onConnect,
  label,
}: Readonly<{
  isFinesseLoading: boolean;
  onConnect: () => void;
  label: string;
}>) {
  return (
    <button
      type="button"
      className="btn btn-primary"
      disabled={isFinesseLoading}
      onClick={onConnect}
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
        label
      )}
    </button>
  );
}

function ManualConnectPanel({
  authMessage,
  isFinesseLoading,
  onConnect,
}: Readonly<{
  authMessage?: string;
  isFinesseLoading: boolean;
  onConnect: () => void;
}>) {
  return (
    <>
      <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#141414' }}>
        Connect to Finesse
      </h2>
      <p
        style={{
          color: '#6c757d',
          fontSize: '14px',
          marginBottom: '24px',
          marginTop: '10px',
        }}
      >
        {authMessage ??
          'You signed out from Finesse. Click below to sign in again and continue.'}
      </p>
      <FinesseConnectButton
        isFinesseLoading={isFinesseLoading}
        onConnect={onConnect}
        label="Connect to Finesse"
      />
    </>
  );
}

function AutoConnectPanel({
  authMessage,
  pageLabel,
  isFinesseLoading,
  showRetry,
  onConnect,
}: Readonly<{
  authMessage?: string;
  pageLabel: string;
  isFinesseLoading: boolean;
  showRetry: boolean;
  onConnect: () => void;
}>) {
  return (
    <>
      <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#141414' }}>
        Connecting to Finesse
      </h2>
      <p
        style={{
          color: '#6c757d',
          fontSize: '14px',
          marginBottom: '24px',
          marginTop: '10px',
        }}
      >
        {authMessage ?? `Preparing access to ${pageLabel}...`}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6c757d' }}>
        <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span>{isFinesseLoading ? 'Connecting...' : 'Waiting for connection...'}</span>
      </div>
      {showRetry && (
        <button
          type="button"
          className="btn btn-outline-primary"
          disabled={isFinesseLoading}
          onClick={onConnect}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 600,
            cursor: isFinesseLoading ? 'wait' : 'pointer',
          }}
        >
          Retry connection
        </button>
      )}
    </>
  );
}

function FinesseAuthCard({
  subTitle,
  pageLabel,
  authMessage,
  manualConnectMode,
  isFinesseLoading,
  finesseError,
  onConnect,
}: FinesseAuthCardProps) {
  const showRetry = Boolean(finesseError) && !isFinesseLoading;
  const panel = manualConnectMode ? (
    <ManualConnectPanel
      authMessage={authMessage}
      isFinesseLoading={isFinesseLoading}
      onConnect={onConnect}
    />
  ) : (
    <AutoConnectPanel
      authMessage={authMessage}
      pageLabel={pageLabel}
      isFinesseLoading={isFinesseLoading}
      showRetry={showRetry}
      onConnect={onConnect}
    />
  );

  return (
    <GateShell subTitle={subTitle}>
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
          {panel}
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
    </GateShell>
  );
}

function applySuccessfulFinesseLink(teamIdToUse: number | string | null): void {
  if (teamIdToUse != null) {
    setStoredTeamId(Number(teamIdToUse));
  }
  clearFinesseManualReconnectRequired();
  globalThis.window?.dispatchEvent(new CustomEvent('finesse-authenticated'));
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

  const syncAuthFromStorage = useCallback((): boolean => {
    if (!isFinesseSessionReady()) return false;
    clearFinesseManualReconnectRequired();
    setManualConnectMode(false);
    setFinesseError(null);
    setIsFinesseAuthenticated(true);
    return true;
  }, []);

  useLayoutEffect(() => {
    if (globalThis.window === undefined) return;
    syncAuthFromStorage();
    if (getFinesseManualReconnectRequired()) {
      setManualConnectMode(true);
    }
  }, [syncAuthFromStorage]);

  useEffect(() => {
    if (globalThis.window === undefined) return;
    const onAuthenticated = () => {
      syncAuthFromStorage();
    };
    globalThis.window.addEventListener('finesse-authenticated', onAuthenticated);
    return () =>
      globalThis.window.removeEventListener('finesse-authenticated', onAuthenticated);
  }, [syncAuthFromStorage]);

  const attemptAutoLink = useCallback(async () => {
    if (globalThis.window === undefined) return;
    if (syncAuthFromStorage()) return;
    if (linkInFlightRef.current) return;

    linkInFlightRef.current = true;
    setFinesseError(null);
    setIsFinesseLoading(true);
    const teamIdToUse = getStoredTeamId();
    try {
      const response = await finesseLink({ teamId: teamIdToUse as number | string });
      const result = applyFinesseLinkResponse(response);
      if (result.ok) {
        applySuccessfulFinesseLink(teamIdToUse);
        setManualConnectMode(false);
        setIsFinesseAuthenticated(true);
      } else {
        setFinesseError(result.error);
        syncAuthFromStorage();
      }
    } catch (err: unknown) {
      setFinesseError(getFinesseApiErrorMessage(err, 'Authentication failed.'));
      syncAuthFromStorage();
    } finally {
      setIsFinesseLoading(false);
      linkInFlightRef.current = false;
      syncAuthFromStorage();
    }
  }, [syncAuthFromStorage]);

  const handleConnect = useCallback(() => {
    attemptAutoLink().catch(() => undefined);
  }, [attemptAutoLink]);

  const onRequireReauth = useCallback(
    (e: Event) => {
      const manual =
        (e as CustomEvent<{ manualConnect?: boolean }>).detail?.manualConnect ===
        true;
      setIsFinesseAuthenticated(false);
      setFinesseError(null);
      if (manual) {
        setManualConnectMode(true);
        return;
      }
      setManualConnectMode(false);
      handleConnect();
    },
    [handleConnect],
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
    if (syncAuthFromStorage()) return;
    if (getFinesseManualReconnectRequired()) {
      setManualConnectMode(true);
      return;
    }
    attemptAutoLink().catch(() => undefined);
  }, [session?.user, sessionStatus, syncAuthFromStorage, attemptAutoLink]);

  if (sessionStatus === 'loading') {
    return <SessionLoadingView subTitle={subTitle} />;
  }

  if (!session?.user) {
    return <SignInRequiredView subTitle={subTitle} pageLabel={pageLabel} />;
  }

  if (!isFinesseAuthenticated) {
    return (
      <FinesseAuthCard
        subTitle={subTitle}
        pageLabel={pageLabel}
        authMessage={authMessage}
        manualConnectMode={manualConnectMode}
        isFinesseLoading={isFinesseLoading}
        finesseError={finesseError}
        onConnect={handleConnect}
      />
    );
  }

  return <div className="communications-campaign-root">{children}</div>;
}
