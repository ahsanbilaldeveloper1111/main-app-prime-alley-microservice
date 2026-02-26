import React, { useState, useEffect } from 'react';
import { useTokenService } from '../hooks/useTokenService';
import { getFormattedTimeUntilExpiration, isTokenExpired } from '../utils/tokenUtils';

export const TokenStatus: React.FC = () => {
  const { getAccessToken, forceRefresh, isAuthenticated } = useTokenService();
  const [tokenStatus, setTokenStatus] = useState<{
    token: string | null;
    isExpired: boolean;
    timeUntilExpiration: string;
  }>({
    token: null,
    isExpired: true,
    timeUntilExpiration: 'Unknown',
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateTokenStatus = () => {
    const token = getAccessToken();
    if (token) {
      setTokenStatus({
        token: token.substring(0, 20) + '...', // Show first 20 chars
        isExpired: isTokenExpired(token),
        timeUntilExpiration: getFormattedTimeUntilExpiration(token),
      });
    } else {
      setTokenStatus({
        token: null,
        isExpired: true,
        timeUntilExpiration: 'No token',
      });
    }
  };

  useEffect(() => {
    updateTokenStatus();
    
    // Update status every 10 seconds
    const interval = setInterval(updateTokenStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      const newToken = await forceRefresh();
      if (newToken) {
        //console.log('Token refreshed successfully');
        updateTokenStatus();
      } else {
        console.log('Token refresh failed');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isAuthenticated()) {
    return (
      <div className="card">
        <div className="card-body">
          <h6 className="card-title">Token Status</h6>
          <p className="text-muted">User not authenticated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h6 className="card-title">Token Status</h6>
        <div className="row">
          <div className="col-md-6">
            <p><strong>Token:</strong> {tokenStatus.token || 'Not available'}</p>
            <p>
              <strong>Status:</strong> 
              <span className={`badge ${tokenStatus.isExpired ? 'bg-danger' : 'bg-success'} ms-2`}>
                {tokenStatus.isExpired ? 'Expired' : 'Valid'}
              </span>
            </p>
            <p><strong>Time until expiration:</strong> {tokenStatus.timeUntilExpiration}</p>
          </div>
          <div className="col-md-6">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleRefreshToken}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Token'}
            </button>
            <button
              className="btn btn-secondary btn-sm ms-2"
              onClick={updateTokenStatus}
            >
              Update Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 