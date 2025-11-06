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
      //console.log('Loading persisted call states from localStorage...')
      const storedTimestamp = localStorage.getItem(CALL_STATES_TIMESTAMP_KEY);
      if (!storedTimestamp) {
       // console.log('No stored timestamp found, no persisted call states to load')
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
        
        // Filter only active calls (not terminated) and normalize currentState
        const activeCallStates = Object.entries(parsedCallStates).reduce((acc, [callId, callEvent]) => {
          const event = callEvent as CtiCallEvent;
          if (!event.isTerminating && event.parties && event.parties.length > 0) {
            // Check if any party is still active (not DROPPED/DISCONNECTED)
            const activeParties = event.parties.filter((p: any) => 
              p.callStatus && 
              p.callStatus !== 'DROPPED' && 
              p.callStatus !== 'DISCONNECTED' &&
              ['CONNECTED', 'RETRIEVED', 'ON_HOLD', 'RINGING', 'ANSWERED'].includes(p.callStatus)
            );
            
            if (activeParties.length > 0) {
              // Normalize currentState if it's DROPPED but there are active parties
              let normalizedState = event.currentState;
              if (event.currentState === 'DROPPED' && activeParties.length > 0) {
                // Determine state from active parties
                const connectedParty = activeParties.find((p: any) => p.callStatus === 'CONNECTED');
                const heldParty = activeParties.find((p: any) => p.callStatus === 'ON_HOLD');
                const retrievedParty = activeParties.find((p: any) => p.callStatus === 'RETRIEVED');
                
                if (heldParty) {
                  normalizedState = 'HELD';
                } else if (retrievedParty) {
                  normalizedState = 'RETRIEVED';
                } else if (connectedParty) {
                  normalizedState = 'ANSWERED'; // Default for CONNECTED
                } else {
                  normalizedState = 'ANSWERED'; // Fallback
                }
              }
              
              // Create normalized event with only active parties (remove DROPPED/DISCONNECTED)
              acc[callId] = {
                ...event,
                currentState: normalizedState,
                parties: activeParties, // Remove DROPPED/DISCONNECTED parties immediately
                hasActiveParticipants: activeParties.length > 0
              };
            }
          }
          return acc;
        }, {} as Record<string, CtiCallEvent>);

        if (Object.keys(activeCallStates).length > 0) {
          setCallStateMap(activeCallStates);
          //console.log('Restored active call states:', activeCallStates);
        } else {
          //console.log('No active call states found in persisted data')
        }
      } else {
        //console.log('No stored call states found')
      }
    } catch (error) {
      //console.error('Error loading persisted call states:', error);
      // Clear corrupted data
      localStorage.removeItem(CALL_STATES_STORAGE_KEY);
      localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
    }
  }, []);

  // Save call states to localStorage
  const saveCallStatesToStorage = useCallback((callStates: Record<string, CtiCallEvent>) => {
    try {
      
      // Only save calls that are CONNECTED or RETRIEVED (not incoming/ringing)
      const callsToPersist = Object.entries(callStates).reduce((acc, [callId, callEvent]) => {
        if (!callEvent.isTerminating && callEvent.parties && callEvent.parties.length > 0) {
          // Check if there are active parties (not DROPPED/DISCONNECTED)
          const activeParties = callEvent.parties.filter((p: any) => 
            p.callStatus && 
            p.callStatus !== 'DROPPED' && 
            p.callStatus !== 'DISCONNECTED' &&
            ['CONNECTED', 'RETRIEVED', 'ON_HOLD'].includes(p.callStatus)
          );
          
          // Check if this is a CONNECTED or RETRIEVED call (established calls only)
          const isConnectedOrRetrieved = activeParties.some((p: any) => {
            const status = p.callStatus;
            return status && ['CONNECTED', 'RETRIEVED'].includes(status);
          });
          
          if (isConnectedOrRetrieved && activeParties.length > 0) {
            // Normalize currentState if it's DROPPED but there are active parties
            let normalizedState = callEvent.currentState;
            if (callEvent.currentState === 'DROPPED' && activeParties.length > 0) {
              const connectedParty = activeParties.find((p: any) => p.callStatus === 'CONNECTED');
              const heldParty = activeParties.find((p: any) => p.callStatus === 'ON_HOLD');
              const retrievedParty = activeParties.find((p: any) => p.callStatus === 'RETRIEVED');
              
              if (heldParty) {
                normalizedState = 'HELD';
              } else if (retrievedParty) {
                normalizedState = 'RETRIEVED';
              } else if (connectedParty) {
                normalizedState = 'ANSWERED';
              } else {
                normalizedState = 'ANSWERED';
              }
            }
            
            acc[callId] = {
              ...callEvent,
              currentState: normalizedState,
              hasActiveParticipants: true
            };
          }
        }
        return acc;
      }, {} as Record<string, CtiCallEvent>);

      if (Object.keys(callsToPersist).length > 0) {
        localStorage.setItem(CALL_STATES_STORAGE_KEY, JSON.stringify(callsToPersist));
        localStorage.setItem(CALL_STATES_TIMESTAMP_KEY, new Date().toISOString());
        
      } else {
        // If no active calls, clear storage
        localStorage.removeItem(CALL_STATES_STORAGE_KEY);
        localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
        
      }
    } catch (error) {
      
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

    // Handle terminating events - remove call immediately
    // This includes DISCONNECTED events with isTerminating: true or all parties DROPPED
    if (evt.isTerminating) {
      setCallStateMap(prev => {
        const { [callId]: _, ...rest } = prev;
        const updated = { ...rest };
        // Save updated state after removing terminated call
        saveCallStatesToStorage(updated);
        return updated;
      });
      
      // Still add terminating events to eventLog so dialer can process them
      setEventLog(prev => {
        const log = [...prev, evt];
        if (log.length > 200) log.shift();
        return log;
      });
      return;
    }
    
    // Also handle DISCONNECTED events even if isTerminating is not explicitly set
    // Check if all parties are DROPPED before processing
    if (evt.eventType === 'DISCONNECTED' && evt.parties) {
      const allPartiesDroppedEarly = evt.parties.length > 0 && 
        evt.parties.every((p: any) => p.callStatus === 'DROPPED' || p.callStatus === 'DISCONNECTED');
      
      if (allPartiesDroppedEarly || evt.hasActiveParticipants === false) {
        setCallStateMap(prev => {
          const { [callId]: _, ...rest } = prev;
          const updated = { ...rest };
          saveCallStatesToStorage(updated);
          return updated;
        });
        
        setEventLog(prev => {
          const log = [...prev, evt];
          if (log.length > 200) log.shift();
          return log;
        });
        return;
      }
    }

    setEventLog(prev => {
      const log = [...prev, evt];
      if (log.length > 200) log.shift();
      return log;
    });

    setCallStateMap(prev => {
      const updated = { ...prev };
      const base = updated[callId] || {};

      // IMPORTANT: Always use new parties if provided in event, otherwise fall back to base parties
      // This ensures that when parties are removed (e.g., barge-in stopped), we use the updated parties
      const partiesToProcess = evt.parties !== undefined && evt.parties !== null 
        ? evt.parties 
        : (base.parties || []);

      // Process parties to ensure callingDeviceType is included
      const processedParties = partiesToProcess.map((party: any) => {
        // console.log(`🔍 Processing party:`, {
        //   callingAddress: party.callingAddress,
        //   callingDeviceName: party.callingDeviceName,
        //   callingDeviceType: party.callingDeviceType,
        //   hasDeviceType: !!party.callingDeviceType
        // });
        
        // First try to get device info from stored caller info
        let storedCallerInfo = null;
        try {
          const stored = localStorage.getItem('cti_caller_info');
          if (stored) {
            storedCallerInfo = JSON.parse(stored);
            console.log(`📋 Found stored caller info:`, storedCallerInfo);
          }
        } catch (error) {
          console.error('Error retrieving stored caller info:', error);
        }
        
        // If we have stored caller info and it matches this party, use it
        if (storedCallerInfo && 
            storedCallerInfo.callingAddress === party.callingAddress && 
            storedCallerInfo.callingDeviceName === party.callingDeviceName) {
          party.callingDeviceType = storedCallerInfo.callingDeviceType;
          console.log(`✅ Using stored caller info:`, {
            deviceName: party.callingDeviceName,
            deviceType: party.callingDeviceType
          });
        }
        // If callingDeviceType is still missing, try to get it from the dnsMap
        else if (!party.callingDeviceType && party.callingAddress && party.callingDeviceName) {
          // console.log(`🔍 Looking up device type for:`, {
          //   callingAddress: party.callingAddress,
          //   callingDeviceName: party.callingDeviceName,
          //   dnsMapHasAddress: !!dnsMap[party.callingAddress],
          //   dnsMapKeys: Object.keys(dnsMap),
          //   dnsMapForAddress: dnsMap[party.callingAddress]
          // });
          
          const userDevices = dnsMap[party.callingAddress]?.devices;
          if (userDevices) {
            
            
            
            const device = Object.values(userDevices).find((d: any) => d.deviceName === party.callingDeviceName);
            if (device) {
              party.callingDeviceType = device.deviceType;
              
            } else {
              
            }
          } else {
           
          }
        } else {
          // console.log(`ℹ️ Device type already present or missing required data:`, {
          //   callingDeviceType: party.callingDeviceType,
          //   callingAddress: party.callingAddress,
          //   callingDeviceName: party.callingDeviceName
          // });
        }
        
        // Fallback: If still no device type, try to infer from device name
        if (!party.callingDeviceType && party.callingDeviceName) {
          let inferredType = 'UNKNOWN';
          const deviceName = party.callingDeviceName.toLowerCase();
          
          if (deviceName.includes('android') || deviceName.includes('mobile')) {
            inferredType = 'ANDROID';
          } else if (deviceName.includes('soft') || deviceName.includes('csf') || deviceName.includes('web')) {
            inferredType = 'SOFT';
          } else if (deviceName.includes('phone') || deviceName.includes('ip')) {
            inferredType = 'IP_PHONE';
          } else if (deviceName.includes('hard') || deviceName.includes('desk')) {
            inferredType = 'HARD';
          }
          
          party.callingDeviceType = inferredType;
          // console.log(`🔄 Inferred device type:`, {
          //   deviceName: party.callingDeviceName,
          //   inferredType: inferredType
          // });
        }
        
        //console.log(`Final party data:`, party);
        return party;
      });

      // IMPORTANT: Remove DROPPED and DISCONNECTED parties from the parties array immediately
      // This ensures they are not stored in call state and won't appear in UI
      const activePartiesOnly = processedParties.filter((p: any) => 
        p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
      );

      // Check if all parties are DROPPED - if so, mark call as terminating
      const allPartiesDropped = processedParties.length > 0 && 
        processedParties.every((p: any) => p.callStatus === 'DROPPED' || p.callStatus === 'DISCONNECTED');
      
      // Check if there are any active (non-DROPPED) parties
      const hasActiveParties = activePartiesOnly.length > 0;
      
      // Terminate if: 
      // 1. Explicitly marked as terminating (DISCONNECTED events with isTerminating: true)
      // 2. All parties dropped/disconnected
      // 3. No active participants flag and we have parties
      // 4. Event type is DISCONNECTED and no active parties (aggressive cleanup)
      // 5. No active parties remain after filtering
      const shouldTerminate = evt.isTerminating || 
        allPartiesDropped || 
        (evt.hasActiveParticipants === false && processedParties.length > 0) ||
        (!hasActiveParties && processedParties.length > 0) ||
        (evt.eventType === 'DISCONNECTED' && !hasActiveParties);


      // Determine the current state based on active parties, not the event type
      // If event is DROPPED but there are still active parties, use the state from active parties
      let effectiveCurrentState = evt.eventType;
      if (evt.eventType === 'DROPPED' && hasActiveParties) {
        // Find the state from active parties (now already filtered)
        const activeParty = activePartiesOnly[0];
        if (activeParty) {
          // Map call status to event type
          if (activeParty.callStatus === 'CONNECTED') {
            effectiveCurrentState = base.currentState || 'ANSWERED'; // Keep previous state or use ANSWERED
          } else if (activeParty.callStatus === 'ON_HOLD') {
            effectiveCurrentState = 'HELD';
          } else if (activeParty.callStatus === 'RETRIEVED') {
            effectiveCurrentState = 'RETRIEVED';
          } else {
            effectiveCurrentState = base.currentState || 'ANSWERED'; // Keep previous state
          }
        } else {
          effectiveCurrentState = base.currentState || evt.eventType; // Fallback to previous state
        }
      }

      // Store only active parties (DROPPED parties are removed immediately)
      updated[callId] = {
        ...base,
        callId,
        currentState: effectiveCurrentState,
        sequence: evt.sequence,
        eventTime: evt.eventTime,
        isConference: evt.isConference,
        isOneToOne: evt.isOneToOne,
        parties: activePartiesOnly, // Only store active parties - DROPPED parties are removed
        isTerminating: shouldTerminate,
        hasActiveParticipants: evt.hasActiveParticipants !== undefined ? evt.hasActiveParticipants : hasActiveParties,
        eventName: evt.eventName,
      };

      // If all parties are dropped or call is terminating, remove the call state
      if (shouldTerminate) {
        const { [callId]: _, ...rest } = updated;
        const cleaned = rest;
        // Save cleaned state to localStorage
        saveCallStatesToStorage(cleaned);
        return cleaned;
      }

      // Cleanup: After processing a DROPPED event for a specific party pair, check if the same party pair
      // exists in other calls with older event times - if so, mark those as stale
      if (evt.eventType === 'DROPPED' && activePartiesOnly.length > 0) {
        // Find all dropped party pairs from this event
        const droppedPartyPairs = processedParties
          .filter((p: any) => p.callStatus === 'DROPPED' || p.callStatus === 'DISCONNECTED')
          .map((p: any) => ({
            calling: p.callingAddress,
            called: p.calledAddress,
            callingDevice: p.callingDeviceName,
            calledDevice: p.calledDeviceName
          }));

        // For each dropped party pair, check if it exists in other calls with older event times
        droppedPartyPairs.forEach((droppedPair: any) => {
          Object.keys(updated).forEach((otherCallId) => {
            if (otherCallId === callId) return; // Skip the current call
            
            const otherCall = updated[otherCallId];
            if (!otherCall || otherCall.isTerminating) return;

            // Check if this call has the same party pair (matching by addresses)
            // Match by addresses - if device names are available and match, that's a bonus but not required
            const matchingParty = otherCall.parties?.find((p: any) => {
              const matchesAddresses = 
                (p.callingAddress === droppedPair.calling && p.calledAddress === droppedPair.called) ||
                (p.callingAddress === droppedPair.called && p.calledAddress === droppedPair.calling);
              
              return matchesAddresses;
            });

            // If we found a matching party and this call's event time is older, mark it as DROPPED
            if (matchingParty && matchingParty.callStatus !== 'DROPPED' && matchingParty.callStatus !== 'DISCONNECTED') {
              const otherCallTime = new Date(otherCall.eventTime || 0).getTime();
              const currentEventTime = new Date(evt.eventTime).getTime();
              
              // If this call is older than the DROPPED event, mark the matching party as DROPPED
              if (otherCallTime < currentEventTime) {
                
                const updatedParties = otherCall.parties.map((p: any) => {
                  const isMatchingParty = 
                    (p.callingAddress === droppedPair.calling && p.calledAddress === droppedPair.called) ||
                    (p.callingAddress === droppedPair.called && p.calledAddress === droppedPair.calling);
                  
                  if (isMatchingParty) {
                    return { ...p, callStatus: 'DROPPED' };
                  }
                  return p;
                });

                // Filter out DROPPED parties
                const activeParties = updatedParties.filter((p: any) =>
                  p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
                );

                // If no active parties remain, mark call as terminating
                if (activeParties.length === 0) {
                  updated[otherCallId] = {
                    ...otherCall,
                    isTerminating: true
                  };
                } else {
                  // Update the call with filtered parties
                  updated[otherCallId] = {
                    ...otherCall,
                    parties: activeParties
                  };
                }
              }
            }
          });
        });
      }

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
        //console.log('response cti connect:', response);

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
      //console.log('brokerURL:', brokerURL);
      
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
        console.log('Connected successfully');
        setIsInitialized(true);
        setError(null);
       // console.log('isInitialized set to true');

        try {
          //console.log('Setting up STOMP subscriptions...');
          
          client.subscribe('/user/topic/complete-state', ({ body }) => {
            try {
              //console.log('complete-state received:', body);
              const payload = JSON.parse(body);
              //console.log('Parsed payload:', payload);
              //console.log('Payload type:', typeof payload);
              //console.log('Is array?', Array.isArray(payload));
              
              // Process the payload and update state
              const grouped = groupDevicesByDnAndDeviceName(payload);
             // console.log('grouped devices:', grouped);
             // console.log('Number of DNs:', Object.keys(grouped).length);
              
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
          //console.log('Sending initial-state request...');
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
              
              console.log('================= CALL EVENTS ====================');
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
      console.log('Initializing connection...');
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
  const getDevicesForDn = useCallback((dn: string) => {
    const devices = dnsMap[dn] ? Object.values(dnsMap[dn].devices) : [];
    console.log(`Getting devices for DN ${dn}:`, devices);
    return devices;
  }, [dnsMap]);

  // Helper: Get calls involving a DN (any device)
  // IMPORTANT: Only return calls where the DN has at least one active (non-DROPPED) party
  const getCallStatesForDn = useCallback((dn: string) => {
    return Object.values(callStateMap).filter(call => {
      // Skip terminating calls
      if (call.isTerminating) return false;
      
      // Check if there's at least one active party for this DN
      return call.parties?.some(
        (p: any) => 
          (p.callingAddress === dn || p.calledAddress === dn) &&
          p.callStatus !== 'DROPPED' &&
          p.callStatus !== 'DISCONNECTED'
      );
    });
  }, [callStateMap]);

  // Helper: Check if DN has any active calls
  // Note: Since we now store only active parties, all parties in the array are already active
  const hasActiveCalls = useCallback((dn: string) => {
    return Object.values(callStateMap).some(call => {
      // Skip terminating calls
      if (call.isTerminating) return false;
      
      // Check if there's a party for this DN (all parties are already active, but check for safety)
      return call.parties?.some(
        (p: any) =>
          (p.callingAddress === dn || p.calledAddress === dn) &&
          p.callStatus !== 'DROPPED' &&
          p.callStatus !== 'DISCONNECTED'
      );
    });
  }, [callStateMap]);

  // Helper: Get call state for DN (most recent call)
  const getDnCallState = useCallback((dn: string) => {
    const calls = getCallStatesForDn(dn);
    if (!calls.length) return null;

    // Filter to only active calls (where at least one party for this DN exists)
    // Note: Since we now store only active parties, all parties in the array are already active
    const activeCalls = calls.filter(call => {
      // Skip terminating calls
      if (call.isTerminating) return false;
      
      // Check if there's a party involving this DN (all parties are already active, but check for safety)
      const dnParties = call.parties?.filter(
        (p: any) => (p.callingAddress === dn || p.calledAddress === dn) &&
        p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
      ) || [];
      
      return dnParties.length > 0;
    });

    if (!activeCalls.length) return null;

    const mostRecent = activeCalls.reduce((a, b) =>
      new Date(b.eventTime) > new Date(a.eventTime) ? b : a
    );

    // Find the participant where this DN appears (all parties are already active, but check for safety)
    const matchedParty = mostRecent.parties.find(
      (p: any) => (p.callingAddress === dn || p.calledAddress === dn) &&
      p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
    );

    if (!matchedParty) return null;

    // Filter out DROPPED/DISCONNECTED parties for safety (shouldn't be any, but check for old data)
    const activeParties = mostRecent.parties.filter((p: any) => 
      p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED'
    );

    if (activeParties.length === 0) return null;

    return {
      ...mostRecent,
      parties: activeParties, // Return only active parties (should already be filtered, but safe check)
      role: matchedParty.callingAddress === dn ? 'calling' : 'called',
      isActive: true,
    };
  }, [getCallStatesForDn]);

  // Helper: Get call state for specific DN-device pair
  const getCallStateForDevice = useCallback((dn: string, deviceName: string) => {
    const calls = Object.values(callStateMap);
    // Find calls where any party matches dn + deviceName
    const filtered = calls.filter(call =>
      call.parties?.some((p: any) =>
        ((p.callingAddress === dn && p.callingDeviceName === deviceName) ||
        (p.calledAddress === dn && p.calledDeviceName === deviceName)) &&
        p.callStatus !== 'DROPPED'
      )
    );

    if (!filtered.length) return null;

    // Most recent call
    const mostRecent = filtered.reduce((a, b) =>
      new Date(b.eventTime) > new Date(a.eventTime) ? b : a
    );

    // Matched party (prefer non-DROPPED)
    const matchedParty = mostRecent.parties.find(
      (p: any) =>
        ((p.callingAddress === dn && p.callingDeviceName === deviceName) ||
        (p.calledAddress === dn && p.calledDeviceName === deviceName)) &&
        p.callStatus !== 'DROPPED'
    );

    if (!matchedParty) return null;

    // Filter out DROPPED parties from the parties array before returning
    const activeParties = mostRecent.parties.filter((p: any) => p.callStatus !== 'DROPPED' && p.callStatus !== 'DISCONNECTED');

    // If no active parties remain after filtering, return null
    if (activeParties.length === 0) return null;

    return {
      ...mostRecent,
      parties: activeParties, // Return only active parties
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
      //console.log('Syncing persisted call states with server:', parsedCallStates);

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

  // Get all call IDs from localStorage where currentState != DISCONNECTED
  const getActiveCallIdsFromLocalStorage = useCallback(() => {
    try {
      const storedCallStates = localStorage.getItem(CALL_STATES_STORAGE_KEY);
      if (!storedCallStates) return [];

      const parsedCallStates = JSON.parse(storedCallStates);
      const activeCallIds = Object.entries(parsedCallStates)
        .filter(([_, callEvent]: [string, any]) => {
          const event = callEvent as CtiCallEvent;
          return event.currentState && event.currentState !== 'DISCONNECTED';
        })
        .map(([callId]) => callId);

      return activeCallIds;
    } catch (error) {
      console.error('Error getting active call IDs from localStorage:', error);
      return [];
    }
  }, []);

  // Get all call IDs from the current callStateMap
  const getAllCallIds = useCallback(() => {
    return Object.keys(callStateMap);
  }, [callStateMap]);

  // Remove calls with isTerminating: true from the store
  const removeTerminatingCalls = useCallback(() => {
    setCallStateMap(prev => {
      const filtered = Object.entries(prev).reduce((acc, [callId, callEvent]) => {
        if (!callEvent.isTerminating) {
          acc[callId] = callEvent;
        }
        return acc;
      }, {} as Record<string, CtiCallEvent>);

      // Save updated state to localStorage
      saveCallStatesToStorage(filtered);
      return filtered;
    });
  }, [saveCallStatesToStorage]);

  // Function that runs when all things are loaded
  const onAllLoaded = useCallback(async (callback: () => void | Promise<void>) => {
    if (isInitialized && dnsMap && Object.keys(dnsMap).length > 0) {
      // Remove terminating calls from store
      removeTerminatingCalls();
      
      // Get active call IDs from localStorage
      const activeCallIds = getActiveCallIdsFromLocalStorage();
      console.log('Active call IDs from localStorage (currentState != DISCONNECTED):', activeCallIds);
      
      // Get all call IDs from current state
      const allCallIds = getAllCallIds();
      console.log('All call IDs from current state:', allCallIds);
      
      // Execute callback (handle both sync and async callbacks)
      await callback();
    }
  }, [isInitialized, dnsMap, removeTerminatingCalls, getActiveCallIdsFromLocalStorage, getAllCallIds]);

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
    getActiveCallIdsFromLocalStorage, // Get call IDs from localStorage where currentState != DISCONNECTED
    getAllCallIds, // Get all call IDs from current state
    removeTerminatingCalls, // Remove calls with isTerminating: true from store
    onAllLoaded, // Function that runs when all things are loaded
  };
} 