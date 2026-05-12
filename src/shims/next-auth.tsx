/**
 * `next-auth` (default) shim.
 *
 * The legacy code imports types like `NextAuthOptions` and `Session`. Those
 * pages no longer execute server-side, so we provide minimal type-compatible
 * exports to keep TypeScript happy while the auth callsites are refactored
 * to the new `@/auth` module.
 */

import type { ReactNode } from "react";

export interface User {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  permissions?: string[];
  [key: string]: unknown;
}

export interface Session {
  user: User;
  expires: string;
}

export interface NextAuthOptions {
  providers: unknown[];
  session?: { strategy?: string; maxAge?: number };
  callbacks?: Record<string, unknown>;
  pages?: Record<string, string>;
  jwt?: unknown;
  secret?: string;
}

export default function NextAuth(_options: NextAuthOptions): never {
  throw new Error(
    "NextAuth is no longer used. Authentication is handled by src/auth/AuthProvider.tsx.",
  );
}

export function getServerSession(): never {
  throw new Error(
    "getServerSession is unavailable in SPA mode. Use useAuthContext() from @/auth instead.",
  );
}

export interface AuthProviderProps {
  children: ReactNode;
}
