/**
 * Resolve a backend-relative path (e.g. "/api/storage/foo.jpg") to an
 * absolute URL pointing at the backend service. After dropping Next.js the
 * frontend talks to the backend directly instead of going through Next's
 * `/api` proxy, so any code that still composes raw `/api/...` URLs is
 * routed here.
 *
 * - Absolute URLs (http/https), data URIs, and blob URLs are returned as-is.
 * - When the path is already a same-origin URL relative to the document, it
 *   is normalised to start with a single slash.
 */
const env = (import.meta.env ?? {}) as Record<string, string | undefined>;
const RAW_BACKEND_URL =
  env.VITE_BACKEND_URL ?? env.NEXT_PUBLIC_BACKEND_URL ?? "";
const BACKEND_BASE = RAW_BACKEND_URL.replace(/\/+$/, "");

export const backendBaseUrl = BACKEND_BASE;

export function backendUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("data:") || path.startsWith("blob:")) return path;
  const normalised = path.startsWith("/") ? path : `/${path}`;
  if (!BACKEND_BASE) return normalised;
  return `${BACKEND_BASE}${normalised}`;
}
