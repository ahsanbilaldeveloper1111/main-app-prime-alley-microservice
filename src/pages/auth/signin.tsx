import NonLayout from "@layout/NonLayout";
import PageLoader from "@components/PageLoader";
import { SigninForm } from "@components/auth/signin/SigninForm";
import { SigninMarketingPanel } from "@components/auth/signin/SigninMarketingPanel";
import { useSigninPage } from "@components/auth/signin/useSigninPage";
import Head from "next/head";
import React, { ReactElement } from "react";

import "@assets/scss/login.scss";
import "@components/auth/signin/signinPage.scss";

const Signin = () => {
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
