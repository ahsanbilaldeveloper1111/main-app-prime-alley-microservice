/**
 * `@sentry/nextjs` shim — re-exports `@sentry/react`.
 *
 * Existing files keep `import * as Sentry from "@sentry/nextjs"` while the
 * underlying SDK becomes the framework-agnostic React build. Helpers that
 * only existed on the Next package (e.g. `withSentryConfig`,
 * `captureUnderscoreErrorException`) are stubbed.
 */

export * from "@sentry/react";
import * as SentryReact from "@sentry/react";

export default SentryReact;

export function withSentryConfig<T>(config: T, _options?: unknown): T {
  return config;
}

export async function captureUnderscoreErrorException(
  contextData: unknown,
): Promise<void> {
  if (
    contextData &&
    typeof contextData === "object" &&
    "err" in contextData &&
    (contextData as { err?: unknown }).err
  ) {
    const err = (contextData as { err?: unknown }).err;
    if (err) {
      SentryReact.captureException(err);
    }
  }
}

export const init = SentryReact.init;
