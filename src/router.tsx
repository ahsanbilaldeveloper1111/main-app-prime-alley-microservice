/**
 * File-based router that mirrors the Next.js `pages/` convention so the
 * 400+ existing page files don't need to be moved or rewritten.
 *
 * Conventions handled:
 *   src/pages/foo/index.tsx         →  /foo
 *   src/pages/foo/bar.tsx           →  /foo/bar
 *   src/pages/foo/[id].tsx          →  /foo/:id
 *   src/pages/foo/[...slug].tsx     →  /foo/* (catch-all)
 *
 * Files under `src/pages/api/**` are excluded — they used to be Node API
 * routes and have moved to the Express sidecar in `server/`.
 */

import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";
import NProgress from "nprogress";
import { useAuthContext } from "./auth/AuthProvider";
import Providers from "./components/providers";
import { usePermissions } from "./utils/permissionUtils";
import {
  canAccessRoute,
  getRequiredPermissions,
  isProtectedPath,
} from "./config/permissions";

// Lazy-load the chatbot bundle so the unauthenticated/login flow doesn't pay
// for it. Mirrors the dynamic import the previous _app.tsx took via Next's
// runtime chunking.
const ChatbotWidget = lazy(() => import("./components/chatbot"));

NProgress.configure({ showSpinner: false });

