'use client';

import React, { createContext, useContext, useCallback, useMemo, ReactNode, useState, useEffect, useRef } from 'react';
import useCtiStomp from '../hooks/useCtiStomp';
import {
  makeCall as makeCallAPI,
  endCall as endCallAPI,
  holdCall as holdCallAPI,
  resumeCall as resumeCallAPI,
  attendCall as attendCallAPI,
  mergeCalls as mergeCallsAPI,
  transferCalls as transferCallsAPI,
  getCallingDeviceInfo,
  getAllUserDevices,
  GetCallLegs
} from '../utils/dialer';
import { getCrossTabCtiManager } from '../utils/crossTabCtiManager';
import moment from 'moment';

// Local storage keys (matching useCtiStomp.ts)
const CALL_STATES_STORAGE_KEY = "cti_call_states";
const CALL_STATES_TIMESTAMP_KEY = "cti_call_states_timestamp";

interface CtiContextType {
  // Connection state
  isInitialized: boolean;
  isReconnecting: boolean;
  error: string | null;
  userAddress: string;
  
  // Data
  dnsMap: Record<string, { dn: string; devices: Record<string, any> }>;
  callStateMap: Record<string, any>;
  eventLog: any[];
  summaryData: {
    extensions: number;
    online: number;
    offline: number;
    connected: number;
    on_hold: number;
    incoming: number;
    answered: number;
    incomingEvents: number;
  };
  
  // Helper functions from useCtiStomp
  getDevicesForDn: (dn: string) => any[];
  getCallStatesForDn: (dn: string) => any[];
  hasActiveCalls: (dn: string) => boolean;
  getDnCallState: (dn: string) => any;
  getCallStateForDevice: (dn: string, deviceName: string) => any;
  getAllCallIds: () => string[];
  getActiveCallIdsFromLocalStorage: () => string[];
  getUserTeams: () => any;
  getUserDataExtensions: () => any;
  
  // Call operations
  makeCall: (params: {
    callingAddress?: string;
    calledAddress: string;
    callingDeviceType?: string;
    callingDeviceName?: string;
  }) => Promise<any>;
  
  // Simplified call function - just pass phone number
  dialNumber: (phoneNumber: string) => Promise<any>;
  
  endCall: (params: {
    callId: string;
    callingAddress: string;
    calledAddress: string;
    callingDeviceType: string;
    callingDeviceName: string;
    controllerAddress?: string;
    controllerDeviceName?: string;
    controllerDeviceType?: string;
  }) => Promise<any>;
  
  holdCall: (params: {
    callId: string;
    callingAddress: string;
    calledAddress: string;
    callingDeviceType: string;
    callingDeviceName: string;
    controllerAddress?: string;
    controllerDeviceName?: string;
    controllerDeviceType?: string;
  }) => Promise<any>;
  
  resumeCall: (params: {
    callId: string;
    callingAddress: string;
    calledAddress: string;
    callingDeviceType: string;
    callingDeviceName: string;
    controllerAddress?: string;
    controllerDeviceName?: string;
    controllerDeviceType?: string;
  }) => Promise<any>;
  
  attendCall: (params: {
    callId: string;
    callingAddress: string;
    calledAddress: string;
    controllerAddress: string;
    controllerDeviceName: string;
    controllerDeviceType: string;
  }) => Promise<any>;
  
  mergeCalls: (params: {
    heldCallId: string;
    activeCallId: string;
    callingAddress: string;
    callingDeviceType: string;
    callingDeviceName: string;
  }) => Promise<any>;
  
  transferCall: (params: {
    callId: string;
    transferInitiatorAddress?: string;
    transferInitiatorDeviceType?: string;
    transferInitiatorDeviceName?: string;
    transferAddress: string;
    targetAddress: string;
    mode: string;
  }) => Promise<any>;
  
  // Device helpers
  getCallingDeviceInfo: () => {
    callingAddress: string;
    callingDeviceType: string;
    callingDeviceName: string;
  } | null;
  
  getAllUserDevices: () => any[] | null;
  
  // Active calls management (for dialer-like functionality)
  activeCalls: Map<string, {
    id: string;
    number: string;
    startTime: Date;
    status: string;
    callId?: string;
    callingAddress?: string;
    calledAddress?: string;
    callingDeviceName?: string;
    callingDeviceType?: string;
    duration?: number;
  }>;
  
  // Utility functions
  formatDuration: (seconds: number) => string;
  getAvailableExtensions: () => string[];
  getActiveCallForNumber: (number: string) => any;
  canDialNumber: (number: string) => { canDial: boolean; reason?: string; existingCall?: any };
}

const CtiContext = createContext<CtiContextType | undefined>(undefined);

interface CtiProviderProps {
  children: ReactNode;
}

