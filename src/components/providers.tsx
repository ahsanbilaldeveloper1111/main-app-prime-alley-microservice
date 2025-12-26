'use client';

import { SessionProvider } from 'next-auth/react';
import { Provider } from 'react-redux';
import { ReactNode } from 'react';
import { TokenServiceProvider } from './TokenServiceProvider';
import SessionHandler from './SessionHandler';
// import { FirebaseNotificationProvider } from './FirebaseNotificationProvider'; // Disabled Firebase notifications
import { NotificationProvider } from '../contexts/NotificationContext';
import { CtiProvider } from '../contexts/CtiContext';
import { DialerModalProvider } from '../contexts/DialerModalContext';
import { IncomingCallProvider } from '../contexts/IncomingCallContext';

interface ProvidersProps {
  children: ReactNode;
  store?: any;
}

export default function Providers({ children, store }: ProvidersProps) {
  return (
    <SessionProvider
      // Disable refetch on window focus to prevent multiple tabs from triggering simultaneous requests
      refetchOnWindowFocus={false}
      // Disable automatic refetching since we're using JWT strategy which doesn't need frequent refetches
      // This prevents multiple tabs from making concurrent session requests
      refetchInterval={0}
      // Don't refetch when offline
      refetchWhenOffline={false}
    >
      <CtiProvider>
        <IncomingCallProvider>
          <DialerModalProvider>
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
          </DialerModalProvider>
        </IncomingCallProvider>
      </CtiProvider>
    </SessionProvider>
  );
} 