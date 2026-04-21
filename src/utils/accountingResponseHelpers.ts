/**
 * Accounting / Controlhub-style APIs.
 *
 * Legacy axios body: `{ code: 200, data: { success, data, message, summary, pagination } }`.
 * New axios body: the inner object directly — `{ success, data, message?, summary?, pagination? }`.
 */

export function peelAccountingResponseBody(body: unknown): Record<string, any> | null {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  const o = body as Record<string, any>;
  if (
    "code" in o &&
    o.data != null &&
    typeof o.data === "object" &&
    !Array.isArray(o.data)
  ) {
    return o.data as Record<string, any>;
  }
  return o;
}

/** Returns the peeled body only when `success === true`. */
export function accountingEnvelopeSuccess(body: unknown): Record<string, any> | null {
  if (body == null || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  const envelope = (peelAccountingResponseBody(body) ?? body) as Record<string, any>;
  if (envelope.success !== true) {
    return null;
  }
  return envelope;
}

export function extractAccountingApiData<T>(response: any): T {
  if (response == null) {
    throw new Error("API request failed");
  }
  if (Array.isArray(response)) {
    return response as T;
  }
  if (typeof response !== "object") {
    return response as T;
  }

  const root = peelAccountingResponseBody(response);
  const envelope = root ?? (response as Record<string, any>);

  if (envelope.success === false) {
    throw new Error(
      typeof envelope.message === "string" && envelope.message.trim()
        ? envelope.message
        : "API request failed",
    );
  }

  if (envelope.success === true && envelope.data !== undefined) {
    // DELETE and similar calls often return `{ success: true, data: null }`. Unwrapping would
    // yield `null` and lose `success`/`message`, so keep the envelope for callers.
    if (envelope.data === null) {
      return envelope as unknown as T;
    }
    return envelope.data as T;
  }

  if (!("success" in envelope) || envelope.success === undefined) {
    return response as T;
  }

  if (envelope.success === true) {
    return envelope as unknown as T;
  }

  console.error("Failed to extract data from response:", response);
  throw new Error(
    typeof envelope.message === "string" && envelope.message.trim()
      ? envelope.message
      : "API request failed",
  );
}
