'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface IncomingCallData {
  callId: string;
  callingAddress: string;
  calledAddress: string;
  controllerAddress: string;
  controllerDeviceName: string;
  controllerDeviceType: string;
  startTime: Date;
}

interface IncomingCallContextType {
  incomingCall: IncomingCallData | null;
  showIncomingCallModal: boolean;
  setIncomingCall: (call: IncomingCallData | null) => void;
  setShowIncomingCallModal: (show: boolean) => void;
}

const IncomingCallContext = createContext<IncomingCallContextType | undefined>(undefined);

export const IncomingCallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);

  return (
    <IncomingCallContext.Provider value={{ 
      incomingCall, 
      showIncomingCallModal, 
      setIncomingCall, 
      setShowIncomingCallModal 
    }}>
      {children}
    </IncomingCallContext.Provider>
  );
};

export const useIncomingCall = (): IncomingCallContextType => {
  const context = useContext(IncomingCallContext);
  if (context === undefined) {
    throw new Error('useIncomingCall must be used within an IncomingCallProvider');
  }
  return context;
};

