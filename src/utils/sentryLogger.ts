import * as Sentry from "@sentry/nextjs";

export interface ApiErrorContext {
  apiResponse?: any;
  responseCode?: number;
  responseDataSuccess?: boolean;
  [key: string]: any;
}

/**
 * Report an API error to Sentry when the response body indicates failure
 * (e.g. 200 with success: false, or extractData/validateResponse detected error).
 * Use in extractData, validateResponse, or similar single-point handlers.
 */
export function reportApiError(
  source: string,
  errorMessage: string,
  context?: ApiErrorContext
): void {
  const error = new Error(errorMessage);
  Sentry.captureException(error, {
    extra: {
      source,
      ...context,
    },
  });
}

/**
 * Report a caught exception to Sentry (e.g. from catch blocks).
 * Use when you catch an error and want it logged without changing behavior.
 */
export function reportApiErrorFromCatch(
  error: unknown,
  source: string,
  extra?: Record<string, any>
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  Sentry.captureException(err, {
    extra: {
      source,
      ...extra,
    },
  });
}
