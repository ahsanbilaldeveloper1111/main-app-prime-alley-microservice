// Test file for CTI Proxy Connection
import React, { useEffect, useState } from 'react';
import useCtiStomp from '../hooks/useCtiStomp';

const TestCtiProxy = () => {
  const {
    dnsMap,
    callStateMap,
    eventLog,
    error,
    isInitialized,
    userAddress,
    summaryData,
    hasActiveCalls,
    getDnCallState,
    getCallStateForDevice,
    getCallStatesForDn
  } = useCtiStomp();

  const [testResults, setTestResults] = useState<{
    connection: 'pending' | 'success' | 'failed';
    events: number;
    dnsCount: number;
    callCount: number;
  }>({
    connection: 'pending',
    events: 0,
    dnsCount: 0,
    callCount: 0
  });

  useEffect(() => {
    if (isInitialized) {
      setTestResults(prev => ({ ...prev, connection: 'success' }));
    } else if (error) {
      setTestResults(prev => ({ ...prev, connection: 'failed' }));
    }
  }, [isInitialized, error]);

  useEffect(() => {
    setTestResults(prev => ({
      ...prev,
      events: eventLog.length,
      dnsCount: Object.keys(dnsMap).length,
      callCount: Object.keys(callStateMap).length
    }));
  }, [eventLog.length, dnsMap, callStateMap]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>CTI Proxy Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Connection Status</h2>
        <p>
          <strong>Status:</strong>{' '}
          <span style={{ 
            color: testResults.connection === 'success' ? 'green' : 
                   testResults.connection === 'failed' ? 'red' : 'orange'
          }}>
            {testResults.connection === 'success' ? '✅ Connected' : 
             testResults.connection === 'failed' ? '❌ Failed' : '⏳ Pending'}
          </span>
        </p>
        <p><strong>Initialized:</strong> {isInitialized ? 'Yes' : 'No'}</p>
        <p><strong>User Address:</strong> {userAddress || 'N/A'}</p>
        {error && (
          <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Statistics</h2>
        <p><strong>Total Events Received:</strong> {testResults.events}</p>
        <p><strong>DNs Count:</strong> {testResults.dnsCount}</p>
        <p><strong>Active Calls:</strong> {testResults.callCount}</p>
        <p><strong>Summary Data:</strong></p>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          {JSON.stringify(summaryData, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Recent Events (Last 10)</h2>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {eventLog.slice(-10).map((event, index) => (
            <div key={index} style={{ 
              marginBottom: '10px', 
              padding: '10px', 
              background: '#f9f9f9',
              borderRadius: '4px'
            }}>
              <strong>Type:</strong> {event.type || 'unknown'}<br/>
              <strong>Timestamp:</strong> {event.timestamp || 'N/A'}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>DNs Map (First 5)</h2>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', maxHeight: '200px', overflow: 'auto' }}>
          {JSON.stringify(
            Object.entries(dnsMap).slice(0, 5).reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {} as typeof dnsMap),
            null,
            2
          )}
        </pre>
      </div>

      <div>
        <h2>Test Instructions</h2>
        <ol>
          <li>Check that "Connection Status" shows "✅ Connected"</li>
          <li>Verify that "Total Events Received" is increasing</li>
          <li>Check that "DNs Count" is greater than 0</li>
          <li>Monitor the "Recent Events" section for incoming messages</li>
          <li>Verify that the proxy is working by checking browser network tab for SSE connection to `/api/cti-stomp-stream`</li>
        </ol>
      </div>
    </div>
  );
};

export default TestCtiProxy;

