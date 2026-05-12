/**
 * `next/document` shim — no-op in SPA mode.
 *
 * The HTML shell is now in `index.html`. These exports are kept so that
 * the now-removed _document.tsx (and any other code still importing them)
 * still type-checks during the transition.
 */

import type { ReactNode } from "react";

export default function Document() {
  return null;
}

type DocumentChildrenProps = Readonly<{ children?: ReactNode }>;

export function Html({ children }: DocumentChildrenProps) {
  return <>{children}</>;
}

export function Head({ children }: DocumentChildrenProps) {
  return <>{children}</>;
}

export function Main() {
  return null;
}

export function NextScript() {
  return null;
}
