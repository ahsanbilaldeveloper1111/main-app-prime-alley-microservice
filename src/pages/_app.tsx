import "@assets/scss/custom.scss";
import "@assets/fonts/phosphor/duotone/style.css";
import React, { Component, ReactElement, ReactNode, useEffect } from "react";
import Head from "next/head";
import { wrapper } from "@toolkit/index";

import { AppProps } from "next/app";
import type { NextPage } from "next";
import { appWithTranslation } from "next-i18next";
import { ToastContainer } from "react-toastify";
import * as Sentry from "@sentry/nextjs";
import Providers from "@components/providers";

import favicon from "@assets/images/favicon-analisys.ico";

import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import ChatbotWidget from "@components/chatbot";
import NotificationSocketBridge from "@components/NotificationSocketBridge";
import { useSession } from "next-auth/react";
import { usePermissions } from "@utils/permissionUtils";
import { isAxiosUserFacingRejection } from "@utils/axiosUserFacingRejection";

type GlobalWithDomEvents = typeof globalThis & {
  addEventListener?: Window["addEventListener"];
  removeEventListener?: Window["removeEventListener"];
};

function subscribeAxiosHandledRejections(): (() => void) | undefined {
  const g = globalThis as GlobalWithDomEvents;
  if (typeof g.addEventListener !== "function" || typeof g.removeEventListener !== "function") {
    return undefined;
  }

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (isAxiosUserFacingRejection(event.reason)) {
      event.preventDefault();
    }
  };

  g.addEventListener("unhandledrejection", onUnhandledRejection);
  return () => {
    g.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}

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

type AppContentProps = {
  Component: NextPageWithLayout;
  pageProps: AppProps["pageProps"];
  getLayout: (page: ReactElement) => ReactNode;
};

// Wrapper component to conditionally render chatbot based on auth status and permissions
function AppContent({ Component, pageProps, getLayout }: Readonly<AppContentProps>) {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    return subscribeAxiosHandledRejections();
  }, []);

  const isLiveCallsPage = router.pathname.startsWith("/live-calls");
  const isLoginPage =
    router.pathname.startsWith("/auth/signin") ||
    router.pathname.startsWith("/pages/login") ||
    router.pathname === "/login";
  const shouldShowChatbot = !isLiveCallsPage && !isLoginPage;

  return (
    <>
      <NotificationSocketBridge />
      {getLayout(<Component {...pageProps} />)}
      {status === "authenticated" &&
        session &&
        hasPermission("live-chat-users") &&
        shouldShowChatbot && <ChatbotWidget />}
    </>
  );
}

function MyApp({ Component, pageProps, ...rest }: AppPropsWithLayout) {
  const { store } = wrapper.useWrappedStore(rest);
  const getLayout = Component.getLayout ?? ((page) => page);

  useEffect(() => {
    NProgress.configure({ showSpinner: false });

    const onStart = () => {
      NProgress.start();
    };
    const onComplete = () => {
      NProgress.done();
    };

    Router.events.on("routeChangeStart", onStart);
    Router.events.on("routeChangeComplete", onComplete);
    Router.events.on("routeChangeError", onComplete);

    return () => {
      Router.events.off("routeChangeStart", onStart);
      Router.events.off("routeChangeComplete", onComplete);
      Router.events.off("routeChangeError", onComplete);
    };
  }, []);

  return (
    <>
      <Head>
        <link rel="icon" href={favicon.src} type="image/x-icon" />
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
}

export default appWithTranslation(MyApp);
