/**
 * CTI monitoring APIs require line device types to be exactly `MOBILE` or `SOFT_HARD`.
 * DnsMap / STOMP may expose `SOFT`, `HARD`, or other labels — map those to `SOFT_HARD`.
 */
export type CtiApiMonitoringDeviceType = "MOBILE" | "SOFT_HARD";

export function normalizeCtiApiMonitoringDeviceType(
  raw: string | null | undefined,
): CtiApiMonitoringDeviceType {
  if (raw == null || typeof raw !== "string") {
    return "SOFT_HARD";
  }
  const u = raw.trim().toUpperCase();
  if (u === "MOBILE") {
    return "MOBILE";
  }
  return "SOFT_HARD";
}
