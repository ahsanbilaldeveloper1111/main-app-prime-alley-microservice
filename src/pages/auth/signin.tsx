import NonLayout from "@layout/NonLayout";
import React, { ReactElement, useState, useEffect, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import PageLoader from "@components/PageLoader";
import tokenService from "@utils/tokenService";

// Mirrors @assets/scss/login.scss from the original Next build. We do NOT
// `import` login.scss here because Vite would load that global stylesheet for
// the whole SPA lifetime, leaking `body { font-family }` and `.btn-primary`
// rules to every other route. Next previously bundled login.scss into a
// per-page chunk that unmounted with the page; we replicate that scoping by
// injecting these rules into <head> only while this component is mounted (see
// the useEffect below). The CSS lives in a constant rather than a JSX
// `<style>` block because SonarQube's JSX parser misreads large template
// literals inside <style> as CSS, polluting analysis of the surrounding JSX.
const SIGNIN_PAGE_STYLES = [
  "html, body, #root {",
  "  width: 100% !important;",
  "  height: 100% !important;",
  "  margin: 0;",
  "  padding: 0;",
  "}",
  "body {",
  "  font-family: 'Inter', sans-serif;",
  "  color: #2c3e50;",
  "}",
  ".auth-form .btn-primary,",
  ".auth-form .btn.btn-primary {",
  "  padding: 15px;",
  "  border: none;",
  "  border-radius: 8px;",
  "  font-weight: 600;",
  "  cursor: pointer;",
  "  transition: 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);",
  "  display: flex;",
  "  align-items: center;",
  "  justify-content: center;",
  "  gap: 8px;",
  "  font-size: 1rem;",
  "  text-decoration: none;",
  "  box-shadow: 0 4px 15px rgba(30, 112, 227, 0.25);",
  "  position: relative;",
  "}",
  ".auth-form .btn-primary:disabled {",
  "  cursor: not-allowed;",
  "  opacity: 0.7;",
  "}",
  ".auth-form .btn-primary:hover {",
  "  transform: translateY(-2px);",
  "  box-shadow: 0 6px 20px rgba(30, 112, 227, 0.35);",
  "}",
  ".auth-form .btn-primary:active {",
  "  transform: translateY(0);",
  "  box-shadow: 0 2px 10px rgba(30, 112, 227, 0.25);",
  "}",
].join("\n");

function useSigninPageStyles() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const styleEl = document.createElement("style");
    styleEl.dataset.scope = "signin-page";
    styleEl.textContent = SIGNIN_PAGE_STYLES;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, []);
}

