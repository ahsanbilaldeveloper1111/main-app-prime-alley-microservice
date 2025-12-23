import NonLayout from "@layout/NonLayout";
import Image from "next/image";
import React, { ReactElement, useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import "@assets/scss/login.scss";
import PageLoader from "@components/PageLoader";
import logodark from "@assets/images/Prime3.png";

const Signin = () => {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionLoading, setSessionLoading] = useState(true);
  const router = useRouter();
  const { callbackUrl } = router.query;
  const [showPassword, setShowPassword] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusRef = useRef<string>("loading");

  // Use NextAuth's useSession hook for frontend session management
  const { data: session, status } = useSession();
  
  // Keep status ref in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const credentialsEmail = credentials.email.split("@")[0];
    const userEmail = credentialsEmail + process.env.NEXT_PUBLIC_DOMAIN;

    try {
      const result = await signIn("credentials", {
        email: userEmail,
        password: credentials.password,
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
        toast.success("Login successful");
        
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
      // User is already logged in, redirect them
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
        <title>Sign In - Business Contact Center</title>
        <style>{`
          #__next {
            width: 100% !important;
            height: 100% !important;
          }
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0;
            padding: 0;
          }
        `}</style>
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
               
                <h1 className="f-w-700 mb-1 text-white">Business Contact Center</h1>
                <p className="mb-3 text-white">A new frontier in telecommunications and data management. Secure, efficient, and reliable.</p>

                <hr className="mb-3 mt-4" />
                <div className="row">
                  <div className="col my-1">
                    <p className="m-0">
                      © {new Date().getFullYear()} All rights reserved. Powered by{" "}
                      <a
                        href="https://primealley.com/"
                        target="_blank"
                        className="text-primary"
                      >
                        Prime Alley Technology LLC
                      </a>
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
                   <Image  
                   src={logodark} className="img-brand img-fluid mb-3" alt="Business Contact Center"
                   width={200}
                    />
                  <h4 className="f-w-500 mb-1">Welcome Back</h4>
                  <p className="mb-3">Sign in to your account</p>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="form-group mb-3">
                      <input
                        type="text"
                        className="form-control"
                        id="email"
                        placeholder="Username"
                        required
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group mb-3 position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        id="password"
                        placeholder="Password"
                        required
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
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
