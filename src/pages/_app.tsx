import "@assets/scss/custom.scss";
import "@assets/fonts/phosphor/duotone/style.css";
import React, { ReactElement, ReactNode } from "react";
import Head from "next/head";
import { wrapper } from "@toolkit/index";

import { AppProps } from "next/app";
import type { NextPage } from "next";
import { appWithTranslation } from "next-i18next";
import { ToastContainer } from 'react-toastify';
import Providers from "@components/providers";
import favicon from "@assets/images/favicon.png";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import ChatbotWidget from "@components/chatbot";
import { useSession } from "next-auth/react";
import { usePermissions } from "@utils/permissionUtils";

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// Wrapper component to conditionally render chatbot based on auth status and permissions
const AppContent: React.FC<{ Component: NextPageWithLayout; pageProps: any; getLayout: (page: ReactElement) => ReactNode }> = ({ Component, pageProps, getLayout }) => {
  const { data: session, status } = useSession();
  const { hasPermission } = usePermissions();
  const router = useRouter();

  // Check if current route is under /help-center/
  const isHelpCenterPage = router.pathname.startsWith('/help-center');

  return (
    <>
      {getLayout(<Component {...pageProps} />)}
      {status === 'authenticated' && session && hasPermission('live-chat-users') && isHelpCenterPage && <ChatbotWidget />}
    </>
  );
};

const MyApp: any = ({ Component, pageProps, ...rest }: AppPropsWithLayout) => {
  const { store } = wrapper.useWrappedStore(rest);
  const getLayout = Component.getLayout || ((page) => page);

  NProgress.configure({ showSpinner: false });

  Router.events.on("routeChangeStart", () => {
    NProgress.start();
  });
  Router.events.on("routeChangeComplete", () => {
    NProgress.done();
  });
  Router.events.on("routeChangeError", () => {
    NProgress.done();
  });

  return (
    <>
      <Head>
        {/* <link rel='icon' href={favicon.src} /> */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Business Workspace AI-Powered</title>
      </Head>
      <Providers store={store}>
        <AppContent Component={Component} pageProps={pageProps} getLayout={getLayout} />
      </Providers>
      <ToastContainer />
    </>
  );
};

export default appWithTranslation(MyApp);
