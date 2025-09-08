import { Client } from '@stomp/stompjs';
import { useCallback, useEffect, useRef, useState } from 'react';
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

export default function useCtiStomp(wsPath = '/ws') {
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
  
  const clientRef = useRef<Client | null>(null);

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

  // Group devices by DN and deviceName
  const groupDevicesByDnAndDeviceName = (deviceArray: CtiDevice[]) => {
    return deviceArray.reduce((acc, device) => {
      const { dn, deviceName } = device;
      if (!acc[dn]) acc[dn] = { dn, devices: {} };
      acc[dn].devices[deviceName] = device;
      return acc;
    }, {} as Record<string, { dn: string; devices: Record<string, CtiDevice> }>);
  };

  // Update summary data based on current state
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

    setSummaryData({ extensions, online, offline, connected, on_hold, answered, incoming, incomingEvents });
  }, []);

  useEffect(() => {
    const getBearerToken = async (): Promise<{ token: string; userAddress: string } | null> => {
      try {
        const response = await axiosInstance.get('/cti/connect', {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log('response cti connect:', response);

        if (response.status === 200) {
          const data = response.data;
          const token = data.token || data.accessToken || data.bearerToken;
          const userAddress = data.userAddress || data.user_address
          
          if (token && userAddress) {
            return { token, userAddress };
          } else {
            console.error('Missing token or userAddress in API response:', data);
            return null;
          }
        } else {
          console.error('Failed to get bearer token:', response.statusText);
          return null;
        }
      } catch (error) {
        console.error('Error getting bearer token:', error);
        return null;
      }
    };

    const connectWithToken = async (token: string, userAddress: string) => {
      
      const brokerURL = process.env.NEXT_PUBLIC_CTI_SOCKET_URL;
      console.log('brokerURL:', brokerURL);
      
      // Set userAddress in state
      setUserAddress(userAddress);
      
      const client = new Client({
        brokerURL,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          'user-address': userAddress,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: function (str) {
          //console.log('STOMP Debug:', str);
        }
      });

      client.onConnect = () => {
        console.log('STOMP Connected successfully');
        setIsInitialized(true);
        setError(null);
        console.log('isInitialized set to true');

        try {
          console.log('Setting up STOMP subscriptions...');
          
          client.subscribe('/user/topic/complete-state', ({ body }) => {
            try {
              //console.log('complete-state received:', body);
              const payload = JSON.parse(body);
              console.log('Parsed payload:', payload);
              //console.log('Payload type:', typeof payload);
              //console.log('Is array?', Array.isArray(payload));
              
              // Process the payload and update state
              const grouped = groupDevicesByDnAndDeviceName(payload);
              console.log('grouped devices:', grouped);
              console.log('Number of DNs:', Object.keys(grouped).length);
              
              setDnsMap(grouped);
              updateSummaryData(grouped);
              //console.log('Initial state processed successfully');
              console.log('');
              
              
              // Force a re-render by updating a state
              setEventLog(prev => [...prev, { type: 'initial-state', data: grouped, timestamp: new Date().toISOString() }]);
            } catch (err) {
              console.error('Failed to process initial state:', err);
              setError('Failed to process initial state');
            }
          });

          // Send initial-state request
          console.log('Sending initial-state request...');
          client.publish({ destination: '/app/request/initial-state' });

          client.subscribe('/user/topic/dns-states', ({ body }) => {
            try {
              console.log('dns-states received:', body);
              const s = JSON.parse(body);
              setDnsMap(prev => {
                const updated = { ...prev };
                const { dn, deviceName } = s;
                if (!updated[dn]) {
                  updated[dn] = { dn, devices: {} };
                }
                updated[dn].devices[deviceName] = s;
                console.log('updated dns map:', updated);
                updateSummaryData(updated);
                return updated;
              });
            } catch (err) {
              console.error('Failed to process update:', err);
              setError('Failed to process update');
            }
          });

          client.subscribe('/user/topic/call-events', msg => {
            try {
              console.log('call-events received:', msg.body);
              handleCallEvent(JSON.parse(msg.body));
            } catch (err) {
              console.error('Failed to process call event:', err);
              setError('Failed to process call event');
            }
          }, { receipt: 'sub-1' });
          
          //console.log('All STOMP subscriptions set up successfully');
        } catch (err) {
          console.error('Error setting up subscriptions:', err);
          setError('Failed to setup subscriptions');
        }
      };

      client.onStompError = frame => setError('STOMP error: ' + (frame.headers?.message || 'unknown'));
      client.onWebSocketError = ev => setError('WebSocket error: ' + ev.type);
      client.onWebSocketClose = () => setIsInitialized(false);

      client.activate();
      clientRef.current = client;

      return () => {
        if (clientRef.current) {
          clientRef.current.deactivate();
        }
      };
    };

    const initialize = async () => {
      console.log('Initializing CTI STOMP connection...');
      const token = await getBearerToken();
      if (token) {
        //console.log('Bearer token received, connecting to STOMP...');
        await connectWithToken(token.token, token.userAddress);
      } else {
        console.error('Service unavailable');
        setError('Service unavailable');
      }
    };

    initialize();
  }, [handleCallEvent]);

  // Helper: Get devices array for a DN
  const getDevicesForDn = (dn: string) => {
    const devices = dnsMap[dn] ? Object.values(dnsMap[dn].devices) : [];
    console.log(`Getting devices for DN ${dn}:`, devices);
    return devices;
  };

  // Helper: Get calls involving a DN (any device)
  const getCallStatesForDn = (dn: string) => {
    return Object.values(callStateMap).filter(call =>
      call.parties?.some(
        (p: any) => p.callingAddress === dn || p.calledAddress === dn
      )
    );
  };

  // Helper: Check if DN has any active calls
  const hasActiveCalls = (dn: string) => {
    return Object.values(callStateMap).some(call =>
      call.parties?.some(
        (p: any) =>
          (p.callingAddress === dn || p.calledAddress === dn) &&
          p.callStatus !== 'DROPPED'
      )
    );
  };

  // Helper: Get call state for DN (most recent call)
  const getDnCallState = (dn: string) => {
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
  };

  // Helper: Get call state for specific DN-device pair
  const getCallStateForDevice = (dn: string, deviceName: string) => {
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
  };

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

      // Request call state updates for persisted calls
      if (clientRef.current && clientRef.current.connected) {
        Object.keys(parsedCallStates).forEach(callId => {
          clientRef.current?.publish({
            destination: '/app/request/call-state',
            body: JSON.stringify({ callId })
          });
        });
      }
    } catch (error) {
      console.error('Error syncing persisted call states:', error);
    }
  }, []);

  // Load persisted call states on component mount
  useEffect(() => {
    loadPersistedCallStates();
    clearExpiredCallStates();
  }, [loadPersistedCallStates, clearExpiredCallStates]);

  // Sync call states when WebSocket reconnects
  useEffect(() => {
    if (isInitialized && clientRef.current?.connected) {
      // Small delay to ensure subscriptions are ready
      const timer = setTimeout(() => {
        syncPersistedCallStates();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, syncPersistedCallStates]);

  return {
    dnsMap,
    callStateMap,
    eventLog,
    error,
    isInitialized,
    userAddress, // Return userAddress
    summaryData,
    getDevicesForDn,
    getCallStatesForDn,
    hasActiveCalls,
    getDnCallState,
    getCallStateForDevice,
    clearExpiredCallStates, // Export for external use if needed
    syncPersistedCallStates, // Export for external use if needed
  };
} 