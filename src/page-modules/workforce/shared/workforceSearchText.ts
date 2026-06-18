export function toWorkforceSearchToken(part: unknown): string {
  if (part == null) {
    return "";
  }
  if (typeof part === "string") {
    return part.toLowerCase();
  }
  if (typeof part === "number" || typeof part === "boolean" || typeof part === "bigint") {
    return String(part).toLowerCase();
  }
  return "";
}

export function formatWorkforceUnknownNumber(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}`;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "—";
    }
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) {
      return `${numeric}`;
    }
  }

  return "—";
}
