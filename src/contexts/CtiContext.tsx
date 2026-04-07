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
  getRemotePartyDnForTransfer,
  getAllUserDevices,
  GetCallLegs,
  type HoldCallParams,
} from '../utils/dialer';
import { getCrossTabCtiManager } from '../utils/crossTabCtiManager';
import { parseCallAnswerStartTimeUtc } from '@components/live-calls/utils/helpers';

// Local storage keys (matching useCtiStomp.ts)
const CALL_STATES_STORAGE_KEY = "cti_call_states";
const CALL_STATES_TIMESTAMP_KEY = "cti_call_states_timestamp";

type ActiveCallMapValue = {
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
};

const CTI_TERMINAL_PARTY_STATUSES = new Set(['ENDED', 'DISCONNECTED', 'DROPPED']);

function mapCtiCallStatusToLocalStatus(callStatus: string | undefined): string {
  if (!callStatus) {
    return 'dialing';
  }
  switch (callStatus) {
    case 'RINGING':
      return 'ringing';
    case 'CONNECTED':
    case 'ANSWERED':
    case 'RETRIEVED':
      return 'connected';
    case 'ON_HOLD':
    case 'HELD':
      return 'onHold';
    case 'ENDED':
    case 'DISCONNECTED':
    case 'DROPPED':
      return 'ended';
    default:
      return 'dialing';
  }
}

function localStatusFromCallStateRecord(callState: {
  currentState?: string;
  parties?: Array<{ callStatus?: string }>;
}): string {
  const parties = callState.parties;
  if (parties?.length) {
    const activeLike = new Set([
      'CONNECTED',
      'ANSWERED',
      'RETRIEVED',
      'RINGING',
      'ON_HOLD',
      'HELD',
    ]);
    const hasActiveLeg = parties.some((p) => activeLike.has(p.callStatus ?? ''));
    const allTerminal = parties.every((p) => CTI_TERMINAL_PARTY_STATUSES.has(p.callStatus ?? ''));
    if (allTerminal || (!hasActiveLeg && parties.some((p) => CTI_TERMINAL_PARTY_STATUSES.has(p.callStatus ?? '')))) {
      return 'ended';
    }
  }
  const firstParty = parties?.[0];
  const source = firstParty?.callStatus ?? callState.currentState;
  return mapCtiCallStatusToLocalStatus(source);
}

function removeCallByCallIdFromMap(newMap: Map<string, ActiveCallMapValue>, callId: string): void {
  const existingCall = Array.from(newMap.values()).find((c) => c.callId === callId);
  if (existingCall) {
    newMap.delete(existingCall.id);
  }
}

function mergeCallStateIntoMap(newMap: Map<string, ActiveCallMapValue>, callState: any): void {
  if (!callState.callId || !callState.parties?.length) {
    return;
  }
  const firstParty = callState.parties[0];
  if (!firstParty) {
    return;
  }

  const { callId, callingAddress, calledAddress, callingDeviceName, callingDeviceType } = firstParty;
  const localStatus = localStatusFromCallStateRecord(callState);

  if (localStatus === 'ended') {
    removeCallByCallIdFromMap(newMap, callId);
    return;
  }

  const callNumber = calledAddress || callingAddress;
  const callKey = callId || `call_${Date.now()}`;

  const parsedApiStart = parseCallAnswerStartTimeUtc(callState);
  const startTime = parsedApiStart ?? new Date();

  let duration = 0;
  if (localStatus === 'connected' && parsedApiStart) {
    const now = new Date();
    duration = Math.max(0, Math.round((now.getTime() - parsedApiStart.getTime()) / 1000));
  }

  const existingCall = Array.from(newMap.values()).find(
    (call) =>
      call.callId === callId ||
      (call.callingAddress === callingAddress && call.calledAddress === calledAddress),
  );

  if (existingCall) {
    newMap.set(existingCall.id, {
      ...existingCall,
      status: localStatus,
      callId: callId || existingCall.callId,
      callingAddress: callingAddress || existingCall.callingAddress,
      calledAddress: calledAddress || existingCall.calledAddress,
      callingDeviceName: callingDeviceName || existingCall.callingDeviceName,
      callingDeviceType: callingDeviceType || existingCall.callingDeviceType,
      startTime: existingCall.startTime || startTime,
      duration: localStatus === 'connected' ? duration : existingCall.duration || 0,
    });
    return;
  }

  newMap.set(callKey, {
    id: callKey,
    number: callNumber,
    status: localStatus,
    startTime,
    callId,
    callingAddress,
    calledAddress,
    callingDeviceName,
    callingDeviceType,
    duration,
  });
}

