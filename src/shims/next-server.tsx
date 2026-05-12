/**
 * `next/server` shim — empty in SPA mode.
 *
 * The middleware that imported NextResponse / NextRequest has been replaced
 * by a `<RouteGuard>` React component (see src/router.tsx). These exports
 * exist only to keep stray imports from breaking the build.
 */

export class NextResponse {
  static next() {
    return undefined;
  }

  static redirect(url: string | URL) {
    if (globalThis.window !== undefined) {
      globalThis.location.assign(url.toString());
    }
    return undefined;
  }

  static rewrite(_url: string | URL) {
    return undefined;
  }
}

export type NextRequest = Request & {
  nextUrl: URL;
  cookies: { get: (name: string) => { value: string } | undefined };
};
