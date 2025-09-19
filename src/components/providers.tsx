'use client';

import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { TokenServiceProvider } from './TokenServiceProvider';
import SessionHandler from './SessionHandler';
import { TmsSessionProvider } from '../contexts/TmsSessionContext';

interface ProvidersProps {
  children: ReactNode;
  store?: any;
}

export default function Providers({ children, store }: ProvidersProps) {
  return (
    <SessionProvider>
      <TmsSessionProvider>
        <TokenServiceProvider>
          <SessionHandler>
            {store ? (
              <Provider store={store}>
                {children}
              </Provider>
            ) : (
              children
            )}
          </SessionHandler>
        </TokenServiceProvider>
      </TmsSessionProvider>
    </SessionProvider>
  );
} 