export const CtiProvider: React.FC<CtiProviderProps> = ({ children }) => {
  // Use the CTI STOMP hook with a global instance ID
  const ctiStomp = useCtiStomp('/ws', 'global-cti-instance', 'global');
  
  // Cross-tab manager for action forwarding
  const crossTabManagerRef = useRef(getCrossTabCtiManager());
  
  // Active calls state (similar to dialer's activeCalls)
  const [activeCalls, setActiveCalls] = useState<Map<string, {
    id: string;
    number: string;
    startTime: Date;
    status: string;
    callId?: string;
    callingAddress?: string;
    calledAddress?: string;
    callingDeviceName?: string;
    callingDeviceType?: string;
    duration?: number;
  }>>(new Map());
  
  // Populate activeCalls from callStateMap on initialization (from complete_state or localStorage)
  // This ensures in-progress calls are shown after page reload
  // Processes ALL calls from callStateMap (filtering happens at component level)
  useEffect(() => {
    if (!ctiStomp.isInitialized || !ctiStomp.callStateMap) return;
    
    // Process all calls from callStateMap (not filtered by user - filtering happens in components)
    const allCallStates = Object.values(ctiStomp.callStateMap).filter((call: any) => 
      !call.isTerminating && call.parties && call.parties.length > 0
    );
    
    setActiveCalls(prev => {
      const newMap = new Map(prev);
      
      // Process all active calls from callStateMap
      allCallStates.forEach((callState: any) => {
        if (!callState.callId || !callState.parties || callState.parties.length === 0) return;
        
        // Get the first party (or find one that matches userAddress if available)
        const firstParty = callState.parties[0];
        if (!firstParty) return;
        
        const { callId, callingAddress, calledAddress, callingDeviceName, callingDeviceType, callStatus } = firstParty;
        
        // Determine call number from first party
        const callNumber = calledAddress || callingAddress;
        
        // Map CTI status to local status
        let localStatus = 'dialing';
        if (callStatus) {
          switch (callStatus) {
            case 'RINGING': localStatus = 'ringing'; break;
            case 'CONNECTED':
            case 'ANSWERED':
            case 'RETRIEVED': localStatus = 'connected'; break;
            case 'ON_HOLD':
            case 'HELD': localStatus = 'onHold'; break;
            case 'ENDED':
            case 'DISCONNECTED':
            case 'DROPPED': localStatus = 'ended'; break;
            default: localStatus = 'dialing';
          }
        } else if (callState.currentState) {
          // Fallback to callState.currentState if party doesn't have callStatus
          switch (callState.currentState) {
            case 'RINGING': localStatus = 'ringing'; break;
            case 'CONNECTED':
            case 'ANSWERED':
            case 'RETRIEVED': localStatus = 'connected'; break;
            case 'ON_HOLD':
            case 'HELD': localStatus = 'onHold'; break;
            case 'ENDED':
            case 'DISCONNECTED':
            case 'DROPPED': localStatus = 'ended'; break;
            default: localStatus = 'dialing';
          }
        }
        
        // Skip ended calls
        if (localStatus === 'ended') {
          // Remove from map if it exists
          const existingCall = Array.from(newMap.values()).find(call => call.callId === callId);
          if (existingCall) {
            newMap.delete(existingCall.id);
          }
          return;
        }
        
        // Use callId as the key for consistency
        const callKey = callId || `call_${Date.now()}`;
        
        // Calculate startTime from eventTime if available, otherwise use current time
        let startTime = new Date();
        if (callState.eventTime) {
          startTime = new Date(callState.eventTime);
        }
        
        // Calculate duration if call is connected
        let duration = 0;
        if (localStatus === 'connected' && callState.eventTime) {
          const now = new Date();
          const eventTime = moment.utc(callState.eventTime).toDate();
          duration = Math.max(0, Math.round((now.getTime() - eventTime.getTime()) / 1000));
        }
        
        // Check if we already have this call in prev (to preserve any updates from eventLog)
        const existingCall = Array.from(newMap.values()).find(call => 
          call.callId === callId || 
          (call.callingAddress === callingAddress && call.calledAddress === calledAddress)
        );
        if (existingCall) {
          // Update existing call but preserve startTime if it was already set
          newMap.set(existingCall.id, {
            ...existingCall,
            status: localStatus,
            callId: callId || existingCall.callId,
            callingAddress: callingAddress || existingCall.callingAddress,
            calledAddress: calledAddress || existingCall.calledAddress,
            callingDeviceName: callingDeviceName || existingCall.callingDeviceName,
            callingDeviceType: callingDeviceType || existingCall.callingDeviceType,
            startTime: existingCall.startTime || startTime,
            duration: localStatus === 'connected' ? duration : existingCall.duration || 0
          });
        } else {
          // Create new call entry
          newMap.set(callKey, {
            id: callKey,
            number: callNumber,
            status: localStatus,
            startTime: startTime,
            callId: callId,
            callingAddress: callingAddress,
            calledAddress: calledAddress,
            callingDeviceName: callingDeviceName,
            callingDeviceType: callingDeviceType,
            duration: duration
          });
        }
      });
      
      // Note: We don't remove calls that aren't in callStateMap here because:
      // 1. eventLog processing will handle removals when calls end
      // 2. This sync is primarily for initialization from complete_state/localStorage
      // 3. Removing here could cause race conditions with eventLog updates
      
      return newMap;
    });
  }, [ctiStomp.isInitialized, ctiStomp.callStateMap]);
  
  // Process CTI events to update active calls
  useEffect(() => {
    if (!ctiStomp.eventLog || ctiStomp.eventLog.length === 0) return;
    
    const latestEvent = ctiStomp.eventLog[ctiStomp.eventLog.length - 1];
    if (!latestEvent || !latestEvent.parties || latestEvent.parties.length === 0) return;
    
    // For multi-party (e.g. transfer) events, prefer the CONNECTED/active leg so transfer hold uses the right party.
    const activeStatuses = ['CONNECTED', 'ANSWERED', 'RETRIEVED', 'RINGING', 'ON_HOLD'];
    const eventData =
      latestEvent.parties.find((p: any) => p.callStatus && activeStatuses.includes(p.callStatus)) ||
      latestEvent.parties[0];
    const { callId, callingAddress, calledAddress, callStatus, callingDeviceName, callingDeviceType } = eventData;
    
    if (!callId || !callingAddress || !calledAddress) return;
    
    // Determine call number
    const callNumber = calledAddress || callingAddress;
    
    // Map CTI status to local status
    let localStatus = 'dialing';
    if (callStatus) {
      switch (callStatus) {
        case 'RINGING': localStatus = 'ringing'; break;
        case 'CONNECTED':
        case 'ANSWERED':
        case 'RETRIEVED': localStatus = 'connected'; break;
        case 'ON_HOLD': localStatus = 'onHold'; break;
        case 'ENDED':
        case 'DISCONNECTED':
        case 'DROPPED': localStatus = 'ended'; break;
        default: localStatus = 'dialing';
      }
    }
    
    // Update active calls based on event
    setActiveCalls(prev => {
      const newMap = new Map(prev);
      
      // Find existing call by callId or addresses
      let existingCall = Array.from(newMap.values()).find(call => 
        call.callId === callId || 
        (call.callingAddress === callingAddress && call.calledAddress === calledAddress)
      );
      
      if (existingCall) {
        // Update existing call
        const updatedCall = {
          ...existingCall,
          status: localStatus,
          callId: callId || existingCall.callId,
          callingAddress: callingAddress || existingCall.callingAddress,
          calledAddress: calledAddress || existingCall.calledAddress,
          callingDeviceName: callingDeviceName || existingCall.callingDeviceName,
          callingDeviceType: callingDeviceType || existingCall.callingDeviceType,
          startTime: localStatus === 'connected' && existingCall.status !== 'connected' 
            ? new Date() 
            : existingCall.startTime
        };
        
        if (localStatus === 'ended') {
          newMap.delete(existingCall.id);
        } else {
          newMap.set(existingCall.id, updatedCall);
        }
      } else if (localStatus !== 'ended') {
        // Create new call entry
        const newCallId = `call_${Date.now()}`;
        newMap.set(newCallId, {
          id: newCallId,
          number: callNumber,
          status: localStatus,
          startTime: new Date(),
          callId: callId,
          callingAddress: callingAddress,
          calledAddress: calledAddress,
          callingDeviceName: callingDeviceName,
          callingDeviceType: callingDeviceType,
          duration: 0
        });
      }
      
      return newMap;
    });
  }, [ctiStomp.eventLog, ctiStomp.userAddress]);
  
  // Timer effect for call duration
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    const currentActiveCalls = Array.from(activeCalls.entries());
    
    currentActiveCalls.forEach(([callId, call]) => {
      if (call.status === 'connected') {
        const interval = setInterval(() => {
          setActiveCalls(prev => {
            const newMap = new Map(prev);
            const existingCall = newMap.get(callId);
            if (existingCall && existingCall.status === 'connected') {
              const now = new Date();
              const duration = Math.round((now.getTime() - existingCall.startTime.getTime()) / 1000);
              newMap.set(callId, { ...existingCall, duration });
            }
            return newMap;
          });
        }, 1000);
        intervals.push(interval);
      }
    });
    
    return () => {
      intervals.forEach(interval => clearInterval(interval));
    };
  }, [activeCalls.size]);

  // Verify calls from localStorage using GetCallLegs after page reload
  const hasVerifiedCallsRef = useRef(false);
  useEffect(() => {
    // Only run once after initialization and when we have call IDs
    if (!ctiStomp.isInitialized || hasVerifiedCallsRef.current) return;
    
    const verifyCalls = async () => {
      try {
        // Get active call IDs from localStorage
        const activeCallIds = ctiStomp.getActiveCallIdsFromLocalStorage();
        
        if (!activeCallIds || activeCallIds.length === 0) {
          hasVerifiedCallsRef.current = true;
          return;
        }
        
        // Call GetCallLegs to verify which calls are still active
        const response = await GetCallLegs({ callIds: activeCallIds });
        
        if (response.success && response.data) {
          // Extract response data - structure: { responseData: { "callId": { hasActiveParticipants: boolean, ... }, ... } }
          const responseData = response.data.responseData || response.data.data || response.data;
          
          // Determine which call IDs are still active based on hasActiveParticipants field
          // Response structure: keys are call IDs, values are call objects with hasActiveParticipants field
          let activeCallIdsFromAPI: string[] = [];
          
          if (Array.isArray(responseData)) {
            // If it's an array of call legs, check hasActiveParticipants field
            activeCallIdsFromAPI = responseData
              .filter((item: any) => {
                // Check hasActiveParticipants field - if false, call has ended
                const hasActiveParticipants = item.hasActiveParticipants !== undefined 
                  ? item.hasActiveParticipants 
                  : true; // Default to true if field is missing (fail-safe)
                
                // Also check status fields as fallback
                const status = item.status || item.callStatus || item.currentState;
                const isTerminating = item.isTerminating === true;
                
                return hasActiveParticipants && 
                       !isTerminating &&
                       (!status || (status !== 'DISCONNECTED' && status !== 'DROPPED' && status !== 'ENDED'));
              })
              .map((item: any) => item.callId || item.call_id)
              .filter((id: string) => id);
          } else if (typeof responseData === 'object' && responseData !== null) {
            // If it's an object with call IDs as keys (expected structure)
            activeCallIdsFromAPI = Object.entries(responseData)
              .filter(([callId, callData]: [string, any]) => {
                // Check hasActiveParticipants field - primary indicator of active calls
                if (callData && typeof callData === 'object') {
                  const hasActiveParticipants = callData.hasActiveParticipants !== undefined 
                    ? callData.hasActiveParticipants 
                    : true; // Default to true if field is missing (fail-safe)
                  
                  // Also check isTerminating field
                  const isTerminating = callData.isTerminating === true;
                  
                  // Check status fields as fallback
                  const status = callData.status || callData.callStatus || callData.currentState;
                  
                  // Call is active if hasActiveParticipants is true and not terminating
                  return hasActiveParticipants && 
                         !isTerminating &&
                         (!status || (status !== 'DISCONNECTED' && status !== 'DROPPED' && status !== 'ENDED'));
                }
                // If not an object, assume it's a call ID (key is the callId)
                return true;
              })
              .map(([callId, callData]: [string, any]) => {
                // If callData is an object, use its callId field if available, otherwise use the key
                return (callData && typeof callData === 'object' && (callData.callId || callData.call_id)) || callId;
              })
              .filter((id: string) => id);
          }
          
          // Collect call IDs that should be removed (for localStorage cleanup)
          const inactiveCallIds = new Set<string>();
          
          // First, check all calls in responseData to identify inactive ones
          if (responseData && typeof responseData === 'object') {
            Object.entries(responseData).forEach(([callId, callData]: [string, any]) => {
              if (callData && typeof callData === 'object') {
                // Check hasActiveParticipants field - if false, mark for removal
                if (callData.hasActiveParticipants === false) {
                  // Add both the key (callId) and the callId from the object if it exists
                  inactiveCallIds.add(callId);
                  if (callData.callId && callData.callId !== callId) {
                    inactiveCallIds.add(callData.callId);
                  }
                }
              }
            });
          }
          
          // Remove calls from activeCalls that are no longer active according to the API
          setActiveCalls(prev => {
            const newMap = new Map(prev);
            let removedCount = 0;
            
            // Remove calls whose callId is not in the active list from API
            // Also check responseData directly for hasActiveParticipants = false
            Array.from(newMap.entries()).forEach(([callKey, call]) => {
              if (!call.callId) return;
              
              // Check if call exists in responseData
              const callData = responseData && typeof responseData === 'object' && responseData[call.callId];
              
              let shouldRemove = false;
              
              if (callData && typeof callData === 'object') {
                // Check hasActiveParticipants field - if false, remove the call
                if (callData.hasActiveParticipants === false) {
                  shouldRemove = true;
                  inactiveCallIds.add(call.callId);
                }
              }
              
              // Also check if callId is not in the active list
              if (!shouldRemove && !activeCallIdsFromAPI.includes(call.callId)) {
                shouldRemove = true;
                inactiveCallIds.add(call.callId);
              }
              
              if (shouldRemove) {
                newMap.delete(callKey);
                removedCount++;
              }
            });
            
            if (removedCount > 0) {
              console.log(`[CtiContext] Removed ${removedCount} inactive call(s) from activeCalls after GetCallLegs verification (hasActiveParticipants=false or not in active list)`);
            } else {
              console.log(`[CtiContext] All ${activeCallIdsFromAPI.length} call(s) verified as active`);
            }
            
            return newMap;
          });
          
          // Remove inactive calls from localStorage to prevent them from showing on subsequent refreshes
          // This checks ALL calls in localStorage, not just ones in activeCalls
          if (inactiveCallIds.size > 0) {
            try {
              const storedCallStates = localStorage.getItem(CALL_STATES_STORAGE_KEY);
              if (storedCallStates) {
                const parsedCallStates = JSON.parse(storedCallStates);
                let localStorageRemovedCount = 0;
                
                // Remove inactive call IDs from localStorage
                inactiveCallIds.forEach(callId => {
                  if (parsedCallStates[callId]) {
                    delete parsedCallStates[callId];
                    localStorageRemovedCount++;
                  }
                });
                
                // Also check all calls in localStorage against responseData
                Object.keys(parsedCallStates).forEach(callId => {
                  const callData = responseData && typeof responseData === 'object' && responseData[callId];
                  if (callData && typeof callData === 'object' && callData.hasActiveParticipants === false) {
                    delete parsedCallStates[callId];
                    localStorageRemovedCount++;
                  }
                });
                
                // Save updated call states back to localStorage
                if (Object.keys(parsedCallStates).length > 0) {
                  //localStorage.setItem(CALL_STATES_STORAGE_KEY, JSON.stringify(parsedCallStates));
                  //localStorage.setItem(CALL_STATES_TIMESTAMP_KEY, new Date().toISOString());
                } else {
                  // If no active calls remain, clear storage completely
                  localStorage.removeItem(CALL_STATES_STORAGE_KEY);
                  localStorage.removeItem(CALL_STATES_TIMESTAMP_KEY);
                }
                
                if (localStorageRemovedCount > 0) {
                  console.log(`[CtiContext] Removed ${localStorageRemovedCount} inactive call(s) from localStorage`);
                }
              }
            } catch (error) {
              console.error('[CtiContext] Error removing inactive calls from localStorage:', error);
            }
          }
        } else {
          // If API call failed, log but don't remove calls (fail-safe)
          console.warn('[CtiContext] GetCallLegs verification failed, keeping all calls from localStorage');
        }
      } catch (error) {
        console.error('[CtiContext] Error verifying calls with GetCallLegs:', error);
        // On error, keep all calls (fail-safe approach)
      } finally {
        hasVerifiedCallsRef.current = true;
      }
    };
    
    // Add a small delay to ensure callStateMap is populated from localStorage first
    const timer = setTimeout(() => {
      verifyCalls();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [ctiStomp.isInitialized, ctiStomp.getActiveCallIdsFromLocalStorage]);

  // Wrapper functions for call operations that automatically get device info
  const makeCall = useCallback(async (params: {
    callingAddress?: string;
    calledAddress: string;
    callingDeviceType?: string;
    callingDeviceName?: string;
  }) => {
    // If device info is not provided, get it automatically
    let callingAddress = params.callingAddress;
    let callingDeviceType = params.callingDeviceType;
    let callingDeviceName = params.callingDeviceName;
    
    if (!callingAddress || !callingDeviceType || !callingDeviceName) {
      const deviceInfo = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
      if (!deviceInfo) {
        return {
          success: false,
          error: 'No calling device information available'
        };
      }
      callingAddress = callingAddress || deviceInfo.callingAddress;
      callingDeviceType = callingDeviceType || deviceInfo.callingDeviceType;
      callingDeviceName = callingDeviceName || deviceInfo.callingDeviceName;
    }
    const calledAddress = params.calledAddress?.replaceAll(" ", "");
    return await makeCallAPI({
      callingAddress: callingAddress!,
      calledAddress: calledAddress,
      callingDeviceType: callingDeviceType!,
      callingDeviceName: callingDeviceName!
    });
  }, [ctiStomp.userAddress, ctiStomp.dnsMap]);
  
  const endCall = useCallback(async (params: {
    callId: string;
    callingAddress?: string;
    calledAddress: string;
    callingDeviceType?: string;
    callingDeviceName?: string;
    controllerAddress?: string;
    controllerDeviceName?: string;
    controllerDeviceType?: string;
  }) => {
    // If device info is not provided, get it automatically
    let callingAddress = params.callingAddress;
    let callingDeviceType = params.callingDeviceType;
    let callingDeviceName = params.callingDeviceName;
    
    if (!callingAddress || !callingDeviceType || !callingDeviceName) {
      const deviceInfo = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
      if (!deviceInfo) {
        return {
          success: false,
          error: 'No calling device information available'
        };
      }
      callingAddress = callingAddress || deviceInfo.callingAddress;
      callingDeviceType = callingDeviceType || deviceInfo.callingDeviceType;
      callingDeviceName = callingDeviceName || deviceInfo.callingDeviceName;
    }
    
    // Get controller device info if not provided
    let controllerAddress = params.controllerAddress;
    let controllerDeviceName = params.controllerDeviceName;
    let controllerDeviceType = params.controllerDeviceType;
    
    if (!controllerAddress || !controllerDeviceName || !controllerDeviceType) {
      const deviceInfo = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
      if (deviceInfo) {
        controllerAddress = controllerAddress || ctiStomp.userAddress;
        controllerDeviceName = controllerDeviceName || deviceInfo.callingDeviceName;
        controllerDeviceType = controllerDeviceType || deviceInfo.callingDeviceType;
      }
    }
    
    return await endCallAPI({
      callId: params.callId,
      callingAddress: callingAddress!,
      calledAddress: params.calledAddress,
      callingDeviceType: callingDeviceType!,
      callingDeviceName: callingDeviceName!,
      ...(controllerAddress && controllerDeviceName && controllerDeviceType ? {
        controllerAddress,
        controllerDeviceName,
        controllerDeviceType
      } : {})
    } as any);
  }, [ctiStomp.userAddress, ctiStomp.dnsMap]);
  
  const holdCall = useCallback(async (params: {
    callId: string;
    callingAddress?: string;
    calledAddress: string;
    callingDeviceType?: string;
    callingDeviceName?: string;
    controllerAddress?: string;
    controllerDeviceName?: string;
    controllerDeviceType?: string;
  }) => {
    // If device info is not provided, get it automatically
    let callingAddress = params.callingAddress;
    let callingDeviceType = params.callingDeviceType;
    let callingDeviceName = params.callingDeviceName;
    
    if (!callingAddress || !callingDeviceType || !callingDeviceName) {
      const deviceInfo = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
      if (!deviceInfo) {
        return {
          success: false,
          error: 'No calling device information available'
        };
      }
      callingAddress = callingAddress || deviceInfo.callingAddress;
      callingDeviceType = callingDeviceType || deviceInfo.callingDeviceType;
      callingDeviceName = callingDeviceName || deviceInfo.callingDeviceName;
    }
    
    // Get controller device info if not provided
    let controllerAddress = params.controllerAddress;
    let controllerDeviceName = params.controllerDeviceName;
    let controllerDeviceType = params.controllerDeviceType;
    
    if (!controllerAddress || !controllerDeviceName || !controllerDeviceType) {
      const deviceInfo = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
      if (deviceInfo) {
        controllerAddress = controllerAddress || ctiStomp.userAddress;
        controllerDeviceName = controllerDeviceName || deviceInfo.callingDeviceName;
        controllerDeviceType = controllerDeviceType || deviceInfo.callingDeviceType;
      }
    }
    
    return await holdCallAPI({
      callId: params.callId,
      callingAddress: callingAddress!,
      calledAddress: params.calledAddress,
      callingDeviceType: callingDeviceType!,
      callingDeviceName: callingDeviceName!,
      ...(controllerAddress && controllerDeviceName && controllerDeviceType ? {
        controllerAddress,
        controllerDeviceName,
        controllerDeviceType
      } : {})
    } as any);
  }, [ctiStomp.userAddress, ctiStomp.dnsMap]);
  
  const resumeCall = useCallback(async (params: {
    callId: string;
    callingAddress?: string;
    calledAddress: string;
    callingDeviceType?: string;
    callingDeviceName?: string;
    controllerAddress?: string;
    controllerDeviceName?: string;
    controllerDeviceType?: string;
  }) => {
    // If device info is not provided, get it automatically
    let callingAddress = params.callingAddress;
    let callingDeviceType = params.callingDeviceType;
    let callingDeviceName = params.callingDeviceName;
    
    if (!callingAddress || !callingDeviceType || !callingDeviceName) {
      const deviceInfo = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
      if (!deviceInfo) {
        return {
          success: false,
          error: 'No calling device information available'
        };
      }
      callingAddress = callingAddress || deviceInfo.callingAddress;
      callingDeviceType = callingDeviceType || deviceInfo.callingDeviceType;
      callingDeviceName = callingDeviceName || deviceInfo.callingDeviceName;
    }
    
    // Get controller device info if not provided
    let controllerAddress = params.controllerAddress;
    let controllerDeviceName = params.controllerDeviceName;
    let controllerDeviceType = params.controllerDeviceType;
    
    if (!controllerAddress || !controllerDeviceName || !controllerDeviceType) {
      const deviceInfo = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
      if (deviceInfo) {
        controllerAddress = controllerAddress || ctiStomp.userAddress;
        controllerDeviceName = controllerDeviceName || deviceInfo.callingDeviceName;
        controllerDeviceType = controllerDeviceType || deviceInfo.callingDeviceType;
      }
    }
    
    return await resumeCallAPI({
      callId: params.callId,
      callingAddress: callingAddress!,
      calledAddress: params.calledAddress,
      callingDeviceType: callingDeviceType!,
      callingDeviceName: callingDeviceName!,
      ...(controllerAddress && controllerDeviceName && controllerDeviceType ? {
        controllerAddress,
        controllerDeviceName,
        controllerDeviceType
      } : {})
    } as any);
  }, [ctiStomp.userAddress, ctiStomp.dnsMap]);
  
  const attendCall = useCallback(async (params: {
    callId: string;
    callingAddress: string;
    calledAddress: string;
    controllerAddress: string;
    controllerDeviceName: string;
    controllerDeviceType: string;
  }) => {
    return await attendCallAPI(params);
  }, []);
  
  const mergeCalls = useCallback(async (params: {
    heldCallId: string;
    activeCallId: string;
    callingAddress?: string;
    callingDeviceType?: string;
    callingDeviceName?: string;
  }) => {
    // If device info is not provided, get it automatically
    let callingAddress = params.callingAddress;
    let callingDeviceType = params.callingDeviceType;
    let callingDeviceName = params.callingDeviceName;
    
    if (!callingAddress || !callingDeviceType || !callingDeviceName) {
      const deviceInfo = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
      if (!deviceInfo) {
        return {
          success: false,
          error: 'No calling device information available'
        };
      }
      callingAddress = callingAddress || deviceInfo.callingAddress;
      callingDeviceType = callingDeviceType || deviceInfo.callingDeviceType;
      callingDeviceName = callingDeviceName || deviceInfo.callingDeviceName;
    }
    
    return await mergeCallsAPI({
      heldCallId: params.heldCallId,
      activeCallId: params.activeCallId,
      callingAddress: callingAddress!,
      callingDeviceType: callingDeviceType!,
      callingDeviceName: callingDeviceName!
    });
  }, [ctiStomp.userAddress, ctiStomp.dnsMap]);
  
  const transferCall = useCallback(async (params: {
    callId: string;
    transferInitiatorAddress?: string;
    transferInitiatorDeviceType?: string;
    transferInitiatorDeviceName?: string;
    transferAddress: string;
    targetAddress: string;
    mode: string;
  }) => {
    // If device info is not provided, get it automatically
    let transferInitiatorAddress = params.transferInitiatorAddress;
    let transferInitiatorDeviceType = params.transferInitiatorDeviceType;
    let transferInitiatorDeviceName = params.transferInitiatorDeviceName;

    if (!transferInitiatorAddress || !transferInitiatorDeviceType || !transferInitiatorDeviceName) {
      const deviceInfo = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
      if (!deviceInfo) {
        return {
          success: false,
          error: 'No calling device information available'
        };
      }
      transferInitiatorAddress = transferInitiatorAddress || deviceInfo.callingAddress;
      transferInitiatorDeviceType = transferInitiatorDeviceType || deviceInfo.callingDeviceType;
      transferInitiatorDeviceName = transferInitiatorDeviceName || deviceInfo.callingDeviceName;
    }

    // Before transfer: put the active call on hold. Hold payload must use the logged-in user as controller
    // so it's correct whether 531 or 532 is the user: callingAddress = current user, calledAddress = other party.
    const initiator = transferInitiatorAddress!;
    const controllerAddress = ctiStomp.userAddress;
    const controllerDevice = getCallingDeviceInfo(controllerAddress, ctiStomp.dnsMap);
    if (!controllerDevice) {
      return {
        success: false,
        error: 'No device information for current user. Cannot put call on hold for transfer.',
      };
    }

    console.log('activeCalls 1234', activeCalls);
    

    const callEntry = Array.from(activeCalls.values()).find((c) => c.callId === params.callId);
    

    if (!callEntry?.callingAddress || !callEntry?.calledAddress) {
      return { success: false, error: "Missing calling/called addresses for this call." };
    }
    
    const holdResult = await holdCallAPI({
      callId: params.callId,
      
      // ✅ preserve original direction from the call itself (never derive from controller)
      callingAddress: callEntry.callingAddress ,
      calledAddress: callEntry.calledAddress ,
      
      // ✅ keep device info aligned with the calling side of the call direction
      callingDeviceType: callEntry?.callingDeviceType || '',
      callingDeviceName: callEntry?.callingDeviceName || '',
      
      // ✅ controller = logged-in user performing the action
      controllerAddress: controllerAddress,
      controllerDeviceName: controllerDevice.callingDeviceName,
      controllerDeviceType: controllerDevice.callingDeviceType,
      });
    if (!holdResult.success) {
      return holdResult;
    }

    return await transferCallsAPI({
      callId: params.callId,
      transferInitiatorAddress: transferInitiatorAddress!,
      transferInitiatorDeviceType: transferInitiatorDeviceType!,
      transferInitiatorDeviceName: transferInitiatorDeviceName!,
      transferAddress: params.transferAddress,
      targetAddress: params.targetAddress,
      mode: "CONSULT",
    });
  }, [ctiStomp.userAddress, ctiStomp.dnsMap, activeCalls]);
  
  // Device helper functions
  const getCallingDeviceInfoHelper = useCallback(() => {
    return getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
  }, [ctiStomp.userAddress, ctiStomp.dnsMap]);
  
  const getAllUserDevicesHelper = useCallback(() => {
    return getAllUserDevices(ctiStomp.userAddress, ctiStomp.dnsMap);
  }, [ctiStomp.userAddress, ctiStomp.dnsMap]);
  
  // Utility functions
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  const getAvailableExtensions = useCallback(() => {
    return Object.values(ctiStomp.dnsMap)
      .filter(({ dn }) => dn !== ctiStomp.userAddress)
      .map(({ dn }) => dn);
  }, [ctiStomp.dnsMap, ctiStomp.userAddress]);
  
  const getActiveCallForNumber = useCallback((number: string) => {
    return Array.from(activeCalls.values()).find(call => 
      call.number === number && 
      ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status)
    );
  }, [activeCalls]);
  
  const canDialNumber = useCallback((number: string) => {
    const existingCall = Array.from(activeCalls.values()).find(call => 
      call.number === number && 
      ['dialing', 'ringing', 'connected', 'onHold'].includes(call.status)
    );
    
    if (existingCall) {
      return {
        canDial: false,
        reason: `Number ${number} is already in a ${existingCall.status} call`,
        existingCall
      };
    }
    
    return { canDial: true };
  }, [activeCalls]);
  
  // Helper function to execute dial action (used by both master and forwarded requests)
  const executeDialNumber = useCallback(async (phoneNumber: string) => {
    if (!phoneNumber || !phoneNumber.trim()) {
      return {
        success: false,
        error: 'Phone number is required'
      };
    }
    
    // Clean the phone number: remove spaces, dashes, brackets, and other formatting characters
    // Keep only digits, +, *, and # (for extensions and special dialing)
    const cleanedNumber = phoneNumber
      .replace(/\s+/g, '')           // Remove all spaces
      .replace(/-/g, '')              // Remove dashes
      .replace(/[()]/g, '')           // Remove brackets
      .replace(/[\[\]]/g, '')         // Remove square brackets
      .replace(/[{}]/g, '')           // Remove curly braces
      .replace(/\./g, '')              // Remove dots
      .trim();
    
    if (!cleanedNumber) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }
    
    // Check if we can dial this number (use cleaned number)
    const dialCheck = canDialNumber(cleanedNumber);
    if (!dialCheck.canDial) {
      return {
        success: false,
        error: dialCheck.reason || 'Cannot dial this number'
      };
    }
    
    // Get device info automatically
    const deviceInfo = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
    if (!deviceInfo) {
      return {
        success: false,
        error: 'No calling device information available'
      };
    }
    
    // Check if user has multiple devices
    const userDevices = getAllUserDevices(ctiStomp.userAddress, ctiStomp.dnsMap);
    if (userDevices && userDevices.length > 1) {
      // For multiple devices, use the first registered device or first available
      const registeredDevice = userDevices.find((d: any) => d.terminalState === 'REGISTERED') || userDevices[0];
      return await makeCallAPI({
        callingAddress: ctiStomp.userAddress,
        calledAddress: cleanedNumber,
        callingDeviceType: registeredDevice.deviceType,
        callingDeviceName: registeredDevice.deviceName
      });
    }
    
    // Use the device info we got
    return await makeCallAPI({
      callingAddress: deviceInfo.callingAddress,
      calledAddress: cleanedNumber,
      callingDeviceType: deviceInfo.callingDeviceType,
      callingDeviceName: deviceInfo.callingDeviceName
    });
  }, [ctiStomp.userAddress, ctiStomp.dnsMap, canDialNumber]);

  // Simplified dial function - just takes phone number
  // This is the main function other pages should use to trigger calls
  // Forwards to master tab if not master
  const dialNumber = useCallback(async (phoneNumber: string) => {
    const manager = crossTabManagerRef.current;
    
    // If we're not the master tab and cross-tab is supported, forward to master
    if (!manager.isMasterTab() && manager.isCrossTabSupported()) {
      try {
        const result = await manager.requestAction('dialNumber', { phoneNumber });
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to forward call request to master tab'
        };
      }
    }
    
    // We're the master tab, execute directly
    return await executeDialNumber(phoneNumber);
  }, [executeDialNumber]);

  // Listen for action requests from non-master tabs (master tab only)
  // This must be after all function definitions
  useEffect(() => {
    const manager = crossTabManagerRef.current;
    
    if (!manager.isCrossTabSupported()) {
      return;
    }

    // Only master tab listens for action requests
    if (!manager.isMasterTab()) {
      return;
    }

    const unsubscribe = manager.onActionRequest(async (event) => {
      if (event.type !== 'action_request' || !event.data || !event.actionId) {
        return;
      }

      const { actionType, actionData } = event.data;
      
      try {
        let result: any;

        switch (actionType) {
          case 'dialNumber':
            result = await executeDialNumber(actionData.phoneNumber);
            break;
          
          case 'makeCall':
            result = await makeCall(actionData);
            break;
          
          case 'endCall':
            result = await endCall(actionData);
            break;
          
          case 'holdCall':
            result = await holdCall(actionData);
            break;
          
          case 'resumeCall':
            result = await resumeCall(actionData);
            break;
          
          case 'attendCall':
            result = await attendCall(actionData);
            break;
          
          case 'mergeCalls':
            result = await mergeCalls(actionData);
            break;
          
          case 'transferCall':
            result = await transferCall(actionData);
            break;
          
          default:
            result = {
              success: false,
              error: `Unknown action type: ${actionType}`
            };
        }

        // Send response back to requesting tab
        manager.sendActionResponse(event.actionId!, result, result.error);
      } catch (error: any) {
        // Send error response
        manager.sendActionResponse(
          event.actionId!,
          undefined,
          error.message || 'Failed to execute action'
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [executeDialNumber, makeCall, endCall, holdCall, resumeCall, attendCall, mergeCalls, transferCall]);
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<CtiContextType>(() => ({
    // Connection state
    isInitialized: ctiStomp.isInitialized,
    isReconnecting: ctiStomp.isReconnecting,
    error: ctiStomp.error,
    userAddress: ctiStomp.userAddress,
    
    // Data
    dnsMap: ctiStomp.dnsMap,
    callStateMap: ctiStomp.callStateMap,
    eventLog: ctiStomp.eventLog,
    summaryData: ctiStomp.summaryData,
    
    // Helper functions
    getDevicesForDn: ctiStomp.getDevicesForDn,
    getCallStatesForDn: ctiStomp.getCallStatesForDn,
    hasActiveCalls: ctiStomp.hasActiveCalls,
    getDnCallState: ctiStomp.getDnCallState,
    getCallStateForDevice: ctiStomp.getCallStateForDevice,
    getAllCallIds: ctiStomp.getAllCallIds,
    getActiveCallIdsFromLocalStorage: ctiStomp.getActiveCallIdsFromLocalStorage,
    getUserTeams: ctiStomp.getUserTeams,
    getUserDataExtensions: ctiStomp.getUserDataExtensions,
    
    // Call operations
    makeCall,
    dialNumber,
    endCall,
    holdCall,
    resumeCall,
    attendCall,
    mergeCalls,
    transferCall,
    
    // Device helpers
    getCallingDeviceInfo: getCallingDeviceInfoHelper,
    getAllUserDevices: getAllUserDevicesHelper,
    
    // Active calls management
    activeCalls,
    
    // Utility functions
    formatDuration,
    getAvailableExtensions,
    getActiveCallForNumber,
    canDialNumber,
  }), [
    ctiStomp.isInitialized,
    ctiStomp.error,
    ctiStomp.userAddress,
    ctiStomp.dnsMap,
    ctiStomp.callStateMap,
    ctiStomp.eventLog,
    ctiStomp.summaryData,
    ctiStomp.getDevicesForDn,
    ctiStomp.getCallStatesForDn,
    ctiStomp.hasActiveCalls,
    ctiStomp.getDnCallState,
    ctiStomp.getCallStateForDevice,
    ctiStomp.getAllCallIds,
    ctiStomp.getActiveCallIdsFromLocalStorage,
    ctiStomp.getUserTeams,
    ctiStomp.getUserDataExtensions,
    makeCall,
    dialNumber,
    endCall,
    holdCall,
    resumeCall,
    attendCall,
    mergeCalls,
    transferCall,
    getCallingDeviceInfoHelper,
    getAllUserDevicesHelper,
    activeCalls,
    formatDuration,
    getAvailableExtensions,
    getActiveCallForNumber,
    canDialNumber,
  ]);
  
  return (
    <CtiContext.Provider value={value}>
      {children}
    </CtiContext.Provider>
  );
};

// Custom hook to use the CTI context
export const useCti = (): CtiContextType => {
  const context = useContext(CtiContext);
  if (context === undefined) {
    throw new Error('useCti must be used within a CtiProvider');
  }
  return context;
};

