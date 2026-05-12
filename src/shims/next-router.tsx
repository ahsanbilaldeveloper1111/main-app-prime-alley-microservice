/**
 * `next/router` shim — backed by react-router v7.
 *
 * Re-exposes the small subset of the Next.js router API that the codebase
 * actually uses (push/replace/back/query/asPath/pathname/isReady/events).
 * Anything that relied on Next-specific behavior (RSC prefetching, etc.)
 * is intentionally a no-op.
 */

import { useEffect, useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
  type Location,
  type NavigateFunction,
} from "react-router-dom";

type Url = string | { pathname?: string; query?: Record<string, unknown> };
type EventName =
  | "routeChangeStart"
  | "routeChangeComplete"
  | "routeChangeError"
  | "beforeHistoryChange"
  | "hashChangeStart"
  | "hashChangeComplete";
type EventHandler = (...args: unknown[]) => void;
type RouterQuery = Record<string, string | string[] | undefined>;

interface RouterShimEvents {
  on: (event: EventName, cb: EventHandler) => void;
  off: (event: EventName, cb: EventHandler) => void;
  emit: (event: EventName, ...args: unknown[]) => void;
}

const listeners = new Map<EventName, Set<EventHandler>>();

const events: RouterShimEvents = {
  on(event, cb) {
    let bucket = listeners.get(event);
    if (!bucket) {
      bucket = new Set();
      listeners.set(event, bucket);
    }
    bucket.add(cb);
  },
  off(event, cb) {
    listeners.get(event)?.delete(cb);
  },
  emit(event, ...args) {
    listeners.get(event)?.forEach((cb) => {
      try {
        cb(...args);
      } catch (error) {
        console.warn(`next/router shim: event handler for ${event} threw`, error);
      }
    });
  },
};

function urlToString(url: Url): string {
  if (typeof url === "string") return url;
  const base = url.pathname ?? "/";
  if (!url.query) return base;
  const search = new URLSearchParams();
  Object.entries(url.query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    // Only stringify primitives — passing an object/array here would yield
    // "[object Object]" which is never the caller's intent, so skip silently.
    if (typeof value === "string") {
      search.append(key, value);
    } else if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    ) {
      search.append(key, value.toString());
    }
  });
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

function buildAsPath(location: Location): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

function buildQuery(
  params: Record<string, string | undefined>,
  searchParams: URLSearchParams,
): RouterQuery {
  const result: RouterQuery = { ...params };
  searchParams.forEach((value, key) => {
    if (key in result) {
      const existing = result[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else if (typeof existing === "string") {
        result[key] = [existing, value];
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  });
  return result;
}

interface NextRouterShim {
  pathname: string;
  asPath: string;
  route: string;
  basePath: string;
  query: RouterQuery;
  isReady: boolean;
  isFallback: boolean;
  isPreview: boolean;
  push: (url: Url, as?: Url, options?: { shallow?: boolean }) => Promise<boolean>;
  replace: (url: Url, as?: Url, options?: { shallow?: boolean }) => Promise<boolean>;
  back: () => void;
  reload: () => void;
  prefetch: () => Promise<void>;
  beforePopState: () => void;
  events: RouterShimEvents;
  locale?: string;
  defaultLocale?: string;
  locales?: string[];
}

function buildRouter(
  location: Location,
  navigate: NavigateFunction,
  params: Record<string, string | undefined>,
  searchParams: URLSearchParams,
): NextRouterShim {
  const asPath = buildAsPath(location);
  const query = buildQuery(params, searchParams);

  const push = async (
    url: Url,
    _as?: Url,
    _options?: { shallow?: boolean },
  ) => {
    const target = urlToString(url);
    events.emit("routeChangeStart", target);
    navigate(target);
    events.emit("routeChangeComplete", target);
    return true;
  };

  const replace = async (
    url: Url,
    _as?: Url,
    _options?: { shallow?: boolean },
  ) => {
    const target = urlToString(url);
    events.emit("routeChangeStart", target);
    navigate(target, { replace: true });
    events.emit("routeChangeComplete", target);
    return true;
  };

  return {
    pathname: location.pathname,
    asPath,
    route: location.pathname,
    basePath: "",
    query,
    isReady: true,
    isFallback: false,
    isPreview: false,
    push,
    replace,
    back: () => navigate(-1),
    reload: () => {
      if (globalThis.window !== undefined) globalThis.location.reload();
    },
    prefetch: async () => {
      // SPA: there's nothing to prefetch.
    },
    beforePopState: () => {
      // No-op in SPA mode.
    },
    events,
  };
}

export function useRouter(): NextRouterShim {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  return useMemo(
    () => buildRouter(location, navigate, params, searchParams),
    [location, navigate, params, searchParams],
  );
}

/**
 * Imperative router for non-React callers. Returns a stale snapshot the first
 * time it is called outside React; the snapshot is kept fresh by the React
 * adapter mounted at the root of the app (see RouterAdapter below).
 */
let imperativeRouter: NextRouterShim | null = null;

export function getImperativeRouter(): NextRouterShim {
  if (imperativeRouter) return imperativeRouter;
  if (globalThis.window === undefined) {
    throw new TypeError("next/router shim: not available during SSR");
  }
  // Fallback shim that uses globalThis.location until the React adapter mounts.
  const loc = globalThis.location;
  return {
    pathname: loc.pathname,
    asPath: `${loc.pathname}${loc.search}${loc.hash}`,
    route: loc.pathname,
    basePath: "",
    query: Object.fromEntries(new URLSearchParams(loc.search)),
    isReady: true,
    isFallback: false,
    isPreview: false,
    push: async (url) => {
      loc.assign(urlToString(url));
      return true;
    },
    replace: async (url) => {
      loc.replace(urlToString(url));
      return true;
    },
    back: () => globalThis.history.back(),
    reload: () => loc.reload(),
    prefetch: async () => undefined,
    beforePopState: () => undefined,
    events,
  };
}

export function NextRouterAdapter() {
  const router = useRouter();
  useEffect(() => {
    imperativeRouter = router;
  }, [router]);
  return null;
}

const Router = {
  push: (url: Url) => getImperativeRouter().push(url),
  replace: (url: Url) => getImperativeRouter().replace(url),
  back: () => getImperativeRouter().back(),
  reload: () => getImperativeRouter().reload(),
  events,
};

export default Router;

export type { NextRouterShim as NextRouter };

// `withRouter` HOC compatibility.
export function withRouter<P extends object>(
  Component: React.ComponentType<P & { router: NextRouterShim }>,
): React.ComponentType<P> {
  function WithRouter(props: P) {
    const router = useRouter();
    return <Component {...props} router={router} />;
  }
  WithRouter.displayName = `withRouter(${Component.displayName ?? Component.name ?? "Component"})`;
  return WithRouter;
}
