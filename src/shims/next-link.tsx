/**
 * `next/link` shim — backed by react-router-dom's Link.
 *
 * Mirrors the Next.js Link surface that's actually used in the codebase
 * (href, replace, scroll, prefetch, passHref, legacyBehavior, target).
 */

import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router-dom";

type Url = string | { pathname?: string; query?: Record<string, unknown> };

export interface NextLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: Url;
  as?: Url;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean | null;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
  locale?: string | false;
  children?: ReactNode;
}

function urlToString(url: Url): string {
  if (typeof url === "string") return url;
  const base = url.pathname ?? "/";
  if (!url.query) return base;
  const search = new URLSearchParams();
  Object.entries(url.query).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    let primitiveValue: string | null = null;
    if (typeof value === "string") primitiveValue = value;
    else if (typeof value === "number") primitiveValue = value.toString();
    else if (typeof value === "boolean") primitiveValue = value ? "true" : "false";
    else if (typeof value === "bigint") primitiveValue = value.toString();
    if (primitiveValue != null) {
      search.append(key, primitiveValue);
    }
    // Only stringify primitives — passing an object/array here would yield
    // "[object Object]" which is never the caller's intent, so skip silently.
  });
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(function NextLink(
  {
    href,
    as: _as,
    replace,
    scroll: _scroll,
    prefetch: _prefetch,
    shallow: _shallow,
    passHref: _passHref,
    legacyBehavior: _legacyBehavior,
    locale: _locale,
    children,
    target,
    rel,
    ...rest
  },
  ref,
) {
  const to = urlToString(href);

  // External / explicit-target links bypass router navigation to keep behavior
  // identical to Next.js (which renders a plain <a> for absolute URLs).
  const isExternal = /^(https?:|mailto:|tel:)/i.test(to);
  if (isExternal || target === "_blank") {
    return (
      <a
        ref={ref}
        href={to}
        target={target}
        rel={target === "_blank" ? rel ?? "noopener noreferrer" : rel}
        {...rest}
      >
        {children}
      </a>
    );
  }

  const linkProps: RouterLinkProps = { to, replace: !!replace };
  return (
    <RouterLink ref={ref} {...linkProps} target={target} rel={rel} {...rest}>
      {children}
    </RouterLink>
  );
});

export default Link;
