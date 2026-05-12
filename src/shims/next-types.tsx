/**
 * Type-only shim for the bare `next` module. Existing pages occasionally
 * import `NextPage`, `GetServerSideProps`, etc. as types. After dropping
 * Next.js none of those server hooks run, but the type aliases are still
 * referenced — we expose minimal stand-ins so the codebase keeps compiling.
 */

import type { ComponentType, ReactElement, ReactNode } from "react";

export type NextPage<P = Record<string, unknown>, IP = P> = ComponentType<P> & {
  getInitialProps?(ctx: unknown): IP | Promise<IP>;
  getLayout?(page: ReactElement): ReactNode;
};

export type GetServerSideProps<P = Record<string, unknown>> = (
  ...args: unknown[]
) => Promise<{ props: P }>;

export type GetStaticProps<P = Record<string, unknown>> = (
  ...args: unknown[]
) => Promise<{ props: P }>;

export type GetStaticPaths = () => Promise<{
  paths: Array<{ params: Record<string, string> }>;
  fallback?: boolean | "blocking";
}>;

export type InferGetServerSidePropsType<T> = T extends GetServerSideProps<
  infer P
>
  ? P
  : never;

export type InferGetStaticPropsType<T> = T extends GetStaticProps<infer P>
  ? P
  : never;

export type Metadata = Record<string, unknown>;