const PUBLIC_PREFIXES = ["/auth/", "/public/payment", "/public/invoice-pay", "/access-denied", "/404"];
const PUBLIC_PATHS = new Set([
  "/",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/access-denied",
  "/dashboard",
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

interface PageModule {
  default: ComponentType<unknown> & {
    getLayout?: (page: ReactElement) => ReactNode;
  };
}

interface RouteEntry {
  path: string;
  Component: ComponentType<unknown>;
  getLayout?: (page: ReactElement) => ReactNode;
  isCatchAll: boolean;
}

const pageGlob = import.meta.glob<PageModule>([
  "./pages/**/*.{tsx,jsx}",
  "!./pages/api/**",
  "!./pages/_app.tsx",
  "!./pages/_document.tsx",
  "!./pages/_error.tsx",
]);

/** Static imports for pages that must exist even if `import.meta.glob` missed them (e.g. new file before dev restart). */
const supplementalPageGlob: Record<string, () => Promise<PageModule>> = {
  "./pages/chat/audit-logs/index.tsx": () =>
    import("./pages/chat/audit-logs/index"),
};

function normalizeGlobFilePath(filePath: string): string {
  return filePath.replaceAll("\\", "/");
}

/** Linear trim of trailing slashes (no regex — avoids ReDoS on pathnames). */
function stripTrailingSlashes(pathname: string): string {
  let end = pathname.length;
  while (end > 1 && pathname[end - 1] === "/") {
    end -= 1;
  }
  return pathname.slice(0, end);
}

function stripPagesExtension(relative: string): string {
  if (relative.endsWith(".tsx")) {
    return relative.slice(0, -4);
  }
  if (relative.endsWith(".jsx")) {
    return relative.slice(0, -4);
  }
  return relative;
}

function isValidRouteParamName(name: string): boolean {
  if (!name) return false;
  let index = 0;
  while (index < name.length) {
    const code = name.codePointAt(index);
    if (code === undefined) {
      return false;
    }
    const isDigit = code >= 48 && code <= 57;
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    if (!(isDigit || isUpper || isLower || code === 95 || code === 45)) {
      return false;
    }
    index += code > 0xffff ? 2 : 1;
  }
  return true;
}

/** Map `[id]` / `[...slug]` to `:id` / `*` without backtracking-prone regex. */
function mapDynamicRouteSegment(
  segment: string,
): { mapped: string; isCatchAll: boolean } | null {
  const maxLen = 256;
  if (segment.length < 3 || segment.length > maxLen) {
    return null;
  }
  if (!segment.startsWith("[") || !segment.endsWith("]")) {
    return null;
  }
  const inner = segment.slice(1, -1);
  if (!inner || inner.includes("[") || inner.includes("]") || inner.includes("/")) {
    return null;
  }
  if (inner.startsWith("...")) {
    const param = inner.slice(3);
    if (!isValidRouteParamName(param)) {
      return null;
    }
    return { mapped: "*", isCatchAll: true };
  }
  if (!isValidRouteParamName(inner)) {
    return null;
  }
  return { mapped: `:${inner}`, isCatchAll: false };
}

type PageLoader = () => Promise<PageModule>;

function mergePageGlobLoaders(): Record<string, PageLoader> {
  const merged: Record<string, PageLoader> = {
    ...(pageGlob as Record<string, PageLoader>),
  };
  for (const [filePath, loader] of Object.entries(supplementalPageGlob)) {
    const normalized = normalizeGlobFilePath(filePath);
    const exists = Object.keys(merged).some(
      (key) => normalizeGlobFilePath(key) === normalized,
    );
    if (!exists) {
      merged[filePath] = loader;
    }
  }
  return merged;
}

function lazyPageFromLoader(loader: PageLoader): ComponentType<unknown> {
  const Lazy = lazy(async () => {
    const mod = await loader();
    const Component = mod.default;
    const wrapper = (props: Record<string, unknown>) => {
      const element = <Component {...props} />;
      return Component.getLayout
        ? (Component.getLayout(element) as ReactElement)
        : element;
    };
    return { default: wrapper };
  });
  return Lazy as unknown as ComponentType<unknown>;
}

function fileToRoutePath(filePath: string): {
  path: string;
  isCatchAll: boolean;
} {
  // ./pages/foo/bar/[id].tsx → /foo/bar/:id
  // Normalize `\` (Windows) so glob keys always match the `./pages/` prefix.
  let relative = normalizeGlobFilePath(filePath);
  const pagesPrefix = "./pages/";
  if (relative.startsWith(pagesPrefix)) {
    relative = `/${relative.slice(pagesPrefix.length)}`;
  }
  relative = stripPagesExtension(relative);

  if (relative.endsWith("/index")) {
    relative = relative.slice(0, -"/index".length) || "/";
  }

  let isCatchAll = false;
  const segments = relative.split("/").filter(Boolean);
  const mappedSegments = segments.map((segment) => {
    const dynamic = mapDynamicRouteSegment(segment);
    if (!dynamic) {
      return segment;
    }
    if (dynamic.isCatchAll) {
      isCatchAll = true;
    }
    return dynamic.mapped;
  });

  const path = mappedSegments.length === 0 ? "/" : `/${mappedSegments.join("/")}`;
  return { path, isCatchAll };
}

function buildRouteEntries(): RouteEntry[] {
  const entriesByPath = new Map<string, RouteEntry>();
  for (const [filePath, loader] of Object.entries(mergePageGlobLoaders())) {
    const { path, isCatchAll } = fileToRoutePath(filePath);
    if (entriesByPath.has(path)) continue;
    entriesByPath.set(path, {
      path,
      Component: lazyPageFromLoader(loader),
      isCatchAll,
    });
  }
  const entries = [...entriesByPath.values()];
  // Static routes first, catch-all routes last so dynamic segments don't
  // accidentally swallow concrete paths (`/foo/bar` before `/foo/:id`).
  entries.sort((a, b) => {
    if (a.isCatchAll !== b.isCatchAll) return a.isCatchAll ? 1 : -1;
    const aDyn = a.path.includes(":") ? 1 : 0;
    const bDyn = b.path.includes(":") ? 1 : 0;
    if (aDyn !== bDyn) return aDyn - bDyn;
    return b.path.length - a.path.length;
  });
  return entries;
}

interface RouteGuardProps {
  readonly children: ReactNode;
}

/**
 * Replacement for the previous Next.js `middleware.ts`. Runs on every route
 * change and enforces:
 *   1. Auth gate (redirect to /auth/signin when unauthenticated and not on a
 *      public route).
 *   2. Permission gate (redirect to /access-denied when authenticated but
 *      missing the permissions defined in src/config/permissions.ts).
 *   3. 404 fallback for paths that aren't registered in the permission tree
 *      and aren't public — same behavior the old middleware had.
 */
export function RouteGuard({ children }: RouteGuardProps) {
  const { status, permissions } = useAuthContext();
  const location = useLocation();
  const pathname = location.pathname;

  const decision = useMemo(() => {
    if (isPublicPath(pathname)) return { allow: true } as const;
    if (status === "loading") return { allow: true } as const;

    if (status !== "authenticated") {
      const callbackUrl = encodeURIComponent(
        `${location.pathname}${location.search}${location.hash}`,
      );
      return {
        allow: false,
        redirect: `/auth/signin?reason=session_expired&callbackUrl=${callbackUrl}`,
      } as const;
    }

    if (!isProtectedPath(pathname)) {
      const required = getRequiredPermissions(pathname);
      if (required.length === 0) {
        return { allow: false, redirect: "/404" } as const;
      }
    }

    if (!canAccessRoute(permissions, pathname)) {
      return { allow: false, redirect: "/access-denied" } as const;
    }

    return { allow: true } as const;
  }, [
    pathname,
    location.search,
    location.hash,
    status,
    permissions,
  ]);

  if (!decision.allow && decision.redirect) {
    return <Navigate to={decision.redirect} replace />;
  }
  return <>{children}</>;
}

/**
 * Renders inside the route Suspense boundary while a lazy page chunk is
 * resolving. Drives NProgress (start on mount, done on unmount), preserving
 * the top-of-page progress bar the old `_app.tsx` ran via `Router.events`.
 */
/** React Router does not strip trailing slashes; permission checks do. Normalize here. */
function TrailingSlashRedirect() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const { pathname, search, hash } = location;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      navigate(`${stripTrailingSlashes(pathname)}${search}${hash}`, {
        replace: true,
      });
    }
  }, [location, navigate]);

  return null;
}

