function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Linear trim of leading/trailing slashes (no regex — avoids ReDoS on URL paths). */
function trimPathSlashes(path: string, maxLen = 2048): string {
  const bounded = path.length > maxLen ? path.slice(0, maxLen) : path;
  let start = 0;
  let end = bounded.length;
  while (start < end && bounded[start] === "/") {
    start += 1;
  }
  while (end > start && bounded[end - 1] === "/") {
    end -= 1;
  }
  return bounded.slice(start, end);
}

function normalizeRetryAfterSeconds(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value));
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  return undefined;
}

function readRetryAfterHeader(headers: unknown): number | undefined {
  if (!headers || typeof headers !== "object") {
    return undefined;
  }
  const record = headers as Record<string, unknown>;
  const raw =
    record["retry-after"] ??
    record["Retry-After"] ??
    record.retryAfter ??
    record.RetryAfter;
  return normalizeRetryAfterSeconds(raw);
}

/** Body field on HTTP 429 from `POST/GET /api/chat/`. */
export type ChatRateLimitErrorBody = {
  error?: string;
  message?: string;
  retry_after: number;
};

/**
 * Seconds to wait before retrying (HTTP 429). Prefers `retry_after` in JSON body,
 * then `Retry-After` response header. Always returns `>= 1` when status is 429.
 */
export function parseHttpRetryAfterSeconds(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = error.response;
  if (!isRecord(response) || response.status !== 429) {
    return undefined;
  }

  if (isRecord(response.data)) {
    const fromBody = normalizeRetryAfterSeconds(response.data.retry_after);
    if (fromBody !== undefined) {
      return fromBody;
    }
  }

  return readRetryAfterHeader(response.headers);
}

export function httpErrorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  const response = error.response;
  if (!isRecord(response)) {
    return undefined;
  }
  const status = response.status;
  return typeof status === "number" ? status : undefined;
}

export function rateLimitUserMessage(retryAfterSeconds: number): string {
  const seconds = Math.max(1, Math.floor(retryAfterSeconds));
  return `Too many requests. Please try again in ${seconds} second${seconds === 1 ? "" : "s"}.`;
}

/** True for assistant thread routes only (`/chat/`, not `/chat/survey`, `/chat/tenant-faqs`, etc.). */
export function isChatAssistantThreadRequest(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  const pathOnly = url.split("?")[0] ?? "";
  return trimPathSlashes(pathOnly) === "chat";
}
