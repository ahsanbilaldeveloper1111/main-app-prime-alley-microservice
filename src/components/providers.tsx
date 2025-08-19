'use client';

import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { TokenServiceProvider } from './TokenServiceProvider';
import SessionHandler from './SessionHandler';

interface ProvidersProps {
  children: ReactNode;
  store?: any;
}

export default function Providers({ children, store }: ProvidersProps) {
  return (
    <SessionProvider>
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
    </SessionProvider>
  );
} 