/**
 * `next/head` shim — backed by react-helmet-async.
 *
 * Pages that did `import Head from 'next/head'` keep working because Helmet
 * accepts the same children (title, meta, link, style tags, etc.).
 */

import { Helmet } from "react-helmet-async";
import type { ReactNode } from "react";

interface HeadProps {
  readonly children?: ReactNode;
}

export default function Head({ children }: HeadProps) {
  return <Helmet>{children}</Helmet>;
}
