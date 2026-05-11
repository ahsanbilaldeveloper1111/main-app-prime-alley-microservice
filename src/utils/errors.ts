export function getErrorMessage(error: unknown, fallback = "Unknown error"): string {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === "string") return error || fallback;
  if (error && typeof error === "object" && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }
  return fallback;
}

const API_FIELD_LABELS: Record<string, string> = {
  title: "Title",
  stage: "Stage",
  description: "Description",
  due_date: "Due date",
  status: "Status",
  sort_order: "Sort order",
};

function humanizeApiFieldKey(key: string): string {
  const mapped = API_FIELD_LABELS[key];
  if (mapped) return mapped;
  return key
    .split("_")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function formatValidationErrorsRecord(errors: Record<string, unknown>): string | null {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(errors)) {
    const label = humanizeApiFieldKey(key);
    if (Array.isArray(val)) {
      const first = val.find((x) => x != null && String(x).trim() !== "");
      if (first != null) {
        lines.push(`${label}: ${String(first)}`);
      }
    } else if (typeof val === "string" && val.trim() !== "") {
      lines.push(`${label}: ${val.trim()}`);
    }
  }
  return lines.length > 0 ? lines.join(" ") : null;
}

function formatHttpErrorFromResponseBody(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const o = data as Record<string, unknown>;
  const errs = o.errors;
  if (errs && typeof errs === "object" && !Array.isArray(errs)) {
    const formatted = formatValidationErrorsRecord(errs as Record<string, unknown>);
    if (formatted) {
      return formatted;
    }
  }
  const msg = o.message;
  if (typeof msg === "string" && msg.trim() !== "") {
    return msg.trim();
  }
  return null;
}

/**
 * Prefer Laravel-style `errors` + `message` from axios `response.data`, else `error.message`.
 * Use for staff-management and other JSON APIs that return validation details.
 */
export function getHttpApiErrorDetail(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") {
    return getErrorMessage(error, fallback);
  }
  const errObj = error as { response?: { data?: unknown }; message?: string };
  const fromBody = formatHttpErrorFromResponseBody(errObj.response?.data);
  if (fromBody) {
    return fromBody;
  }
  const em = errObj.message ?? (error instanceof Error ? error.message : undefined);
  if (typeof em === "string" && em.trim() !== "") {
    if (em.startsWith("Request failed with status code")) {
      return fallback;
    }
    return em.trim();
  }
  return fallback;
}

