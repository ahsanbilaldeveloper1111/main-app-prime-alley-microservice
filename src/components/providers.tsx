'use client';

import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { TokenServiceProvider } from './TokenServiceProvider';
import SessionHandler from './SessionHandler';
import { TmsSessionProvider } from '../contexts/TmsSessionContext';
// import { FirebaseNotificationProvider } from './FirebaseNotificationProvider'; // Disabled Firebase notifications
import { NotificationProvider } from '../contexts/NotificationContext';

interface ProvidersProps {
  children: ReactNode;
  store?: any;
}

export default function Providers({ children, store }: ProvidersProps) {
  return (
    <SessionProvider>
      <TmsSessionProvider>
        <NotificationProvider>
          {/* <FirebaseNotificationProvider> */}
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
          {/* </FirebaseNotificationProvider> */}
        </NotificationProvider>
      </TmsSessionProvider>
    </SessionProvider>
  );
} 