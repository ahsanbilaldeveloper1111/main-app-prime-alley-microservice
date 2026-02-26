'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DialerModalContextType {
  isOpen: boolean;
  openDialer: () => void;
  closeDialer: () => void;
}

const DialerModalContext = createContext<DialerModalContextType | undefined>(undefined);

export const DialerModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openDialer = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDialer = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <DialerModalContext.Provider value={{ isOpen, openDialer, closeDialer }}>
      {children}
    </DialerModalContext.Provider>
  );
};

export const useDialerModal = (): DialerModalContextType => {
  const context = useContext(DialerModalContext);
  if (context === undefined) {
    throw new Error('useDialerModal must be used within a DialerModalProvider');
  }
  return context;
};