/** Rebuild activeCalls from CTI call state only — avoids stale entries from merge-with-previous. */
function buildActiveCallsMapFromCallStateMap(
  callStateMap: Record<string, unknown> | null | undefined,
): Map<string, ActiveCallMapValue> {
  const newMap = new Map<string, ActiveCallMapValue>();
  if (!callStateMap || typeof callStateMap !== 'object') {
    return newMap;
  }
  const allCallStates = Object.values(callStateMap).filter(
    (call: unknown) =>
      call &&
      typeof call === 'object' &&
      !(call as { isTerminating?: boolean }).isTerminating &&
      Array.isArray((call as { parties?: unknown[] }).parties) &&
      (call as { parties: unknown[] }).parties.length > 0,
  );
  allCallStates.forEach((callState) => {
    mergeCallStateIntoMap(newMap, callState as any);
  });
  return newMap;
}

function isCallLegParticipantActive(item: Record<string, unknown>): boolean {
  if (item.hasActiveParticipants === false) {
    return false;
  }
  if (item.isTerminating === true) {
    return false;
  }
  const status = item.status ?? item.callStatus ?? item.currentState;
  if (status === 'DISCONNECTED' || status === 'DROPPED' || status === 'ENDED') {
    return false;
  }
  return true;
}

function isObjectCallEntryActive(callData: unknown): boolean {
  if (!callData || typeof callData !== 'object') {
    return true;
  }
  return isCallLegParticipantActive(callData as Record<string, unknown>);
}

function collectActiveCallIdsFromResponseData(responseData: unknown): string[] {
  if (Array.isArray(responseData)) {
    return responseData
      .filter((item: unknown) => isCallLegParticipantActive(item as Record<string, unknown>))
      .map((item: any) => item.callId || item.call_id)
      .filter((id: unknown): id is string => Boolean(id));
  }
  if (typeof responseData === 'object' && responseData !== null) {
    return Object.entries(responseData as Record<string, unknown>)
      .filter(([, callData]) => isObjectCallEntryActive(callData))
      .map(([callId, callData]) => {
        if (callData && typeof callData === 'object') {
          const o = callData as Record<string, unknown>;
          const id = o.callId ?? o.call_id;
          if (typeof id === 'string' && id) {
            return id;
          }
        }
        return callId;
      })
      .filter((id: unknown): id is string => Boolean(id));
  }
  return [];
}

function mergeInactiveCallIdsFromResponseObject(
  responseData: unknown,
  inactiveCallIds: Set<string>,
): void {
  if (!responseData || typeof responseData !== 'object' || Array.isArray(responseData)) {
    return;
  }
  Object.entries(responseData as Record<string, unknown>).forEach(([callId, callData]) => {
    if (!callData || typeof callData !== 'object') {
      return;
    }
    const o = callData as Record<string, unknown>;
    if (o.hasActiveParticipants !== false) {
      return;
    }
    inactiveCallIds.add(callId);
    const nestedId = o.callId;
    if (typeof nestedId === 'string' && nestedId !== callId) {
      inactiveCallIds.add(nestedId);
    }
  });
}

function pruneCallsAfterVerification(
  newMap: Map<string, ActiveCallMapValue>,
  responseData: unknown,
  activeCallIdsFromAPI: string[],
  inactiveCallIds: Set<string>,
): number {
  let removedCount = 0;
  const responseRecord =
    responseData && typeof responseData === 'object' && !Array.isArray(responseData)
      ? (responseData as Record<string, unknown>)
      : null;

  Array.from(newMap.entries()).forEach(([callKey, call]) => {
    if (!call.callId) {
      return;
    }

    let shouldRemove = false;
    const callData = responseRecord?.[call.callId];

    if (callData && typeof callData === 'object') {
      const o = callData as Record<string, unknown>;
      if (o.hasActiveParticipants === false) {
        shouldRemove = true;
        inactiveCallIds.add(call.callId);
      }
    }

    if (!shouldRemove && !activeCallIdsFromAPI.includes(call.callId)) {
      shouldRemove = true;
      inactiveCallIds.add(call.callId);
    }

    if (shouldRemove) {
      newMap.delete(callKey);
      removedCount += 1;
    }
  });

  return removedCount;
}

