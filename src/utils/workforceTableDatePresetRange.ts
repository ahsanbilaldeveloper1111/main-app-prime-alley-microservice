/**
 * Shared ISO date (YYYY-MM-DD) ranges for workforce table filters
 * ("Today", "Last 7 days", etc.).
 */

export type WorkforceTableDatePresetRange = Readonly<{
  from: string;
  to: string;
}>;

/**
 * @returns `null` for empty option, unknown option, or "All time" (no API range).
 */
export function getWorkforceTableDatePresetRange(
  option: string,
): WorkforceTableDatePresetRange | null {
  if (!option?.trim()) return null;
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const toStr = to.toISOString().slice(0, 10);
  const from = new Date(now);
  switch (option.trim()) {
    case "Today":
      return { from: toStr, to: toStr };
    case "Last 7 days":
      from.setDate(from.getDate() - 7);
      break;
    case "Last 30 days":
      from.setDate(from.getDate() - 30);
      break;
    case "Last 3 months":
      from.setMonth(from.getMonth() - 3);
      break;
    case "All time":
    default:
      return null;
  }
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString().slice(0, 10), to: toStr };
}
