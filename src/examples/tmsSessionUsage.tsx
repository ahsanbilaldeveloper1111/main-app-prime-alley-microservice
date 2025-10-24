/**
 * Example usage of TMS Session Helper
 * This file demonstrates how to use the TMS session helper in different scenarios
 */

import React, { useEffect, useState } from 'react';
import { 
  loadTmsSession, 
  getTmsSessionId, 
  isTmsSessionValid, 
  getTmsUser, 
  getTmsPermissions, 
  getTmsCustomerType,
  hasTmsPermission,
  useTmsSessionHelper 
} from '@utils/tmsSessionHelper';

// Example 1: Basic usage in a component
export const BasicTmsSessionExample = () => {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setLoading(true);
      const data = await loadTmsSession();
      setSessionData(data);
      setLoading(false);
    };

    loadSession();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!sessionData || !isTmsSessionValid(sessionData)) {
    return <div>No valid TMS session found</div>;
  }

  const user = getTmsUser(sessionData);
  const permissions = getTmsPermissions(sessionData);
  const customerType = getTmsCustomerType(sessionData);

  return (
    <div>
      <h3>TMS Session Data</h3>
      <p>User: {user?.name || 'Unknown'}</p>
      <p>Customer Type: {customerType}</p>
      <p>Permissions: {permissions.length}</p>
    </div>
  );
};

// Example 2: Using the React hook
export const TmsSessionHookExample = () => {
  const { 
    sessionData, 
    isLoading, 
    error, 
    isValid, 
    user, 
    permissions, 
    customerType, 
    loadSession,
    hasPermission 
  } = useTmsSessionHelper();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  if (isLoading) return <div>Loading TMS session...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!isValid) return <div>No valid TMS session</div>;

  return (
    <div>
      <h3>TMS Session (Hook)</h3>
      <p>User: {user?.name || 'Unknown'}</p>
      <p>Customer Type: {customerType}</p>
      <p>Permissions: {permissions.length}</p>
      <p>Can Edit: {hasPermission('edit', 'users') ? 'Yes' : 'No'}</p>
    </div>
  );
};

// Example 3: Manual session ID usage
export const ManualSessionIdExample = () => {
  const [sessionData, setSessionData] = useState(null);

  const handleLoadWithSpecificId = async () => {
    const sessionId = getTmsSessionId();
    if (sessionId) {
      const data = await loadTmsSession(sessionId);
      setSessionData(data);
    }
  };

  return (
    <div>
      <button onClick={handleLoadWithSpecificId}>
        Load Session with Current ID
      </button>
      {sessionData && (
        <div>
          <p>Session loaded: {sessionData.user?.name}</p>
        </div>
      )}
    </div>
  );
};

// Example 4: Permission checking
export const PermissionCheckExample = () => {
  const { sessionData, hasPermission } = useTmsSessionHelper();

  useEffect(() => {
    if (sessionData) {
      console.log('Can edit users:', hasPermission('edit', 'users'));
      console.log('Can delete posts:', hasPermission('delete', 'posts'));
    }
  }, [sessionData, hasPermission]);

  return (
    <div>
      <h3>Permission Checks</h3>
      <p>Edit Users: {hasPermission('edit', 'users') ? 'Yes' : 'No'}</p>
      <p>Delete Posts: {hasPermission('delete', 'posts') ? 'Yes' : 'No'}</p>
    </div>
  );
};
