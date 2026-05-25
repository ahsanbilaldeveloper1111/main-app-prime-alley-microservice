/** Human-readable date/time for AI analysis settings (pricing, tenant config, tables). */
export function formatAnalysisTimestamp(
  value: string | null | undefined,
): string {
  if (!value?.trim()) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.trim();
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** For “Last updated” labels; returns null when there is no timestamp. */
export function formatAnalysisLastUpdated(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) {
    return null;
  }
  return formatAnalysisTimestamp(value);
}
