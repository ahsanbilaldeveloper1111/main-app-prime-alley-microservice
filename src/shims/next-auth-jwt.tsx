/**
 * `next-auth/jwt` shim — empty stubs.
 *
 * No JWTs are issued client-side; the BE owns the access/refresh tokens. The
 * functions are kept so any import (typically `getToken` from middleware
 * code) still resolves; they intentionally return null.
 */

export interface JWT {
  [key: string]: unknown;
}

export async function getToken(): Promise<null> {
  return null;
}

export async function decode(): Promise<null> {
  return null;
}

export async function encode(): Promise<string> {
  return "";
}
