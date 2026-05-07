/** Local part + env domain (matches legacy `split("@")[0] + NEXT_PUBLIC_DOMAIN`). */
export function composeSigninEmail(usernameRaw: string): string {
  const localPart = usernameRaw.split("@")[0];
  return localPart + process.env.NEXT_PUBLIC_DOMAIN;
}

/**
 * Strip domain / stray `@` for controlled input (same as original onChange / autofill sync).
 */
export function normalizeSigninUsername(value: string): string {
  const atIndex = value.indexOf("@");
  return atIndex === -1 ? value.replaceAll("@", "") : value.slice(0, atIndex);
}

export const SIGNIN_DEFAULT_REDIRECT = "/dashboard";

export const APP_BROWSER_SESSION_ACTIVE_KEY = "app_browser_session_active";

export const SESSION_EXPIRED_QUERY_REASON = "session_expired";

export const SESSION_EXPIRED_TOAST_ID = "session-expired";

export function signInErrorToastMessage(error: string): string {
  if (error === "CredentialsSignin") {
    return "Invalid username or password";
  }
  if (error.includes("network") || error.includes("fetch")) {
    return "Unable to connect to authentication server. Please try again.";
  }
  return "Authentication failed. Please check your credentials and try again.";
}
