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
import Router from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
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
        <title>Business Contact Center</title>
      </Head>
      <Providers store={store}>
        {getLayout(<Component {...pageProps} />)}
      </Providers>
      <ToastContainer />
    </>
  );
};

export default appWithTranslation(MyApp);
