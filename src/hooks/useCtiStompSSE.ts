import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import axiosInstance from '@utils/axios';

interface CtiDevice {
  dn: string;
  deviceName: string;
  status: string;
  terminalState: string;
  deviceType: string;
}

interface CtiCallEvent {
  callId: string;
  eventType: string;
  sequence: number;
  eventTime: string;
  isConference: boolean;
  isOneToOne: boolean;
  parties: any[];
  isTerminating: boolean;
  hasActiveParticipants: boolean;
  eventName: string;
  currentState?: string;
}

interface SummaryData {
  extensions: number;
  online: number;
  offline: number;
  connected: number;
  on_hold: number;
  incoming: number;
  answered: number;
  incomingEvents: number;
}

// Local storage keys
const CALL_STATES_STORAGE_KEY = 'cti_call_states';
const CALL_STATES_TIMESTAMP_KEY = 'cti_call_states_timestamp';
const STORAGE_EXPIRY_HOURS = 24; // Call states expire after 24 hours

export default function useCtiStompSSE() {
  const [dnsMap, setDnsMap] = useState<Record<string, { dn: string; devices: Record<string, CtiDevice> }>>({});
  const [callStateMap, setCallStateMap] = useState<Record<string, CtiCallEvent>>({});
  const [eventLog, setEventLog] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [summaryData, setSummaryData] = useState<SummaryData>({
    extensions: 0,
    online: 0,
    offline: 0,
    connected: 0,
    on_hold: 0,
    incoming: 0,
    answered: 0,
    incomingEvents: 0
  });
  
  // Enhanced event tracking
  const [eventStats, setEventStats] = useState({
    totalEvents: 0,
    completeStateEvents: 0,
    dnsStateEvents: 0,
    callEventEvents: 0,
    otherEvents: 0,
    lastEventTime: null as Date | null,
    connectionStartTime: null as Date | null
  });
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3; // Reduced from 5 to 3
  const isConnectingRef = useRef(false);
  const tokenRef = useRef<string | null>(null);
  const userAddressRef = useRef<string | null>(null);
  const tokenExpiryRef = useRef<number | null>(null);
  const eventCountRef = useRef(0);

  // Get or refresh token
  const getToken = useCallback(async (): Promise<{ token: string; userAddress: string } | null> => {
    try {
      // Check if we have a valid cached token
      if (tokenRef.current && userAddressRef.current && tokenExpiryRef.current) {
        const now = Date.now();
        if (now < tokenExpiryRef.current) {
          console.log('Using cached CTI token');
          return { token: tokenRef.current, userAddress: userAddressRef.current };
        }
      }

      console.log('Getting new CTI token...');
      const response = await axiosInstance.get('/cti/connect', {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.status !== 200) {
        throw new Error('Failed to get bearer token');
      }

      const data = response.data;
      const token = data.token || data.accessToken || data.bearerToken;
      const userAddress = data.userAddress || data.user_address;
      
      if (!token || !userAddress) {
        throw new Error('Missing token or userAddress in API response');
      }

      // Cache the token with expiry (assuming 1 hour expiry)
      tokenRef.current = token;
      userAddressRef.current = userAddress;
      tokenExpiryRef.current = Date.now() + (60 * 60 * 1000); // 1 hour from now

      console.log('CTI token obtained and cached');
      return { token, userAddress };
    } catch (error) {
      console.error('Error getting CTI token:', error);
      return null;
    }
  }, []);

  // Load persisted call states from localStorage
  const loadPersistedCallStates = useCallback(() => {
    try {
      console.log('Loading persisted call states from localStorage...')
      const storedTimestamp = localStorage.getItem(CALL_STATES_TIMESTAMP_KEY);
      if (!storedTimestamp) {
        console.log('No stored timestamp found, no persisted call states to load')
        return;
      }

      const timestamp = new Date(storedTimestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      // Check if stored data is still valid (not expired)
      if (hoursDiff > STORAGE_EXPIRY_HOURS) {
        console.log('Stored call states expired, clearing localStorage');
        localStorage.removeItem(CALL_STATES_STORAGE_KEY);
        localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
        return;
      }

      const storedCallStates = localStorage.getItem(CALL_STATES_STORAGE_KEY);
      if (storedCallStates) {
        const parsedCallStates = JSON.parse(storedCallStates);
        console.log('Loaded persisted call states:', parsedCallStates);
        
        // Filter only active calls (not terminated)
        const activeCallStates = Object.entries(parsedCallStates).reduce((acc, [callId, callEvent]) => {
          const event = callEvent as CtiCallEvent;
          if (!event.isTerminating && event.parties && event.parties.length > 0) {
            // Check if any party is still in CONNECTED or RETRIEVED state
            const hasActiveParty = event.parties.some((p: any) => 
              p.callStatus && ['CONNECTED', 'RETRIEVED'].includes(p.callStatus)
            );
            if (hasActiveParty) {
              acc[callId] = event;
            }
          }
          return acc;
        }, {} as Record<string, CtiCallEvent>);

        if (Object.keys(activeCallStates).length > 0) {
          setCallStateMap(activeCallStates);
          console.log('Restored active call states:', activeCallStates);
        } else {
          console.log('No active call states found in persisted data')
        }
      } else {
        console.log('No stored call states found')
      }
    } catch (error) {
      console.error('Error loading persisted call states:', error);
      // Clear corrupted data
      localStorage.removeItem(CALL_STATES_STORAGE_KEY);
      localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
    }
  }, []);

  // Save call states to localStorage
  const saveCallStatesToStorage = useCallback((callStates: Record<string, CtiCallEvent>) => {
    try {
      console.log('Saving call states to localStorage:', callStates);
      
      // Only save calls that are CONNECTED or RETRIEVED (not incoming/ringing)
      const callsToPersist = Object.entries(callStates).reduce((acc, [callId, callEvent]) => {
        if (!callEvent.isTerminating && callEvent.parties && callEvent.parties.length > 0) {
          // Check if this is a CONNECTED or RETRIEVED call (established calls only)
          const isConnectedOrRetrieved = callEvent.parties.some((p: any) => {
            const status = p.callStatus;
            return status && ['CONNECTED', 'RETRIEVED'].includes(status);
          });
          
          if (isConnectedOrRetrieved) {
            acc[callId] = callEvent;
          }
        }
        return acc;
      }, {} as Record<string, CtiCallEvent>);

      if (Object.keys(callsToPersist).length > 0) {
        localStorage.setItem(CALL_STATES_STORAGE_KEY, JSON.stringify(callsToPersist));
        localStorage.setItem(CALL_STATES_TIMESTAMP_KEY, new Date().toISOString());
        console.log('Persisted CONNECTED/RETRIEVED call states to localStorage:', callsToPersist);
      } else {
        // If no active calls, clear storage
        localStorage.removeItem(CALL_STATES_STORAGE_KEY);
        localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
        console.log('No CONNECTED/RETRIEVED calls to persist, cleared localStorage');
      }
    } catch (error) {
      console.error('Error saving call states to localStorage:', error);
    }
  }, []);

  // Handle incoming call events
  const handleCallEvent = useCallback((evt: CtiCallEvent) => {
    const callId = evt.callId;
    if (!callId) return;

    // Count incoming call events
    if (evt.eventType === 'RINGING' && evt.parties) {
      // Check if this is an incoming call (someone calling this DN)
      const isIncomingCall = evt.parties.some((p: any) => 
        p.calledAddress && p.callStatus === 'RINGING'
      );
      
      if (isIncomingCall) {
        setSummaryData(prev => ({
          ...prev,
          incomingEvents: prev.incomingEvents + 1
        }));
      }
    }

    if (evt.isTerminating) {
      setCallStateMap(prev => {
        const { [callId]: _, ...rest } = prev;
        const updated = { ...rest };
        // Save updated state after removing terminated call
        saveCallStatesToStorage(updated);
        return updated;
      });
      return;
    }

    setEventLog(prev => {
      const log = [...prev, evt];
      if (log.length > 200) log.shift();
      return log;
    });

    setCallStateMap(prev => {
      const updated = { ...prev };
      const base = updated[callId] || {};

      updated[callId] = {
        ...base,
        callId,
        currentState: evt.eventType,
        sequence: evt.sequence,
        eventTime: evt.eventTime,
        isConference: evt.isConference,
        isOneToOne: evt.isOneToOne,
        parties: evt.parties || base.parties || [],
        isTerminating: evt.isTerminating,
        hasActiveParticipants: evt.hasActiveParticipants,
        eventName: evt.eventName,
      };

      // Save updated state to localStorage
      saveCallStatesToStorage(updated);
      return updated;
    });
  }, [saveCallStatesToStorage]);

  // Memoized function to group devices by DN and deviceName
  const groupDevicesByDnAndDeviceName = useCallback((deviceArray: CtiDevice[]) => {
    return deviceArray.reduce((acc, device) => {
      const { dn, deviceName } = device;
      if (!acc[dn]) acc[dn] = { dn, devices: {} };
      acc[dn].devices[deviceName] = device;
      return acc;
    }, {} as Record<string, { dn: string; devices: Record<string, CtiDevice> }>);
  }, []);

  // Memoized function to update summary data based on current state
  const updateSummaryData = useCallback((dns: Record<string, { dn: string; devices: Record<string, CtiDevice> }>) => {
    let extensions = 0;
    let online = 0;
    let offline = 0;
    let connected = 0;
    let on_hold = 0;
    let answered = 0;
    let incoming = 0;
    let incomingEvents = 0;

    // Count unique extensions (DNs)
    extensions = Object.keys(dns).length;

    // Count devices by terminalState and status
    Object.values(dns).forEach(dnData => {
      Object.values(dnData.devices).forEach(device => {
        if (device.terminalState === 'REGISTERED') online++;
        if (device.terminalState === 'UNREGISTERED') offline++;
        if (device.status === 'CONNECTED') connected++;
        if (device.status === 'ON_HOLD') on_hold++;
        if (device.status === 'ANSWERED') answered++;
      });
    });

    setSummaryData(prev => {
      const newData = { extensions, online, offline, connected, on_hold, answered, incoming, incomingEvents };
      // Only update if data has actually changed
      if (JSON.stringify(prev) !== JSON.stringify(newData)) {
        return newData;
      }
      return prev;
    });
  }, []);

  // Connect to CTI via SSE
  const connect = useCallback(async () => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log('CTI SSE already connected, skipping connection');
      return;
    }

    if (isConnectingRef.current) {
      console.log('CTI SSE connection already in progress, skipping');
      return;
    }

    isConnectingRef.current = true;

    try {
      // Get bearer token (cached or fresh)
      const tokenData = await getToken();
      
      if (!tokenData) {
        throw new Error('Failed to get CTI token');
      }

      const { token, userAddress } = tokenData;
      setUserAddress(userAddress);

      // Build query parameters for CTI STOMP stream
      const params = new URLSearchParams();
      params.append('token', token);
      params.append('userAddress', userAddress);
      
      const sseUrl = `/api/cti-stomp-stream?${params.toString()}`;
      
      console.log('🔗 Creating EventSource with URL:', sseUrl);
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;
      
      console.log('🔗 EventSource created, readyState:', eventSource.readyState);

      eventSource.onopen = () => {
        console.log('✅ CTI SSE Connected successfully');
        console.log('✅ SSE ReadyState:', eventSource.readyState);
        console.log('✅ SSE URL:', sseUrl);
        console.log('✅ SSE withCredentials:', eventSource.withCredentials);
        console.log('✅ SSE CONNECTING state:', EventSource.CONNECTING);
        console.log('✅ SSE OPEN state:', EventSource.OPEN);
        console.log('✅ SSE CLOSED state:', EventSource.CLOSED);
        console.log('✅ EventSource object:', eventSource);
        console.log('✅ EventSource readyState after open:', eventSource.readyState);
        setIsInitialized(true);
        setError(null);
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
        
        // Set connection start time
        setEventStats(prev => ({
          ...prev,
          connectionStartTime: new Date()
        }));
        
        // Add a test event to verify the connection is working
        const testEvent = {
          type: 'connection_test',
          data: { message: 'SSE connection established successfully', timestamp: new Date().toISOString() },
          timestamp: new Date().toISOString(),
          eventCount: 0
        };
        setEventLog(prev => [...prev, testEvent]);
        console.log('✅ Added connection test event to event log');
      };

      eventSource.onmessage = (event) => {
        console.log('🔔 Raw SSE event received:', event);
        console.log('🔔 Event data:', event.data);
        console.log('🔔 Event type:', event.type);
        console.log('🔔 Event lastEventId:', event.lastEventId);
        console.log('🔔 Event origin:', event.origin);
        console.log('🔔 Event source:', event.source);
        console.log('🔔 Event timeStamp:', event.timeStamp);
        
        try {
          const data = JSON.parse(event.data);
          const now = new Date();
          eventCountRef.current += 1;
          
          console.log('✅ Parsed event data:', data);
          console.log('✅ Event count:', eventCountRef.current);
          console.log('✅ Current time:', now.toISOString());
          
          // Update event statistics
          setEventStats(prev => {
            const newStats = {
              ...prev,
              totalEvents: eventCountRef.current,
              lastEventTime: now
            };
            
            // Count by event type
            switch (data.type) {
              case 'complete_state':
                newStats.completeStateEvents++;
                break;
              case 'dns_states':
                newStats.dnsStateEvents++;
                break;
              case 'call_events':
                newStats.callEventEvents++;
                break;
              default:
                newStats.otherEvents++;
                break;
            }
            
            return newStats;
          });
          
          // Log event details like test socket
          console.log(`📨 [${eventCountRef.current}] ${data.type} event received:`);
          console.log('   Data preview:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
          console.log('   Timestamp:', now.toISOString());
          console.log('   ---');
          
          // Handle different message types with optimized processing
          switch (data.type) {
            case 'complete_state':
              try {
                const grouped = groupDevicesByDnAndDeviceName(data.data);
                setDnsMap(grouped);
                updateSummaryData(grouped);
                setEventLog(prev => {
                  const newLog = [...prev, { 
                    type: 'complete_state', 
                    data: grouped, 
                    timestamp: now.toISOString(),
                    eventCount: eventCountRef.current
                  }];
                  // Keep only last 100 events to prevent memory issues
                  return newLog.length > 100 ? newLog.slice(-100) : newLog;
                });
              } catch (err) {
                console.error('Failed to process initial state:', err);
              }
              break;
              
            case 'dns_states':
              try {
                setDnsMap(prev => {
                  const updated = { ...prev };
                  const { dn, deviceName } = data.data;
                  if (!updated[dn]) {
                    updated[dn] = { dn, devices: {} };
                  }
                  updated[dn].devices[deviceName] = data.data;
                  updateSummaryData(updated);
                  return updated;
                });
                
                // Add to event log
                setEventLog(prev => {
                  const newLog = [...prev, { 
                    type: 'dns_states', 
                    data: data.data, 
                    timestamp: now.toISOString(),
                    eventCount: eventCountRef.current
                  }];
                  return newLog.length > 100 ? newLog.slice(-100) : newLog;
                });
              } catch (err) {
                console.error('Failed to process dns-states update:', err);
              }
              break;
              
            case 'call_events':
              try {
                handleCallEvent(data.data);
                
                // Add to event log
                setEventLog(prev => {
                  const newLog = [...prev, { 
                    type: 'call_events', 
                    data: data.data, 
                    timestamp: now.toISOString(),
                    eventCount: eventCountRef.current
                  }];
                  return newLog.length > 100 ? newLog.slice(-100) : newLog;
                });
              } catch (err) {
                console.error('Failed to process call event:', err);
              }
              break;
              
            case 'stomp_connected':
              setIsInitialized(true);
              setError(null);
              break;
              
            case 'stomp_error':
              setError('STOMP error: ' + data.message);
              setIsInitialized(false);
              break;
              
            case 'connection':
              if (data.status === 'disconnected') {
                setIsInitialized(false);
              }
              break;
              
            case 'error':
              setError(data.message);
              setIsInitialized(false);
              break;
              
            case 'ping':
              // Ignore ping messages to reduce console noise
              break;
              
            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
          console.error('❌ Raw event data that failed to parse:', event.data);
          
          // Add error to event log
          setEventLog(prev => {
            const newLog = [...prev, { 
              type: 'parse_error', 
              data: { error: (error as Error).message, rawData: event.data }, 
              timestamp: new Date().toISOString(),
              eventCount: eventCountRef.current
            }];
            return newLog.length > 100 ? newLog.slice(-100) : newLog;
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ CTI SSE connection error:', error);
        console.error('❌ SSE ReadyState:', eventSource.readyState);
        console.error('❌ SSE URL:', sseUrl);
        console.error('❌ EventSource object:', eventSource);
        console.error('❌ Error event details:', {
          type: error.type,
          target: error.target,
          currentTarget: error.currentTarget,
          isTrusted: error.isTrusted,
          timeStamp: error.timeStamp
        });
        setError('CTI SSE connection error');
        setIsInitialized(false);
        isConnectingRef.current = false;
        
        // Clear token cache on error to force fresh token on next attempt
        clearTokenCache();
        
        // Only attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000); // Max 10 seconds
          console.log(`CTI SSE reconnection attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts} in ${delay}ms`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else {
          console.error('CTI SSE max reconnection attempts reached, giving up');
          setError('CTI connection failed after multiple attempts');
        }
      };

    } catch (error) {
      console.error('Error connecting to CTI via SSE:', error);
      setError('Failed to connect to CTI service');
      setIsInitialized(false);
      isConnectingRef.current = false;
      clearTokenCache(); // Clear token cache on error
    }
  }, [groupDevicesByDnAndDeviceName, updateSummaryData, handleCallEvent]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsInitialized(false);
    setError(null);
    isConnectingRef.current = false;
    reconnectAttempts.current = 0; // Reset reconnection attempts
  }, []);

  // Clear token cache
  const clearTokenCache = useCallback(() => {
    tokenRef.current = null;
    userAddressRef.current = null;
    tokenExpiryRef.current = null;
    console.log('CTI token cache cleared');
  }, []);

  // Memoized helper: Get devices array for a DN
  const getDevicesForDn = useCallback((dn: string) => {
    const devices = dnsMap[dn] ? Object.values(dnsMap[dn].devices) : [];
    return devices;
  }, [dnsMap]);

  // Memoized helper: Get calls involving a DN (any device)
  const getCallStatesForDn = useCallback((dn: string) => {
    return Object.values(callStateMap).filter(call =>
      call.parties?.some(
        (p: any) => p.callingAddress === dn || p.calledAddress === dn
      )
    );
  }, [callStateMap]);

  // Memoized helper: Check if DN has any active calls
  const hasActiveCalls = useCallback((dn: string) => {
    return Object.values(callStateMap).some(call =>
      call.parties?.some(
        (p: any) =>
          (p.callingAddress === dn || p.calledAddress === dn) &&
          p.callStatus !== 'DROPPED'
      )
    );
  }, [callStateMap]);

  // Memoized helper: Get call state for DN (most recent call)
  const getDnCallState = useCallback((dn: string) => {
    const calls = getCallStatesForDn(dn);
    if (!calls.length) return null;

    const mostRecent = calls.reduce((a, b) =>
      new Date(b.eventTime) > new Date(a.eventTime) ? b : a
    );

    // Find the participant where this DN appears
    const matchedParty = mostRecent.parties.find(
      (p: any) => p.callingAddress === dn || p.calledAddress === dn
    );

    if (!matchedParty) return null;

    return {
      ...mostRecent,
      role: matchedParty.callingAddress === dn ? 'calling' : 'called',
      isActive: true, // presence implies active, absence is dropped
    };
  }, [getCallStatesForDn]);

  // Memoized helper: Get call state for specific DN-device pair
  const getCallStateForDevice = useCallback((dn: string, deviceName: string) => {
    const calls = Object.values(callStateMap);
    // Find calls where any party matches dn + deviceName
    const filtered = calls.filter(call =>
      call.parties?.some((p: any) =>
        (p.callingAddress === dn && p.callingDeviceName === deviceName) ||
        (p.calledAddress === dn && p.calledDeviceName === deviceName)
      )
    );

    if (!filtered.length) return null;

    // Most recent call
    const mostRecent = filtered.reduce((a, b) =>
      new Date(b.eventTime) > new Date(a.eventTime) ? b : a
    );

    // Matched party
    const matchedParty = mostRecent.parties.find(
      (p: any) =>
        (p.callingAddress === dn && p.callingDeviceName === deviceName) ||
        (p.calledAddress === dn && p.calledDeviceName === deviceName)
    );

    if (!matchedParty) return null;

    return {
      ...mostRecent,
      role: matchedParty.callingAddress === dn ? 'calling' : 'called',
      isActive: true,
    };
  }, [callStateMap]);

  // Clear expired call states from localStorage
  const clearExpiredCallStates = useCallback(() => {
    try {
      const storedTimestamp = localStorage.getItem(CALL_STATES_TIMESTAMP_KEY);
      if (!storedTimestamp) return;

      const timestamp = new Date(storedTimestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > STORAGE_EXPIRY_HOURS) {
        console.log('Clearing expired call states from localStorage');
        localStorage.removeItem(CALL_STATES_STORAGE_KEY);
        localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.error('Error clearing expired call states:', error);
    }
  }, []);

  // Synchronize persisted call states with server state
  const syncPersistedCallStates = useCallback(() => {
    try {
      const storedCallStates = localStorage.getItem(CALL_STATES_STORAGE_KEY);
      if (!storedCallStates) return;

      const parsedCallStates = JSON.parse(storedCallStates);
      console.log('Syncing persisted call states with server:', parsedCallStates);

      // For SSE, we can't directly send messages, so we'll just log
      console.log('Persisted call states available for sync:', Object.keys(parsedCallStates));
    } catch (error) {
      console.error('Error syncing persisted call states:', error);
    }
  }, []);

  // Load persisted call states on component mount
  useEffect(() => {
    loadPersistedCallStates();
    clearExpiredCallStates();
  }, [loadPersistedCallStates, clearExpiredCallStates]);

  // Connect on mount
  useEffect(() => {
    // Add a small delay to prevent immediate connection on mount
    const timer = setTimeout(() => {
      connect();
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, [connect, disconnect]);

  // Reset connection and retry
  const resetConnection = useCallback(() => {
    console.log('Resetting CTI SSE connection...');
    disconnect();
    clearTokenCache(); // Clear token cache on manual reset
    reconnectAttempts.current = 0;
    setTimeout(() => {
      connect();
    }, 2000);
  }, [connect, disconnect, clearTokenCache]);

  // Memoized return object to prevent unnecessary re-renders
  return useMemo(() => ({
    dnsMap,
    callStateMap,
    eventLog,
    setEventLog,
    eventStats,
    error,
    isInitialized,
    userAddress,
    summaryData,
    getDevicesForDn,
    getCallStatesForDn,
    hasActiveCalls,
    getDnCallState,
    getCallStateForDevice,
    clearExpiredCallStates,
    syncPersistedCallStates,
    connect,
    disconnect,
    resetConnection,
    clearTokenCache
  }), [
    dnsMap,
    callStateMap,
    eventLog,
    setEventLog,
    eventStats,
    error,
    isInitialized,
    userAddress,
    summaryData,
    getDevicesForDn,
    getCallStatesForDn,
    hasActiveCalls,
    getDnCallState,
    getCallStateForDevice,
    clearExpiredCallStates,
    syncPersistedCallStates,
    connect,
    disconnect,
    resetConnection,
    clearTokenCache
  ]);
}
