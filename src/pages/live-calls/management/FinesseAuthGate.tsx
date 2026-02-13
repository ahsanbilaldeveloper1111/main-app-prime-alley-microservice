import React, { useState, useEffect, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Loader, Lock } from 'lucide-react';
import BreadcrumbItem from '@common/BreadcrumbItem';
import {
  finesseLink,
  setFinesseUserData,
  getFinesseUserData,
  getFinesseToken,
  setFinesseToken,
  normalizeFinesseUserData,
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
 * If finesseToken or finesseUserData are not available, shows the Finesse password form.
 * Use on both Campaigns and Agents management pages.
 */
export default function FinesseAuthGate({
  children,
  subTitle,
  pageLabel = 'this page',
  authMessage,
}: FinesseAuthGateProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [isFinesseAuthenticated, setIsFinesseAuthenticated] = useState(false);
  const [finessePassword, setFinessePassword] = useState('');
  const [finesseError, setFinesseError] = useState<string | null>(null);
  const [isFinesseLoading, setIsFinesseLoading] = useState(false);
  const [teamId, setTeamId] = useState<number | null>(15);

  // Require both token and user data to be considered authenticated
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = getFinesseToken();
    const userData = getFinesseUserData();
    if (token && userData) {
      setIsFinesseAuthenticated(true);
    }
  }, []);

  const handleFinesseAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !finessePassword.trim()) {
      setFinesseError('Please enter your password.');
      return;
    }
    const username =
      session.user.username != null ? String(session.user.username) : '';
    const extension =
      session.user.phone != null ? String(session.user.phone) : '';
    if (!username || !extension) {
      setFinesseError('User ID or extension is missing from your session.');
      return;
    }
    setFinesseError(null);
    setIsFinesseLoading(true);
    try {
      const response = await finesseLink({
        teamId: teamId as number | string,
        finesseUserId: username,
        finessePassword: finessePassword.trim(),
        extension,
      });
      if (response?.status === 'success' && response?.responseData) {
        const data = normalizeFinesseUserData(response.responseData as FinesseUserData);
        setFinesseUserData(data);
        if (response?.token) {
          setFinesseToken(response.token);
        }
        setIsFinesseAuthenticated(true);
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
    }
  };

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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '24px',
              }}
            >
              <Lock size={28} color="#667eea" />
              <h2
                style={{
                  margin: 0,
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#1e293b',
                }}
              >
                Authentication Required
              </h2>
            </div>
            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
                marginBottom: '24px',
              }}
            >
              {authMessage ??
                `Enter your password to access ${pageLabel}.`}
            </p>
            <form onSubmit={handleFinesseAuth}>
              <div style={{ marginBottom: '20px' }}>
                <label
                  htmlFor="finesse-password"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: '6px',
                  }}
                >
                  Password
                </label>
                <input
                  id="finesse-password"
                  type="password"
                  value={finessePassword}
                  onChange={(e) => setFinessePassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                  }}
                />
              </div>
              {finesseError && (
                <div
                  style={{
                    marginBottom: '16px',
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
              <button
                type="submit"
                disabled={isFinesseLoading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px',
                }}
              >
                {isFinesseLoading ? (
                  <>
                    <Loader
                      size={20}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    Authenticate
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
