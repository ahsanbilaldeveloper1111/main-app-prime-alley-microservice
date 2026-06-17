import { GlobalDateTimeFormat, GlobalTimeFormat } from "@utils/Helper";
import moment from "moment";

const HAS_TIMEZONE_SUFFIX = /(?:[+-]\d{2}:?\d{2}|Z)$/i;

/**
 * Staff-management attendance timestamps are stored in UTC. Naive values
 * (no `Z` / offset) must be parsed as UTC, then shown in the user's local zone.
 */
export function parseWorkforceAttendanceDateTime(
  value: string | null | undefined,
): moment.Moment | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (HAS_TIMEZONE_SUFFIX.test(trimmed)) {
    const zoned = moment.parseZone(trimmed);
    return zoned.isValid() ? zoned : null;
  }

  const formats = ["YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DD HH:mm:ss", moment.ISO_8601];
  for (const format of formats) {
    const parsed = moment.utc(trimmed, format, true);
    if (parsed.isValid()) {
      return parsed;
    }
  }

  const fallback = moment.utc(trimmed);
  return fallback.isValid() ? fallback : null;
}

export function readWorkforceAttendanceEpochMs(value: string | null | undefined): number | null {
  const parsed = parseWorkforceAttendanceDateTime(value);
  if (!parsed?.isValid()) {
    return null;
  }
  return parsed.valueOf();
}

export function formatWorkforceAttendanceDateTime(value: string | null | undefined): string {
  const parsed = parseWorkforceAttendanceDateTime(value);
  if (!parsed) {
    return "—";
  }
  return parsed.local().format(GlobalDateTimeFormat);
}

export function formatWorkforceAttendanceTime(value: string | null | undefined): string {
  const parsed = parseWorkforceAttendanceDateTime(value);
  if (!parsed) {
    return "—";
  }
  return parsed.local().format(GlobalTimeFormat);
}