const Signin = () => {
  useSigninPageStyles();
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionLoading, setSessionLoading] = useState(true);
  const router = useRouter();
  const { callbackUrl, reason } = router.query;
  const [showPassword, setShowPassword] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<string>("loading");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const autofillHandledRef = useRef<boolean>(false);
  const isEmailFocusedRef = useRef<boolean>(false);

  // Use NextAuth's useSession hook for frontend session management
  const { data: session, status } = useSession();
  
  // Keep status ref in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Show message when redirected after server lost session (e.g. deploy/restart)
  useEffect(() => {
    if (router.isReady && reason === 'session_expired') {
      toast.info('Session expired. Please sign in again.', { toastId: 'session-expired' });
    }
  }, [router.isReady, reason]);

  // Detect and sync autofilled values after page load
  useEffect(() => {
    if (!sessionLoading) {
      // Check for autofilled values after a short delay (browsers autofill after render)
      const checkAutofill = () => {
        const emailInput = emailInputRef.current;
        const passwordInput = passwordInputRef.current;
        
        if (emailInput && passwordInput) {
          // Check if fields have autofilled values
          const emailValue = emailInput.value;
          const passwordValue = passwordInput.value;
          
          // If values exist but state doesn't match, sync them
          if (emailValue && emailValue !== credentials.email) {
            const atIndex = emailValue.indexOf("@");
            const cleanEmail = atIndex === -1 ? emailValue.replace(/@/g, "") : emailValue.slice(0, atIndex);
            setCredentials(prev => ({ ...prev, email: cleanEmail }));
          }
          
          if (passwordValue && passwordValue !== credentials.password) {
            setCredentials(prev => ({ ...prev, password: passwordValue }));
          }
          
          // Don't auto-focus password field when both fields are already filled
          // This allows user to press Enter directly to submit without extra focus step
          // Only focus password if email is filled but password is not (user needs to enter password)
          if (emailValue && !passwordValue && !autofillHandledRef.current && !isEmailFocusedRef.current && !loading) {
            autofillHandledRef.current = true;
            // Small delay to ensure autofill is complete
            setTimeout(() => {
              // Double-check that email field is still not focused before focusing password
              if (passwordInputRef.current && document.activeElement !== emailInputRef.current) {
                passwordInputRef.current.focus();
              }
            }, 100);
          } else if (emailValue && passwordValue) {
            // Both fields are filled, mark as handled but don't focus anything
            // User can press Enter directly to submit
            autofillHandledRef.current = true;
          }
        }
      };
      
      // Check immediately and after delays (browsers autofill at different times)
      checkAutofill();
      const timeout1 = setTimeout(checkAutofill, 100);
      const timeout2 = setTimeout(checkAutofill, 500);
      const timeout3 = setTimeout(checkAutofill, 1000);
      const timeout4 = setTimeout(checkAutofill, 2000);
      
      // Also use MutationObserver to detect when browser autofills
      const observer = new MutationObserver(() => {
        checkAutofill();
      });
      
      if (emailInputRef.current && passwordInputRef.current) {
        observer.observe(emailInputRef.current, { attributes: true, attributeFilter: ['value'] });
        observer.observe(passwordInputRef.current, { attributes: true, attributeFilter: ['value'] });
      }
      
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        clearTimeout(timeout4);
        observer.disconnect();
      };
    }
  }, [sessionLoading, loading, credentials.email, credentials.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Get values from input refs if state is empty (handles autofill case)
    let emailValue = credentials.email;
    let passwordValue = credentials.password;
    
    if (!emailValue && emailInputRef.current) {
      emailValue = emailInputRef.current.value;
    }
    
    if (!passwordValue && passwordInputRef.current) {
      passwordValue = passwordInputRef.current.value;
    }

    // If still no values, return early
    if (!emailValue || !passwordValue) {
      setLoading(false);
      setError("Please enter your username and password");
      return;
    }

    const credentialsEmail = emailValue.split("@")[0];
    const userEmail = credentialsEmail + process.env.NEXT_PUBLIC_DOMAIN;

    try {
      const result = await signIn("credentials", {
        email: userEmail,
        password: passwordValue,
        redirect: false,
        callbackUrl: callbackUrl
          ? decodeURIComponent(callbackUrl as string)
          : "/dashboard",
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          toast.error("Invalid username or password");
        } else if (
          result.error.includes("network") ||
          result.error.includes("fetch")
        ) {
          toast.error(
            "Unable to connect to authentication server. Please try again."
          );
        } else {
          toast.error(
            "Authentication failed. Please check your credentials and try again."
          );
        }
      } else {
        // toast.success("Login successful");
        
        // Set sessionStorage flag to indicate active browser session
        // This prevents browser close detection from clearing sessions after signin
        try {
          sessionStorage.setItem('app_browser_session_active', 'true');
        } catch (error) {
          console.error('Error setting session flag:', error);
        }
        
        // Use NextAuth's built-in redirect mechanism for better reliability
        const redirectUrl = callbackUrl
          ? decodeURIComponent(callbackUrl as string)
          : "/dashboard";

        // Small delay to ensure session is established, then redirect
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "email") {
      const atIndex = value.indexOf("@");
      nextValue = atIndex === -1 ? value.replace(/@/g, "") : value.slice(0, atIndex);
    }

    setCredentials({
      ...credentials,
      [name]: nextValue,
    });
  };

  // Handle autofill events (input event fires for autofill too)
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    const { name, value } = target;
    
    // Sync autofilled values with state
    if (name === "email") {
      const atIndex = value.indexOf("@");
      const cleanEmail = atIndex === -1 ? value.replace(/@/g, "") : value.slice(0, atIndex);
      if (cleanEmail !== credentials.email) {
        setCredentials(prev => ({ ...prev, email: cleanEmail }));
      }
    } else if (name === "password") {
      if (value !== credentials.password) {
        setCredentials(prev => ({ ...prev, password: value }));
      }
    }
  };

  // Handle global Enter key press when both fields are auto-filled
  useEffect(() => {
    if (sessionLoading || loading) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle Enter key
      if (e.key !== 'Enter' || loading) return;

      const emailInput = emailInputRef.current;
      const passwordInput = passwordInputRef.current;

      if (!emailInput || !passwordInput) return;

      // Check if both fields have values
      const emailValue = emailInput.value;
      const passwordValue = passwordInput.value;

      // If both fields are filled and user hasn't focused on any input, submit the form
      if (emailValue && passwordValue && document.activeElement !== emailInput && document.activeElement !== passwordInput) {
        // Sync state from input refs
        const atIndex = emailValue.indexOf("@");
        const cleanEmail = atIndex === -1 ? emailValue.replace(/@/g, "") : emailValue.slice(0, atIndex);
        
        if (cleanEmail !== credentials.email || passwordValue !== credentials.password) {
          setCredentials({
            email: cleanEmail,
            password: passwordValue
          });
          // Submit after state is synced
          setTimeout(() => {
            const form = emailInput.closest('form');
            if (form) {
              form.requestSubmit();
            }
          }, 0);
        } else {
          // State is already synced, submit directly
          const form = emailInput.closest('form');
          if (form) {
            form.requestSubmit();
          }
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [sessionLoading, loading, credentials.email, credentials.password]);

  // Handle session loading and redirects
  useEffect(() => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    if (status === "loading") {
      setSessionLoading(true);
      // Set a timeout to break out of loading state if it takes too long
      // This prevents the page from being stuck in loading state indefinitely
      loadingTimeoutRef.current = setTimeout(() => {
        // If still loading after 5 seconds, assume unauthenticated
        // This handles cases where NextAuth gets stuck checking session
        if (statusRef.current === "loading") {
          console.warn("Session check timeout - assuming unauthenticated");
          setSessionLoading(false);
        }
      }, 5000);
    } else if (status === "authenticated" && session) {
      setSessionLoading(false);
      // If NextAuth says authenticated but we have no access token in sessionStorage,
      // we're likely in a "session expired" loop: user was sent here after tokens were cleared
      // but NextAuth cookie wasn't cleared yet. Don't redirect to dashboard or we'll loop.
      const hasAppTokens =
        typeof window !== "undefined" &&
        window.sessionStorage?.getItem("accessToken");
      if (!hasAppTokens) {
        // Server has session (cookie) but storage is empty (e.g. new tab). Try to sync from session first.
        (async () => {
          try {
            await tokenService.initializeFromSession(session);
            const hasTokensAfterSync =
              typeof window !== "undefined" &&
              window.sessionStorage?.getItem("accessToken");
            // Only redirect if we have tokens AND they're still valid (avoids loop when server has expired tokens)
            if (hasTokensAfterSync && tokenService.isAuthenticated()) {
              const redirectUrl = callbackUrl
                ? decodeURIComponent(callbackUrl as string)
                : "/dashboard";
              router.push(redirectUrl);
              return;
            }
          } catch {
            // ignore
          }
          // Could not sync or tokens expired – clear stale server session and show sign-in form
          // BE logout is best-effort. The new auth context handles its own
          // teardown in signOut(); this fetch existed for the NextAuth session-store
          // and is no longer required.
          signOut({ redirect: false });
        })();
        return;
      }
      // User is already logged in with valid app session, redirect them
      const redirectUrl = callbackUrl
        ? decodeURIComponent(callbackUrl as string)
        : "/dashboard";
      router.push(redirectUrl);
    } else if (status === "unauthenticated") {
      setSessionLoading(false);
    }

    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [status, session, callbackUrl, router]);


  return (
    <React.Fragment>
      <Head>
        <title>Business Workspace AI-Powered </title>
      </Head>

      {/* Session Loading Overlay */}
      {sessionLoading && status === "loading" && (
        <PageLoader isLoading={true} />
      )}

      {!sessionLoading && (
        <div className="auth-main v2">
          <div className="bg-overlay bg-dark"></div>
          <div className="auth-wrapper">
            <div className="auth-sidecontent">
              <div className="auth-sidefooter">
               
                <h1 className="f-w-700 mb-1 text-white">Business Workspace </h1>
                <p className="mb-3 text-white">AI-Powered Business Suite for businesses worldwide—SMB to Enterprises</p>

                <hr className="mb-3 mt-4" />
                <div className="row">
                  <div className="col my-1">
                    <p className="m-0">
                      © {new Date().getFullYear()} All rights reserved.
                      {/* Powered by{" "}
                      <a
                        href="https://primealley.com/"
                        target="_blank"
                        className="text-primary"
                      >
                        Prime Alley Technology LLC
                      </a> */}
                    </p>
                  </div>
                  <div className="col-auto my-1">
                    {/* <ul className="list-inline footer-link mb-0">
                      <li className="list-inline-item">
                        <Link href="/">Home</Link>
                      </li>
                      <li className="list-inline-item">
                        <Link href="https://primealley.com/" target="_blank">Documentation</Link>
                      </li>
                      <li className="list-inline-item">
                        <Link href="https://primealley.com/" target="_blank">Support</Link>
                      </li>
                    </ul> */}
                  </div>
                </div>
              </div>
            </div>
            <div className="auth-form">
              <div className="card my-5 mx-3">
                <div className="card-body">
                   {/* <Image  
                   src={logodark} className="img-brand img-fluid mb-3" alt="Business Workspace AI-Powered"
                   width={200}
                    /> */}
                  <h4 className="f-w-500 mb-1">Welcome Back</h4>
                  <p className="mb-3">Sign in to your account</p>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="form-group mb-3">
                      <input
                        ref={emailInputRef}
                        type="text"
                        className="form-control"
                        id="email"
                        placeholder="Username"
                        required
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                        onInput={handleInput}
                        autoComplete="username"
                        onFocus={() => {
                          isEmailFocusedRef.current = true;
                        }}
                        onBlur={() => {
                          isEmailFocusedRef.current = false;
                        }}
                        onKeyDown={(e) => {
                          // If Enter is pressed and both fields are filled, submit the form
                          if (e.key === 'Enter' && !loading) {
                            const emailVal = emailInputRef.current?.value;
                            const passwordVal = passwordInputRef.current?.value;
                            
                            if (emailVal && passwordVal) {
                              // Sync state from input refs before form submission
                              if (emailVal !== credentials.email || passwordVal !== credentials.password) {
                                const atIndex = emailVal.indexOf("@");
                                const cleanEmail = atIndex === -1 ? emailVal.replace(/@/g, "") : emailVal.slice(0, atIndex);
                                setCredentials({
                                  email: cleanEmail,
                                  password: passwordVal
                                });
                                // Submit after state is synced
                                setTimeout(() => {
                                  const form = emailInputRef.current?.closest('form');
                                  if (form) {
                                    form.requestSubmit();
                                  }
                                }, 0);
                                e.preventDefault();
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="form-group mb-3 position-relative">
                      <input
                        ref={passwordInputRef}
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        id="password"
                        placeholder="Password"
                        required
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        onInput={handleInput}
                        autoComplete="current-password"
                        onFocus={() => {
                          // Sync values when password field is focused (user might press Enter)
                          if (emailInputRef.current && passwordInputRef.current) {
                            const emailVal = emailInputRef.current.value;
                            const passwordVal = passwordInputRef.current.value;
                            
                            if (emailVal && emailVal !== credentials.email) {
                              const atIndex = emailVal.indexOf("@");
                              const cleanEmail = atIndex === -1 ? emailVal.replace(/@/g, "") : emailVal.slice(0, atIndex);
                              setCredentials(prev => ({ ...prev, email: cleanEmail }));
                            }
                            
                            if (passwordVal && passwordVal !== credentials.password) {
                              setCredentials(prev => ({ ...prev, password: passwordVal }));
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Ensure Enter key submits the form
                          if (e.key === 'Enter' && !loading) {
                            // Sync state from input refs before form submission
                            const emailVal = emailInputRef.current?.value;
                            const passwordVal = passwordInputRef.current?.value;
                            
                            if (emailVal && passwordVal) {
                              // Sync state immediately if needed (handleSubmit will use refs if state is empty)
                              if (emailVal !== credentials.email || passwordVal !== credentials.password) {
                                const atIndex = emailVal.indexOf("@");
                                const cleanEmail = atIndex === -1 ? emailVal.replace(/@/g, "") : emailVal.slice(0, atIndex);
                                setCredentials({
                                  email: cleanEmail,
                                  password: passwordVal
                                });
                              }
                              // Form will submit naturally - handleSubmit reads from refs if needed
                            }
                          }
                        }}
                      />
                      <span
                        className="position-absolute"
                        style={{
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          zIndex: 10
                        }}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </span>
                    </div>
                    {error && (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    )}
                    <div className="d-grid mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="d-flex align-items-center justify-content-center">
                            <FaSpinner className="fa-spin me-2" />
                            Signing in...
                          </span>
                        ) : (
                          <span className="d-flex align-items-center justify-content-center">
                            <i className="fas fa-sign-in-alt me-2"></i>
                            Sign in
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

Signin.getLayout = (page: ReactElement) => {
  return <NonLayout>{page}</NonLayout>;
};
export default Signin;