function logActiveCallsVerificationOutcome(
  removedCount: number,
  activeCallIdsFromAPI: string[],
): void {
  if (removedCount > 0) {
    console.log(
      `[CtiContext] Removed ${removedCount} inactive call(s) from activeCalls after GetCallLegs verification (hasActiveParticipants=false or not in active list)`,
    );
    return;
  }
  console.log(`[CtiContext] All ${activeCallIdsFromAPI.length} call(s) verified as active`);
}

function handleGetCallLegsSuccess(
  responseData: unknown,
  currentActiveCalls: Map<string, ActiveCallMapValue>,
  removeCallIdsFromCallStateMap: (ids: string[]) => void,
): void {
  const activeCallIdsFromAPI = collectActiveCallIdsFromResponseData(responseData);
  const inactiveCallIds = new Set<string>();
  mergeInactiveCallIdsFromResponseObject(responseData, inactiveCallIds);

  const tempMap = new Map(currentActiveCalls);
  const removedCount = pruneCallsAfterVerification(
    tempMap,
    responseData,
    activeCallIdsFromAPI,
    inactiveCallIds,
  );
  logActiveCallsVerificationOutcome(removedCount, activeCallIdsFromAPI);

  const idsToRemove = Array.from(inactiveCallIds);
  if (idsToRemove.length > 0) {
    removeCallIdsFromCallStateMap(idsToRemove);
  }
}

