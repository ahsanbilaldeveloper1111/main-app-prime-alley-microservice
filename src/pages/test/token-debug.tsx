import { useState, useEffect } from 'react';
import { Button, Card, Container, Row, Col } from 'react-bootstrap';
import tokenService from '../../utils/tokenService';
import axiosInstance from '../../utils/axios';
import directApi from '../../utils/directApi';

interface TokenDebugInfo {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpires: number | null;
  refreshTokenExpires: number | null;
  timeUntilAccessExpiry: string;
  timeUntilRefreshExpiry: string;
}

const TokenDebugPage = () => {
  const [debugInfo, setDebugInfo] = useState<TokenDebugInfo | null>(null);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Function to format time until expiry
  const formatTimeUntil = (expiryTime: number | null): string => {
    if (!expiryTime) return 'No expiry time';
    const now = Date.now();
    const diff = expiryTime - now;
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Function to update debug info
  const updateDebugInfo = () => {
    if (typeof window === 'undefined') return;

    const tokens = {
      accessToken: sessionStorage.getItem('accessToken'),
      refreshToken: sessionStorage.getItem('refreshToken'),
      accessTokenExpires: sessionStorage.getItem('accessTokenExpires'),
      refreshTokenExpires: sessionStorage.getItem('refreshTokenExpires'),
    };

    setDebugInfo({
      ...tokens,
      accessTokenExpires: tokens.accessTokenExpires ? parseInt(tokens.accessTokenExpires) : null,
      refreshTokenExpires: tokens.refreshTokenExpires ? parseInt(tokens.refreshTokenExpires) : null,
      timeUntilAccessExpiry: formatTimeUntil(tokens.accessTokenExpires ? parseInt(tokens.accessTokenExpires) : null),
      timeUntilRefreshExpiry: formatTimeUntil(tokens.refreshTokenExpires ? parseInt(tokens.refreshTokenExpires) : null),
    });
  };

  // Update debug info every second
  useEffect(() => {
    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, []);

  // Function to test refresh token directly
  const testRefreshToken = async () => {
    setLoading(true);
    try {
      const refreshToken = sessionStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Create form data
      const formData = new URLSearchParams();
      formData.append('refresh_token', refreshToken);

      console.log('🔄 Testing refresh token endpoint...');
      console.log('📤 Request data:', formData.toString());

      const response = await axiosInstance.post('/auth/refreshToken', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      setLastRefreshAttempt({
        success: true,
        timestamp: new Date().toISOString(),
        response: {
          status: response.status,
          data: response.data
        }
      });

      console.log('📥 Response:', response);
    } catch (error: any) {
      console.error('🚨 Refresh test failed:', error);
      setLastRefreshAttempt({
        success: false,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : null
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to test token service refresh
  const testTokenServiceRefresh = async () => {
    setLoading(true);
    try {
      const result = await tokenService.forceRefresh();
      setLastRefreshAttempt({
        success: !!result,
        timestamp: new Date().toISOString(),
        response: {
          newToken: !!result
        }
      });
    } catch (error: any) {
      setLastRefreshAttempt({
        success: false,
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : null
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <h4 className="mb-4">Token Debug Page</h4>

      {/* Current Token Status */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Current Token Status</Card.Title>
          <div className="mb-3">
            <div className="fw-bold mb-2">Access Token:</div>
            <div className="bg-light p-2 text-break">
              {debugInfo?.accessToken || 'No access token'}
            </div>
          </div>
          <div className="mb-3">
            <div className="fw-bold mb-2">Refresh Token:</div>
            <div className="bg-light p-2 text-break">
              {debugInfo?.refreshToken || 'No refresh token'}
            </div>
          </div>
          <div className="mb-3">
            <div className="fw-bold mb-2">Time Until Access Token Expiry:</div>
            <div className={debugInfo?.timeUntilAccessExpiry === 'Expired' ? 'text-danger' : ''}>
              {debugInfo?.timeUntilAccessExpiry || 'Unknown'}
            </div>
          </div>
          <div className="mb-3">
            <div className="fw-bold mb-2">Time Until Refresh Token Expiry:</div>
            <div className={debugInfo?.timeUntilRefreshExpiry === 'Expired' ? 'text-danger' : ''}>
              {debugInfo?.timeUntilRefreshExpiry || 'Unknown'}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Test Actions */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Test Actions</Card.Title>
          <div className="d-flex gap-2">
            <Button 
              variant="primary" 
              onClick={testRefreshToken}
              disabled={loading}
            >
              Test Direct Refresh
            </Button>
            <Button 
              variant="primary" 
              onClick={testTokenServiceRefresh}
              disabled={loading}
            >
              Test Token Service Refresh
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Last Refresh Attempt Results */}
      {lastRefreshAttempt && (
        <Card>
          <Card.Body>
            <Card.Title>Last Refresh Attempt</Card.Title>
            <div className="mb-2">
              Timestamp: {lastRefreshAttempt.timestamp}
            </div>
            <div className={`mb-3 ${lastRefreshAttempt.success ? 'text-success' : 'text-danger'}`}>
              Status: {lastRefreshAttempt.success ? 'Success' : 'Failed'}
            </div>
            <div>
              <div className="fw-bold mb-2">Details:</div>
              <div className="bg-light p-2">
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(lastRefreshAttempt.success ? lastRefreshAttempt.response : lastRefreshAttempt.error, null, 2)}
                </pre>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default TokenDebugPage;
