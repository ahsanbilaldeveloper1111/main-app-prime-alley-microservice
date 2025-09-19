import React, { createContext, useContext, ReactNode } from 'react';
import { useTmsSession } from '../utils/tmsSessionNextAuth';

interface TmsSessionContextType {
  session: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  isValid: boolean;
  isRefreshing: boolean;
  getPermissions: () => any[];
  getCustomerType: () => string;
  hasPermission: (action: string, module: string, checkCustomerType?: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  getRemainingSeconds: () => number;
  refresh: () => void;
  clear: () => void;
}

const TmsSessionContext = createContext<TmsSessionContextType | undefined>(undefined);

interface TmsSessionProviderProps {
  children: ReactNode;
}

export const TmsSessionProvider: React.FC<TmsSessionProviderProps> = ({ children }) => {
  const tmsSession = useTmsSession();

  return (
    <TmsSessionContext.Provider value={tmsSession}>
      {children}
    </TmsSessionContext.Provider>
  );
};

export const useTmsSessionContext = (): TmsSessionContextType => {
  const context = useContext(TmsSessionContext);
  if (context === undefined) {
    throw new Error('useTmsSessionContext must be used within a TmsSessionProvider');
  }
  return context;
};
