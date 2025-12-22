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
  getAllUserDevices
} from '../utils/dialer';

interface CtiContextType {
  // Connection state
  isInitialized: boolean;
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
  
  // Call operations
  makeCall: (params: {
    callingAddress: string;
    calledAddress: string;
    callingDeviceType: string;
    callingDeviceName: string;
  }) => Promise<any>;
  
  endCall: (params: {
    callId: string;
    callingAddress: string;
    calledAddress: string;
    callingDeviceType: string;
    callingDeviceName: string;
  }) => Promise<any>;
  
  holdCall: (params: {
    callId: string;
    callingAddress: string;
    calledAddress: string;
    callingDeviceType: string;
    callingDeviceName: string;
  }) => Promise<any>;
  
  resumeCall: (params: {
    callId: string;
    callingAddress: string;
    calledAddress: string;
    callingDeviceType: string;
    callingDeviceName: string;
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
    transferInitiatorAddress: string;
    transferInitiatorDeviceType: string;
    transferInitiatorDeviceName: string;
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
  
  // Process CTI events to update active calls
  useEffect(() => {
    if (!ctiStomp.eventLog || ctiStomp.eventLog.length === 0) return;
    
    const latestEvent = ctiStomp.eventLog[ctiStomp.eventLog.length - 1];
    if (!latestEvent || !latestEvent.parties || latestEvent.parties.length === 0) return;
    
    const eventData = latestEvent.parties[0];
    const { callId, callingAddress, calledAddress, callStatus, callingDeviceName, callingDeviceType } = eventData;
    
    if (!callId || !callingAddress || !calledAddress) return;
    
    // Determine if this is an incoming or outgoing call
    const isIncoming = calledAddress === ctiStomp.userAddress;
    const callNumber = isIncoming ? callingAddress : calledAddress;
    
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
        const newCallId = `${isIncoming ? 'incoming' : 'outgoing'}_${Date.now()}`;
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
    
    return await makeCallAPI({
      callingAddress: callingAddress!,
      calledAddress: params.calledAddress,
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
    
    return await endCallAPI({
      callId: params.callId,
      callingAddress: callingAddress!,
      calledAddress: params.calledAddress,
      callingDeviceType: callingDeviceType!,
      callingDeviceName: callingDeviceName!
    });
  }, [ctiStomp.userAddress, ctiStomp.dnsMap]);
  
  const holdCall = useCallback(async (params: {
    callId: string;
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
    
    return await holdCallAPI({
      callId: params.callId,
      callingAddress: callingAddress!,
      calledAddress: params.calledAddress,
      callingDeviceType: callingDeviceType!,
      callingDeviceName: callingDeviceName!
    });
  }, [ctiStomp.userAddress, ctiStomp.dnsMap]);
  
  const resumeCall = useCallback(async (params: {
    callId: string;
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
    
    return await resumeCallAPI({
      callId: params.callId,
      callingAddress: callingAddress!,
      calledAddress: params.calledAddress,
      callingDeviceType: callingDeviceType!,
      callingDeviceName: callingDeviceName!
    });
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
    
    return await transferCallsAPI({
      callId: params.callId,
      transferInitiatorAddress: transferInitiatorAddress!,
      transferInitiatorDeviceType: transferInitiatorDeviceType!,
      transferInitiatorDeviceName: transferInitiatorDeviceName!,
      transferAddress: params.transferAddress,
      targetAddress: params.targetAddress,
      mode: params.mode
    });
  }, [ctiStomp.userAddress, ctiStomp.dnsMap]);
  
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
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<CtiContextType>(() => ({
    // Connection state
    isInitialized: ctiStomp.isInitialized,
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
    
    // Call operations
    makeCall,
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
    makeCall,
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

