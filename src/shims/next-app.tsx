/**
 * `next/app` shim — exposes the type aliases the codebase imports.
 * Vite SPA never instantiates these as actual Next runtime objects.
 */

import type { ComponentType, ReactNode } from "react";

export interface AppContext {
  Component: ComponentType<unknown>;
  pageProps: unknown;
  router: unknown;
}

export interface AppProps<P = unknown> {
  Component: ComponentType<P>;
  pageProps: P;
  router?: unknown;
  __N_SSG?: boolean;
  __N_SSP?: boolean;
}

export interface AppInitialProps<P = unknown> {
  pageProps: P;
}

export type AppPropsType = AppProps;

export default function App({
  Component,
  pageProps,
}: Readonly<AppProps>): ReactNode {
  return <Component {...(pageProps as Record<string, unknown>)} />;
}
