import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "../auth/AuthProvider";
import { clearTokens } from "../auth/authStorage";

const BROWSER_SESSION_KEY = "app_browser_session_active";

/**
 * Detects browser close (vs tab close vs SPA navigation) by relying on the
 * fact that sessionStorage is wiped when the browser fully exits.
 *
 * If the marker is missing on app boot we treat it as a fresh browser
 * session and clear every cached auth artifact, then push the user back to
 * sign-in. The marker is set on every other page load.
 */
export const useBrowserCloseDetection = () => {
  const location = useLocation();
  const { signOut } = useAuthContext();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (globalThis.window === undefined) return;

    const isAuthPage = location.pathname.startsWith("/auth/");
    if (isAuthPage) {
      try {
        if (!sessionStorage.getItem(BROWSER_SESSION_KEY)) {
          sessionStorage.setItem(BROWSER_SESSION_KEY, "true");
        }
      } catch {
        // ignore
      }
      return;
    }

    if (checkedRef.current) return;
    checkedRef.current = true;

    void (async () => {
      try {
        const isSessionActive = sessionStorage.getItem(BROWSER_SESSION_KEY);
        if (!isSessionActive) {
          console.log(
            "Fresh browser session detected (browser was closed) - clearing all sessions",
          );
          clearTokens();
          await signOut({ redirectTo: "/auth/signin" });
          return;
        }
        sessionStorage.setItem(BROWSER_SESSION_KEY, "true");
      } catch (error) {
        console.warn("useBrowserCloseDetection: failed", error);
      }
    })();
  }, [location.pathname, signOut]);
};
