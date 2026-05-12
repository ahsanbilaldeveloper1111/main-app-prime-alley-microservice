import { useMemo, useState, type ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { TokenServiceProvider } from "./TokenServiceProvider";
import { createAppQueryClient } from "../query/createAppQueryClient";
import SessionHandler from "./SessionHandler";
import { NotificationProvider } from "../contexts/NotificationContext";
import { CtiProvider } from "../contexts/CtiContext";
import { DialerModalProvider } from "../contexts/DialerModalContext";
import { IncomingCallProvider } from "../contexts/IncomingCallContext";
import GlobalInputCapitalization from "./GlobalInputCapitalization";
import NotificationSocketBridge from "./NotificationSocketBridge";
import { makeStore } from "../toolkit";

interface ProvidersProps {
  readonly children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createAppQueryClient());
  const store = useMemo(() => makeStore(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <TokenServiceProvider>
        <CtiProvider>
          <IncomingCallProvider>
            <DialerModalProvider>
              <NotificationProvider>
                <SessionHandler>
                  <GlobalInputCapitalization />
                  {/*
                   * NotificationSocketBridge needs to live inside
                   * NotificationProvider (its `useNotifications` consumer) and
                   * stay mounted for the whole authenticated session — exactly
                   * how the original _app.tsx wired it. It self-disables when
                   * the user is unauthenticated.
                   */}
                  <NotificationSocketBridge />
                  <ReduxProvider store={store}>{children}</ReduxProvider>
                </SessionHandler>
              </NotificationProvider>
            </DialerModalProvider>
          </IncomingCallProvider>
        </CtiProvider>
      </TokenServiceProvider>
    </QueryClientProvider>
  );
}
