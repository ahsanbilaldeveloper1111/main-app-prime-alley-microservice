import { useEffect } from "react";

interface ScriptProps {
  src?: string;
  id?: string;
  strategy?: "afterInteractive" | "beforeInteractive" | "lazyOnload" | "worker";
  onLoad?: () => void;
  onReady?: () => void;
  onError?: (error: unknown) => void;
  children?: string;
  [key: string]: unknown;
}

/**
 * Shim for `next/script` that injects a `<script>` tag once on mount and
 * removes it on unmount. The Next-only `strategy` prop is accepted for
 * compatibility but only `afterInteractive` semantics are implemented — which
 * matches how every existing call site in this codebase used it.
 */
export default function Script({
  src,
  id,
  onLoad,
  onError,
  children,
  ...rest
}: ScriptProps) {
  useEffect(() => {
    if (!src && !children) return;

    const existing = id ? document.getElementById(id) : null;
    if (existing) {
      onLoad?.();
      return;
    }

    const el = document.createElement("script");
    if (id) el.id = id;
    if (src) el.src = src;
    if (children) el.innerHTML = children;
    el.async = true;

    for (const [key, value] of Object.entries(rest)) {
      if (typeof value === "string" || typeof value === "number") {
        el.setAttribute(key, String(value));
      }
    }

    const handleLoad = () => onLoad?.();
    const handleError = (event: Event) => onError?.(event);
    el.addEventListener("load", handleLoad);
    el.addEventListener("error", handleError);

    document.head.appendChild(el);

    return () => {
      el.removeEventListener("load", handleLoad);
      el.removeEventListener("error", handleError);
      el.remove();
    };
  }, [src, id, children, onLoad, onError]);

  return null;
}
