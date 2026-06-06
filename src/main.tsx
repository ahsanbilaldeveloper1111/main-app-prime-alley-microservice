import "@assets/scss/custom.scss";
import "@assets/scss/communications-pages.scss";
import "@assets/fonts/phosphor/duotone/style.css";
import "nprogress/nprogress.css";
import "./utils/i18n";

import {
  StrictMode,
  Component,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { ToastContainer } from "react-toastify";
import * as Sentry from "@sentry/react";

import { AuthProvider, AuthSnapshotBridge } from "./auth";
import { AppRouter } from "./router";
import { isAxiosUserFacingRejection } from "./utils/axiosUserFacingRejection";

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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  override render() {
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
          <p>We&apos;ve been notified and are looking into it.</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function GlobalRejectionGuard({ children }: { readonly children: ReactNode }) {
  useEffect(() => {
    if (typeof globalThis === "undefined") return;
    const target = globalThis as typeof globalThis & {
      addEventListener?: Window["addEventListener"];
      removeEventListener?: Window["removeEventListener"];
    };
    if (!target.addEventListener || !target.removeEventListener) return;
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isAxiosUserFacingRejection(event.reason)) {
        event.preventDefault();
      }
    };
    target.addEventListener("unhandledrejection", onRejection);
    return () => {
      target.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return <>{children}</>;
}

const sentryDsn = (import.meta.env as Record<string, string | undefined>)
  .VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: globalThis.__SENTRY_ENVIRONMENT__ ?? import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container #root not found in index.html");
}

createRoot(container).render(
  <StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <AuthSnapshotBridge>
          <SentryErrorBoundary>
            <GlobalRejectionGuard>
              {/*
               * <Providers /> mounts inside <RouterProvider /> (see RootLayout
               * in src/router.tsx) because TokenServiceProvider, SessionHandler,
               * and GlobalInputCapitalization all rely on `useLocation` /
               * `useNavigate`, which require an active router context.
               */}
              <AppRouter />
            </GlobalRejectionGuard>
          </SentryErrorBoundary>
          <ToastContainer />
        </AuthSnapshotBridge>
      </AuthProvider>
    </HelmetProvider>
  </StrictMode>,
);