function PageLoadProgress() {
  useEffect(() => {
    NProgress.start();
    return () => {
      NProgress.done();
    };
  }, []);
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ height: "100vh" }}
    >
      <output className="spinner-border" aria-label="Loading">
        <span className="visually-hidden">Loading...</span>
      </output>
    </div>
  );
}

const CHATBOT_HIDDEN_PREFIXES = [
  "/auth/",
  "/live-calls",
  "/pages/login",
  "/login",
];

function shouldHideChatbot(pathname: string): boolean {
  return CHATBOT_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Conditional chatbot mount, mirroring the gating that used to live in the
 * AppContent block of the old `_app.tsx`: only show for authenticated users
 * with the `live-chat-users` permission, and never on the sign-in or
 * live-calls screens.
 */
function ChatbotGate() {
  const { status } = useAuthContext();
  const { hasPermission } = usePermissions();
  const { pathname } = useLocation();

  if (status !== "authenticated") return null;
  if (shouldHideChatbot(pathname)) return null;
  if (!hasPermission("live-chat-users")) return null;

  return (
    <Suspense fallback={null}>
      <ChatbotWidget />
    </Suspense>
  );
}

function RootLayout() {
  // <Providers> sits inside <RouterProvider> (mounted by AppRouter below) so
  // that TokenServiceProvider / SessionHandler / GlobalInputCapitalization can
  // call useLocation() / useNavigate(). Auth, Helmet, and the Sentry boundary
  // remain outside in src/main.tsx because they don't depend on router state.
  return (
    <Providers>
      <RouteGuard>
        <TrailingSlashRedirect />
        <Suspense fallback={<PageLoadProgress />}>
          <Outlet />
        </Suspense>
        <ChatbotGate />
      </RouteGuard>
    </Providers>
  );
}

function buildRouter() {
  const entries = buildRouteEntries();
  const children = entries.map((entry) => ({
    path: entry.path === "/" ? undefined : entry.path,
    index: entry.path === "/",
    element: <entry.Component />,
  }));

  // Always make sure we have a 404 leaf and a root-level catch-all so direct
  // URLs that don't match any page still render something.
  children.push({
    path: "*",
    index: false,
    element: <Navigate to="/404" replace />,
  });

  return createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children,
    },
  ]);
}

function getPageGlobSignature(): string {
  return Object.keys(mergePageGlobLoaders())
    .map((k) => normalizeGlobFilePath(k))
    .sort((a, b) => a.localeCompare(b))
    .join("\0");
}

export function AppRouter() {
  const pageGlobSignature = getPageGlobSignature();
  const router = useMemo(() => buildRouter(), [pageGlobSignature]);
  return (
    <RouterProvider router={router} key={pageGlobSignature} />
  );
}
