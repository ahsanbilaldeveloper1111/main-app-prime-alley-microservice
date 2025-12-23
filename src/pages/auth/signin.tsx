import NonLayout from "@layout/NonLayout";
import Image from "next/image";
import React, { ReactElement, useState, useEffect, useRef } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Script from "next/script";
import { toast } from "react-toastify";
import { FaSpinner } from "react-icons/fa";
import "@assets/scss/login.scss";
import Footer from "@components/Footer";
import PageLoader from "@components/PageLoader";

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

  // Cleanup particles on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.pJSDom) {
        window.pJSDom.forEach((pJS) => {
          if (
            pJS.pJS &&
            pJS.pJS.fn &&
            pJS.pJS.fn.vendors &&
            pJS.pJS.fn.vendors.destroy
          ) {
            pJS.pJS.fn.vendors.destroy();
          }
        });
      }
    };
  }, []);

  return (
    <React.Fragment>
      <Head>
        <title>Sign In - Business Contact Center</title>
      </Head>
      <Script
        src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Initialize particles after script loads
          if (typeof window !== "undefined" && window.particlesJS) {
            window.particlesJS("particles-js", {
              particles: {
                number: {
                  value: 40,
                  density: {
                    enable: true,
                    value_area: 800,
                  },
                },
                color: {
                  value: "#1e70e3",
                },
                shape: {
                  type: "circle",
                },
                opacity: {
                  value: 1,
                  random: false,
                },
                size: {
                  value: 3,
                  random: true,
                },
                line_linked: {
                  enable: true,
                  distance: 150,
                  color: "#1e70e3",
                  opacity: 0.2,
                  width: 1,
                },
                move: {
                  enable: true,
                  speed: 3,
                  direction: "none",
                  random: false,
                  straight: false,
                  out_mode: "out",
                  bounce: false,
                },
              },
              interactivity: {
                detect_on: "canvas",
                events: {
                  onhover: {
                    enable: true,
                    mode: "grab",
                  },
                  onclick: {
                    enable: true,
                    mode: "push",
                  },
                  resize: true,
                },
                modes: {
                  grab: {
                    distance: 140,
                    line_linked: {
                      opacity: 0.8,
                    },
                  },
                  push: {
                    particles_nb: 2,
                  },
                },
              },
              retina_detect: true,
            });
          }
        }}
      />
      <div>
        <div id="particles-js"></div>

         {/* Session Loading Overlay */}
         {/* Only show loader if we're actually loading AND haven't timed out */}
         {/* Don't show loader if authenticated (will redirect) or if we've determined unauthenticated */}
         {sessionLoading && status === "loading" && (
          <PageLoader isLoading={true} />
         )}

        {!sessionLoading && (
          <React.Fragment>
            <div className="login-main-container">
              <header className="login-info-panel">
                <div className="info-panel-content">
                  <i
                    className="fas fa-satellite-dish"
                    style={{ fontSize: "3rem", marginBottom: "20px" }}
                  ></i>
                  <h1 className="text-white">Business Contact Center</h1>

                  {/* <br />
                                    <Image src={Logo} alt="Business Contact Center" /> */}

                  <p>
                    A new frontier in telecommunications and data management.
                    Secure, efficient, and reliable.
                  </p>
                </div>
              </header>
              <main className="login-form-panel">
                <div className="login-form-card">
                  <h1 className="login-title">Welcome Back</h1>

                  <p className="login-subtitle">Sign in to your account</p>

                  <form
                    className="login-form"
                    id="loginForm"
                    onSubmit={handleSubmit}
                  >
                    <div className="input-group">
                      <input
                        type="text"
                        id="email"
                        placeholder=" "
                        required
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                      />
                      <label htmlFor="email">Username</label>
                      <small className="form-error" id="emailError"></small>
                    </div>
                    <div className="input-group">
                      <input
                        id="password"
                        placeholder=""
                        required
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={handleChange}
                      />

                      <label htmlFor="password">Password</label>
                      <span
                        className="toggle-password"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <i className="fas fa-eye" id="passwordToggleIcon"></i>
                      </span>
                      <small className="form-error" id="passwordError">
                        Password must be at least 6 characters.
                      </small>
                    </div>
                    {/* <div className="form-options">
                                            <label for="remember-me" className="remember-me">
                                                <input type="checkbox" id="remember-me" />
                                                Remember me
                                            </label>
                                            <a href="#" className="forgot-password">Forgot password?</a>
                                        </div> */}
                    <button
                      type="submit"
                      className="btn-primary"
                      id="loginButton"
                      disabled={loading}
                    >
                      {!loading && (
                        <span className="icon-text">
                          <i className="fas fa-sign-in-alt"></i>
                          Sign in
                        </span>
                      )}

                      {loading && (
                        <span className="icon-text">
                          <FaSpinner className="fa-spin text-white" />
                          Signing in...
                        </span>
                      )}
                    </button>
                  </form>

                  {/* <div className="or-divider">or</div>

                                    <a href="#" className="btn-social">
                                        <i className="fab fa-google"></i> Sign in with Google
                                    </a> */}
                </div>
              </main>
            </div>

            <footer className="pc-footer m-0 mt-3">
              <div className="row">
                <div className="col-sm-12 my-1 text-center">
                  <p className="m-0">
                    © {new Date().getFullYear()} All rights reserved. Powered by{" "}
                    <a
                      href="https://primealley.com/"
                      target="_blank"
                      className="text-primary"
                    >
                      {" "}
                      Prime Alley Technology LLC
                    </a>
                  </p>
                </div>
                {/* <div className="col-sm-6 ms-auto my-1">
                                <ul className="list-inline footer-link mb-0 justify-content-sm-end d-flex">
                                  <li className="list-inline-item"><a href="#" target="_blank">Documentation</a></li>
                                  <li className="list-inline-item"><a href="#" target="_blank">Support</a></li>
                                </ul>
                              </div> */}
              </div>
            </footer>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
};

Signin.getLayout = (page: ReactElement) => {
  return <NonLayout>{page}</NonLayout>;
};
export default Signin;
