import tokenService from "@utils/tokenService";
import { useRouter } from "next/router";
import { signIn, signOut, useSession } from "next-auth/react";
import React, {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";

import {
  APP_BROWSER_SESSION_ACTIVE_KEY,
  composeSigninEmail,
  normalizeSigninUsername,
  SESSION_EXPIRED_QUERY_REASON,
  SESSION_EXPIRED_TOAST_ID,
  signInErrorToastMessage,
  SIGNIN_DEFAULT_REDIRECT,
} from "./signinDomain";

export interface SigninCredentials {
  email: string;
  password: string;
}

export interface SigninPageViewModel {
  credentials: SigninCredentials;
  loading: boolean;
  error: string;
  sessionLoading: boolean;
  sessionStatus: string;
  showPassword: boolean;
  emailInputRef: React.RefObject<HTMLInputElement | null>;
  passwordInputRef: React.RefObject<HTMLInputElement | null>;
  handleSubmit: (e: FormEvent) => Promise<void>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInput: (e: React.FormEvent<HTMLInputElement>) => void;
  onEmailFocus: () => void;
  onEmailBlur: () => void;
  onEmailKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPasswordFocus: () => void;
  onPasswordKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  toggleShowPassword: () => void;
}

export function useSigninPage(): SigninPageViewModel {
  const [credentials, setCredentials] = useState<SigninCredentials>({
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
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const autofillHandledRef = useRef<boolean>(false);
  const isEmailFocusedRef = useRef<boolean>(false);

  const { data: session, status } = useSession();

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (router.isReady && reason === SESSION_EXPIRED_QUERY_REASON) {
      toast.info("Session expired. Please sign in again.", {
        toastId: SESSION_EXPIRED_TOAST_ID,
      });
    }
  }, [router.isReady, reason]);

  useEffect(() => {
    if (!sessionLoading) {
      const checkAutofill = () => {
        const emailInput = emailInputRef.current;
        const passwordInput = passwordInputRef.current;

        if (emailInput && passwordInput) {
          const emailValue = emailInput.value;
          const passwordValue = passwordInput.value;

          if (emailValue && emailValue !== credentials.email) {
            const cleanEmail = normalizeSigninUsername(emailValue);
            setCredentials((prev) => ({ ...prev, email: cleanEmail }));
          }

          if (passwordValue && passwordValue !== credentials.password) {
            setCredentials((prev) => ({ ...prev, password: passwordValue }));
          }

          if (
            emailValue &&
            !passwordValue &&
            !autofillHandledRef.current &&
            !isEmailFocusedRef.current &&
            !loading
          ) {
            autofillHandledRef.current = true;
            setTimeout(() => {
              if (
                passwordInputRef.current &&
                document.activeElement !== emailInputRef.current
              ) {
                passwordInputRef.current.focus();
              }
            }, 100);
          } else if (emailValue && passwordValue) {
            autofillHandledRef.current = true;
          }
        }
      };

      checkAutofill();
      const timeout1 = setTimeout(checkAutofill, 100);
      const timeout2 = setTimeout(checkAutofill, 500);
      const timeout3 = setTimeout(checkAutofill, 1000);
      const timeout4 = setTimeout(checkAutofill, 2000);

      const observer = new MutationObserver(() => {
        checkAutofill();
      });

      if (emailInputRef.current && passwordInputRef.current) {
        observer.observe(emailInputRef.current, {
          attributes: true,
          attributeFilter: ["value"],
        });
        observer.observe(passwordInputRef.current, {
          attributes: true,
          attributeFilter: ["value"],
        });
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

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError("");

      let emailValue = credentials.email;
      let passwordValue = credentials.password;

      if (!emailValue && emailInputRef.current) {
        emailValue = emailInputRef.current.value;
      }

      if (!passwordValue && passwordInputRef.current) {
        passwordValue = passwordInputRef.current.value;
      }

      if (!emailValue || !passwordValue) {
        setLoading(false);
        setError("Please enter your username and password");
        return;
      }

      const userEmail = composeSigninEmail(emailValue);

      try {
        const result = await signIn("credentials", {
          email: userEmail,
          password: passwordValue,
          redirect: false,
          callbackUrl: callbackUrl
            ? decodeURIComponent(callbackUrl as string)
            : SIGNIN_DEFAULT_REDIRECT,
        });

        if (result?.error) {
          toast.error(signInErrorToastMessage(result.error));
        } else {
          try {
            globalThis.sessionStorage?.setItem(
              APP_BROWSER_SESSION_ACTIVE_KEY,
              "true",
            );
          } catch (err) {
            console.error("Error setting session flag:", err);
          }

          const redirectUrl = callbackUrl
            ? decodeURIComponent(callbackUrl as string)
            : SIGNIN_DEFAULT_REDIRECT;

          setTimeout(() => {
            globalThis.location.href = redirectUrl;
          }, 100);
        }
      } catch (err) {
        console.error("Sign in error:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [credentials.email, credentials.password, callbackUrl],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      let nextValue = value;

      if (name === "email") {
        nextValue = normalizeSigninUsername(value);
      }

      setCredentials((prev) => ({
        ...prev,
        [name]: nextValue,
      }));
    },
    [],
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const target = e.currentTarget;
      const { name, value } = target;

      if (name === "email") {
        const cleanEmail = normalizeSigninUsername(value);
        if (cleanEmail !== credentials.email) {
          setCredentials((prev) => ({ ...prev, email: cleanEmail }));
        }
      } else if (name === "password") {
        if (value !== credentials.password) {
          setCredentials((prev) => ({ ...prev, password: value }));
        }
      }
    },
    [credentials.email, credentials.password],
  );

  useEffect(() => {
    if (sessionLoading || loading) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || loading) return;

      const emailInput = emailInputRef.current;
      const passwordInput = passwordInputRef.current;

      if (!emailInput || !passwordInput) return;

      const emailValue = emailInput.value;
      const passwordValue = passwordInput.value;

      if (
        emailValue &&
        passwordValue &&
        document.activeElement !== emailInput &&
        document.activeElement !== passwordInput
      ) {
        const cleanEmail = normalizeSigninUsername(emailValue);

        if (
          cleanEmail !== credentials.email ||
          passwordValue !== credentials.password
        ) {
          setCredentials({
            email: cleanEmail,
            password: passwordValue,
          });
          setTimeout(() => {
            const form = emailInput.closest("form");
            if (form) {
              form.requestSubmit();
            }
          }, 0);
        } else {
          const form = emailInput.closest("form");
          if (form) {
            form.requestSubmit();
          }
        }
        e.preventDefault();
      }
    };

    globalThis.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [sessionLoading, loading, credentials.email, credentials.password]);

  useEffect(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    if (status === "loading") {
      setSessionLoading(true);
      loadingTimeoutRef.current = setTimeout(() => {
        if (statusRef.current === "loading") {
          console.warn("Session check timeout - assuming unauthenticated");
          setSessionLoading(false);
        }
      }, 5000);
    } else if (status === "authenticated" && session) {
      setSessionLoading(false);
      const hasAppTokens = globalThis.sessionStorage?.getItem("accessToken");
      if (!hasAppTokens) {
        (async () => {
          try {
            await tokenService.initializeFromSession(session);
            const hasTokensAfterSync =
              globalThis.sessionStorage?.getItem("accessToken");
            if (hasTokensAfterSync && tokenService.isAuthenticated()) {
              const redirectUrl = callbackUrl
                ? decodeURIComponent(callbackUrl as string)
                : SIGNIN_DEFAULT_REDIRECT;
              router.push(redirectUrl);
              return;
            }
          } catch {
            // ignore
          }
          fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(
            () => {},
          );
          signOut({ redirect: false });
        })();
        return;
      }
      const redirectUrl = callbackUrl
        ? decodeURIComponent(callbackUrl as string)
        : SIGNIN_DEFAULT_REDIRECT;
      router.push(redirectUrl);
    } else if (status === "unauthenticated") {
      setSessionLoading(false);
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, [status, session, callbackUrl, router]);

  const onEmailFocus = useCallback(() => {
    isEmailFocusedRef.current = true;
  }, []);

  const onEmailBlur = useCallback(() => {
    isEmailFocusedRef.current = false;
  }, []);

  const onEmailKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !loading) {
        const emailVal = emailInputRef.current?.value;
        const passwordVal = passwordInputRef.current?.value;

        if (emailVal && passwordVal) {
          if (
            emailVal !== credentials.email ||
            passwordVal !== credentials.password
          ) {
            const cleanEmail = normalizeSigninUsername(emailVal);
            setCredentials({
              email: cleanEmail,
              password: passwordVal,
            });
            setTimeout(() => {
              const form = emailInputRef.current?.closest("form");
              if (form) {
                form.requestSubmit();
              }
            }, 0);
            e.preventDefault();
          }
        }
      }
    },
    [loading, credentials.email, credentials.password],
  );

  const onPasswordFocus = useCallback(() => {
    if (emailInputRef.current && passwordInputRef.current) {
      const emailVal = emailInputRef.current.value;
      const passwordVal = passwordInputRef.current.value;

      if (emailVal && emailVal !== credentials.email) {
        const cleanEmail = normalizeSigninUsername(emailVal);
        setCredentials((prev) => ({ ...prev, email: cleanEmail }));
      }

      if (passwordVal && passwordVal !== credentials.password) {
        setCredentials((prev) => ({ ...prev, password: passwordVal }));
      }
    }
  }, [credentials.email, credentials.password]);

  const onPasswordKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !loading) {
        const emailVal = emailInputRef.current?.value;
        const passwordVal = passwordInputRef.current?.value;

        if (emailVal && passwordVal) {
          if (
            emailVal !== credentials.email ||
            passwordVal !== credentials.password
          ) {
            const cleanEmail = normalizeSigninUsername(emailVal);
            setCredentials({
              email: cleanEmail,
              password: passwordVal,
            });
          }
        }
      }
    },
    [loading, credentials.email, credentials.password],
  );

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return {
    credentials,
    loading,
    error,
    sessionLoading,
    sessionStatus: status,
    showPassword,
    emailInputRef,
    passwordInputRef,
    handleSubmit,
    handleChange,
    handleInput,
    onEmailFocus,
    onEmailBlur,
    onEmailKeyDown,
    onPasswordFocus,
    onPasswordKeyDown,
    toggleShowPassword,
  };
}
