import "@assets/scss/custom.scss";
import "@assets/fonts/phosphor/duotone/style.css";
import React, { Component, ReactElement, ReactNode } from "react";
import Head from "next/head";
import { wrapper } from "@toolkit/index";

import { AppProps } from "next/app";
import type { NextPage } from "next";
import { appWithTranslation } from "next-i18next";
import { ToastContainer } from 'react-toastify';
import * as Sentry from "@sentry/nextjs";
import Providers from "@components/providers";

import favicon from "@assets/images/favicon-analisys.ico";
// import faviconBlack from "@assets/images/favicon-black.png";

import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import ChatbotWidget from "@components/chatbot";
import NotificationSocketBridge from "@components/NotificationSocketBridge";
import { useSession } from "next-auth/react";
import { usePermissions } from "@utils/permissionUtils";

// Error boundary that reports client-side render errors to Sentry
class SentryErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            minHeight: "200px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2>Something went wrong</h2>
          <p>We’ve been notified and are looking into it.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Wrapper component to conditionally render chatbot based on auth status and permissions
const AppContent: React.FC<{ Component: NextPageWithLayout; pageProps: any; getLayout: (page: ReactElement) => ReactNode }> = ({ Component, pageProps, getLayout }) => {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  const router = useRouter();

  // Check if current route should exclude chatbot
  const isLiveCallsPage = router.pathname.startsWith('/live-calls');
  const isLoginPage = router.pathname.startsWith('/auth/signin') || 
                      router.pathname.startsWith('/pages/login') ||
                      router.pathname === '/login';
  const shouldShowChatbot = !isLiveCallsPage && !isLoginPage;

  return (
    <>
      <NotificationSocketBridge />
      {getLayout(<Component {...pageProps} />)}
      {status === 'authenticated' && session && hasPermission('live-chat-users') && shouldShowChatbot && <ChatbotWidget />}
    </>
  );
};

const MyApp: any = ({ Component, pageProps, ...rest }: AppPropsWithLayout) => {
  const { store } = wrapper.useWrappedStore(rest);
  const getLayout = Component.getLayout || ((page) => page);

  NProgress.configure({ showSpinner: false });

  Router.events.on("routeChangeStart", () => {
    NProgress.start();
  });
  Router.events.on("routeChangeComplete", () => {
    NProgress.done();
  });
  Router.events.on("routeChangeError", () => {
    NProgress.done();
  });

  return (
    <>
      <Head>
        <link rel='icon' href={favicon.src} type="image/x-icon" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Business Workspace AI-Powered</title>
      </Head>
      <Providers store={store}>
        <SentryErrorBoundary>
          <AppContent Component={Component} pageProps={pageProps} getLayout={getLayout} />
        </SentryErrorBoundary>
      </Providers>
      <ToastContainer />
    </>
  );
};

export default appWithTranslation(MyApp);
