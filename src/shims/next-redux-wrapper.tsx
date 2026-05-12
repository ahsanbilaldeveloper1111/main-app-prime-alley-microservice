/**
 * `next-redux-wrapper` shim — minimal SPA-friendly replacement.
 *
 * The original wrapper handled SSR hydration via the HYDRATE action. In a
 * SPA the store is created once at startup, so the wrapper degrades into a
 * thin object that exposes the same API surface (`useWrappedStore`, plus the
 * `HYDRATE` action constant kept for the toolkit reducer).
 */

import { useMemo } from "react";

export const HYDRATE = "__NEXT_REDUX_WRAPPER_HYDRATE__";

interface UseWrappedStoreResult<TStore> {
  store: TStore;
  props: Record<string, unknown>;
}

export interface NextWrapper<TStore> {
  useWrappedStore: (rest: Record<string, unknown>) => UseWrappedStoreResult<TStore>;
  withRedux: <P>(Component: P) => P;
  getServerSideProps: () => never;
  getStaticProps: () => never;
}

export function createWrapper<TStore>(
  makeStore: () => TStore,
  _options?: { debug?: boolean },
): NextWrapper<TStore> {
  let store: TStore | null = null;
  function getStore(): TStore {
    store ??= makeStore();
    return store;
  }

  return {
    useWrappedStore(rest) {
      const value = useMemo(() => {
        return { store: getStore(), props: rest };
      }, [rest]);
      return value;
    },
    withRedux(Component) {
      return Component;
    },
    getServerSideProps: () => {
      throw new Error("getServerSideProps is unavailable in SPA mode");
    },
    getStaticProps: () => {
      throw new Error("getStaticProps is unavailable in SPA mode");
    },
  };
}
