import NonLayout from "@layout/NonLayout";
import PageLoader from "@components/PageLoader";
import { SigninForm } from "@components/auth/signin/SigninForm";
import { SigninMarketingPanel } from "@components/auth/signin/SigninMarketingPanel";
import { useSigninPage } from "@components/auth/signin/useSigninPage";
import Head from "next/head";
import React, { ReactElement, useEffect } from "react";

import "@components/auth/signin/signinPage.scss";

// Mirrors @assets/scss/login.scss from the original Next build. We do NOT
// `import` login.scss here because Vite would load that global stylesheet for
// the whole SPA lifetime, leaking `body { font-family }` and `.btn-primary`
// rules to every other route. Next previously bundled login.scss into a
// per-page chunk that unmounted with the page; we replicate that scoping by
// injecting these rules into <head> only while this component is mounted.
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
  const vm = useSigninPage();

  return (
    <React.Fragment>
      <Head>
        <title>Business Workspace AI-Powered </title>
      </Head>

      {vm.sessionLoading && vm.sessionStatus === "loading" && (
        <PageLoader isLoading={true} />
      )}

      {!vm.sessionLoading && (
        <div className="auth-main v2">
          <div className="bg-overlay bg-dark" />
          <div className="auth-wrapper">
            <SigninMarketingPanel />
            <div className="auth-form">
              <SigninForm vm={vm} />
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