function tickConnectedCallDuration(
  callId: string,
  setActiveCalls: React.Dispatch<React.SetStateAction<Map<string, ActiveCallMapValue>>>,
): void {
  setActiveCalls((prev) => {
    const newMap = new Map(prev);
    const existingCall = newMap.get(callId);
    if (existingCall?.status === 'connected') {
      const now = new Date();
      const duration = Math.round((now.getTime() - existingCall.startTime.getTime()) / 1000);
      newMap.set(callId, { ...existingCall, duration });
    }
    return newMap;
  });
}

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
  activeCalls: Map<string, ActiveCallMapValue>;
  
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
  const [activeCalls, setActiveCalls] = useState<Map<string, ActiveCallMapValue>>(new Map());
  const activeCallsRef = useRef(activeCalls);
  activeCallsRef.current = activeCalls;

  // activeCalls is derived from callStateMap (updated by CTI events in useCtiStomp) — single source of truth.
  useEffect(() => {
    if (!ctiStomp.isInitialized || !ctiStomp.callStateMap) {
      return;
    }
    setActiveCalls(
      buildActiveCallsMapFromCallStateMap(ctiStomp.callStateMap as Record<string, unknown>),
    );
  }, [ctiStomp.isInitialized, ctiStomp.callStateMap]);

  // Timer effect for call duration
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    
    const currentActiveCalls = Array.from(activeCalls.entries());
    
    currentActiveCalls.forEach(([callId, call]) => {
      if (call.status !== 'connected') {
        return;
      }
      const interval = setInterval(() => tickConnectedCallDuration(callId, setActiveCalls), 1000);
      intervals.push(interval);
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
          const responseData = response.data.responseData || response.data.data || response.data;
          handleGetCallLegsSuccess(
            responseData,
            activeCallsRef.current,
            ctiStomp.removeCallIdsFromCallStateMap,
          );
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
  }, [ctiStomp.isInitialized, ctiStomp.getActiveCallIdsFromLocalStorage, ctiStomp.removeCallIdsFromCallStateMap]);

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
    if (!callingAddress || !callingDeviceType || !callingDeviceName) {
      return {
        success: false,
        error: 'No calling device information available',
      };
    }
    const calledAddress = params.calledAddress?.replaceAll(' ', '');
    return await makeCallAPI({
      callingAddress,
      calledAddress,
      callingDeviceType,
      callingDeviceName,
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

    if (!callingAddress || !callingDeviceType || !callingDeviceName) {
      return {
        success: false,
        error: 'No calling device information available',
      };
    }

    const result = await endCallAPI({
      callId: params.callId,
      callingAddress,
      calledAddress: params.calledAddress,
      callingDeviceType,
      callingDeviceName,
      ...(controllerAddress && controllerDeviceName && controllerDeviceType
        ? {
            controllerAddress,
            controllerDeviceName,
            controllerDeviceType,
          }
        : {}),
    } as HoldCallParams);

    if (result.success && params.callId) {
      ctiStomp.removeCallIdsFromCallStateMap([params.callId]);
    }

    return result;
  }, [ctiStomp.userAddress, ctiStomp.dnsMap, ctiStomp.removeCallIdsFromCallStateMap]);
  
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

    if (!callingAddress || !callingDeviceType || !callingDeviceName) {
      return {
        success: false,
        error: 'No calling device information available',
      };
    }

    return await holdCallAPI({
      callId: params.callId,
      callingAddress,
      calledAddress: params.calledAddress,
      callingDeviceType,
      callingDeviceName,
      ...(controllerAddress && controllerDeviceName && controllerDeviceType
        ? {
            controllerAddress,
            controllerDeviceName,
            controllerDeviceType,
          }
        : {}),
    } as HoldCallParams);
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

    if (!callingAddress || !callingDeviceType || !callingDeviceName) {
      return {
        success: false,
        error: 'No calling device information available',
      };
    }

    return await resumeCallAPI({
      callId: params.callId,
      callingAddress,
      calledAddress: params.calledAddress,
      callingDeviceType,
      callingDeviceName,
      ...(controllerAddress && controllerDeviceName && controllerDeviceType
        ? {
            controllerAddress,
            controllerDeviceName,
            controllerDeviceType,
          }
        : {}),
    } as HoldCallParams);
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

    if (!callingAddress || !callingDeviceType || !callingDeviceName) {
      return {
        success: false,
        error: 'No calling device information available',
      };
    }

    return await mergeCallsAPI({
      heldCallId: params.heldCallId,
      activeCallId: params.activeCallId,
      callingAddress,
      callingDeviceType,
      callingDeviceName,
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

    if (
      !transferInitiatorAddress ||
      !transferInitiatorDeviceType ||
      !transferInitiatorDeviceName
    ) {
      return {
        success: false,
        error: 'No calling device information available',
      };
    }

    // Before transfer: put the active call on hold. Hold payload must use the logged-in user as controller
    // so it's correct whether 531 or 532 is the user: callingAddress = current user, calledAddress = other party.
    const controllerDevice = getCallingDeviceInfo(ctiStomp.userAddress, ctiStomp.dnsMap);
    if (!controllerDevice) {
      return {
        success: false,
        error: 'No device information for current user. Cannot put call on hold for transfer.',
      };
    }

    const callEntry = Array.from(activeCalls.values()).find((c) => c.callId === params.callId);

    if (!callEntry?.callingAddress || !callEntry?.calledAddress) {
      return { success: false, error: 'Missing calling/called addresses for this call.' };
    }

    const holdResult = await holdCallAPI({
      callId: params.callId,
      callingAddress: callEntry.callingAddress,
      calledAddress: callEntry.calledAddress,
      callingDeviceType: callEntry.callingDeviceType || '',
      callingDeviceName: callEntry.callingDeviceName || '',
      controllerAddress: transferInitiatorAddress,
      controllerDeviceName: transferInitiatorDeviceName,
      controllerDeviceType: transferInitiatorDeviceType == "SOFT" ? "SOFT_HARD" : transferInitiatorDeviceType,
    });
    if (!holdResult.success) {
      return holdResult;
    }

    const transferAddress = getRemotePartyDnForTransfer(
      ctiStomp.userAddress,
      callEntry.callingAddress,
      callEntry.calledAddress,
    ) || params.transferAddress
    return await transferCallsAPI({
      callId: params.callId,
      transferInitiatorAddress,
      transferInitiatorDeviceType,
      transferInitiatorDeviceName,
      transferAddress,
      targetAddress: params.targetAddress,
      mode: 'CONSULT',
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
    if (!phoneNumber?.trim()) {
      return {
        success: false,
        error: 'Phone number is required',
      };
    }

    // Clean the phone number: remove spaces, dashes, brackets, and other formatting characters
    // Keep only digits, +, *, and # (for extensions and special dialing)
    const cleanedNumber = phoneNumber
      .replaceAll(/\s+/g, '')
      .replaceAll('-', '')
      .replaceAll('(', '')
      .replaceAll(')', '')
      .replaceAll('[', '')
      .replaceAll(']', '')
      .replaceAll('{', '')
      .replaceAll('}', '')
      .replaceAll('.', '')
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
      const actionId = event.actionId;
      if (event.type !== 'action_request' || !event.data || actionId == null) {
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

        manager.sendActionResponse(actionId, result, result.error);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to execute action';
        manager.sendActionResponse(actionId, undefined, message);
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

