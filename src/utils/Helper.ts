import { v4 as uuidv4 } from "uuid";
import parsePhoneNumber from "libphonenumber-js";
import { toast } from "react-toastify";
import { getSession } from "next-auth/react";
import type { Session } from "next-auth";

import moment from "moment-timezone";

type dateType = string | Date | null | undefined;

/** Values that may be parsed to a number for display (e.g. {@link formatNumber}, table cells). */
export type NumericAmountInput = number | string | null | undefined;

// Cache for session data to avoid multiple fetches
let sessionCache: { session: Session | null; timestamp: number } | null = null;
const SESSION_CACHE_TTL = 5000; // 5 seconds cache TTL

function getWebCrypto(): Crypto {
  const c = globalThis.crypto;
  if (c?.getRandomValues == null) {
    throw new Error("Web Crypto API (getRandomValues) is not available");
  }
  return c;
}

/** Uniform integer in [0, max) for password / ID generation (S2245: avoid Math.random). */
function randomIntBelow(max: number): number {
  if (max <= 0) {
    return 0;
  }
  const buf = new Uint32Array(1);
  const cryptoApi = getWebCrypto();
  const uint32Space = 2 ** 32;
  const upperBound = Math.floor(uint32Space / max) * max;
  let x: number;
  do {
    cryptoApi.getRandomValues(buf);
    x = buf[0]!;
  } while (x >= upperBound);
  return x % max;
}

function secureShuffleString(value: string): string {
  const chars = value.split("");
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIntBelow(i + 1);
    const atI = chars[i];
    const atJ = chars[j];
    if (atI !== undefined && atJ !== undefined) {
      chars[i] = atJ;
      chars[j] = atI;
    }
  }
  return chars.join("");
}

export const generateCustomId = (prefix = "", length = 12) => {
  const id = uuidv4().replaceAll("-", "");
  return prefix + id.substring(0, length);
};

export const generateComplexId = (length = 8) => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@";

  let result = "";
  result += upper.charAt(randomIntBelow(upper.length));
  result += lower.charAt(randomIntBelow(lower.length));
  result += digits.charAt(randomIntBelow(digits.length));
  result += special.charAt(randomIntBelow(special.length));

  const allChars = upper + lower + digits + special;
  const remainingLength = length - result.length;
  for (let i = 0; i < remainingLength; i += 1) {
    result += allChars.charAt(randomIntBelow(allChars.length));
  }

  return secureShuffleString(result);
};

/**
 * Timezone conversion utilities
 *
 * Usage Examples:
 *
 * // Convert UTC datetime to user's timezone
 * convertUTCToUserTimezone('2024-01-15 14:30:00', {
 *   outputFormat: 'YYYY-MM-DD hh:mm:ss A',
 *   showTimezone: true
 * });
 *
 * // Convert just time
 * convertUTCTimeToUserTimezone('2024-01-15 14:30:00', 'hh:mm:ss A');
 *
 * // Convert just date
 * convertUTCDateToUserTimezone('2024-01-15 14:30:00', 'MM/DD/YYYY');
 *
 * // Convert separate date and time fields (for your use case)
 * convertUTCSeparateDateTimeToUserTime('2023-10-03', '00:27:03.0000000', 'hh:mm:ss A');
 * convertUTCSeparateDateTimeToUserDate('2023-10-03', '00:27:03.0000000', 'YYYY-MM-DD');
 *
 * // Get user's timezone info
 * const timezoneInfo = getUserTimezoneInfo();
 *
 * // Format duration
 * formatDuration(3661); // Returns "1h 1m 1s"
 */
export interface TimezoneConversionOptions {
  inputFormat?: string;
  outputFormat?: string;
  showTimezone?: boolean;
  fallbackToUTC?: boolean;
}

/**
 * Convert UTC datetime to user's browser timezone
 * @param utcDateTime - The UTC datetime string or Date object
 * @param options - Configuration options for formatting
 * @returns Formatted datetime string in user's timezone
 */
function parseUtcMomentInput(
  utcDateTime: string | Date,
  inputFormat: string,
): moment.Moment {
  if (utcDateTime instanceof Date) {
    return moment.utc(utcDateTime);
  }
  let parsed = moment.utc(utcDateTime, inputFormat);
  if (!parsed.isValid()) {
    parsed = moment.utc(utcDateTime);
  }
  return parsed;
}

function formatUtcNowWithOptionalZone(outputFormat: string, showTimezone: boolean): string {
  return moment.utc().format(outputFormat) + (showTimezone ? " UTC" : "");
}

export const convertUTCToUserTimezone = (
  utcDateTime: string | Date,
  options: TimezoneConversionOptions = {},
): string => {
  const {
    inputFormat = "YYYY-MM-DD HH:mm:ss",
    outputFormat = "YYYY-MM-DD hh:mm:ss A",
    showTimezone = false,
    fallbackToUTC = true,
  } = options;

  try {
    const momentObj = parseUtcMomentInput(utcDateTime, inputFormat);

    if (!momentObj.isValid()) {
      if (fallbackToUTC) {
        console.warn(
          "Invalid datetime provided, falling back to UTC:",
          utcDateTime,
        );
        return formatUtcNowWithOptionalZone(outputFormat, showTimezone);
      }
      throw new Error("Invalid datetime format");
    }

    const userTimezone = momentObj.local();
    let formatted = userTimezone.format(outputFormat);

    if (showTimezone) {
      formatted += ` ${userTimezone.format("z")}`;
    }

    return formatted;
  } catch (error) {
    console.error("Error converting timezone:", error);
    if (fallbackToUTC) {
      return formatUtcNowWithOptionalZone(outputFormat, showTimezone);
    }
    return "Invalid Date";
  }
};

/**
 * Convert UTC datetime to user's timezone with time formatting
 * @param utcDateTime - The UTC datetime string or Date object
 * @param timeFormat - Format for time display (e.g., 'HH:mm:ss', 'hh:mm:ss A')
 * @returns Formatted time string in user's timezone
 */
export const convertUTCTimeToUserTimezone = (
  utcDateTime: string | Date,
  timeFormat: string = "hh:mm:ss A",
): string => {
  return convertUTCToUserTimezone(utcDateTime, {
    inputFormat: "YYYY-MM-DD HH:mm:ss",
    outputFormat: timeFormat,
    showTimezone: false,
  });
};

/**
 * Convert separate UTC date and time to user's timezone
 * @param date - The UTC date string (e.g., "2023-10-03")
 * @param time - The UTC time string (e.g., "00:27:03.0000000")
 * @param outputFormat - Format for output display
 * @returns Formatted datetime string in user's timezone
 */
export const convertDubaiDateTimeToUserTimezone = (
  date: string,
  time: string,
  outputFormat: string = "YYYY-MM-DD hh:mm:ss A",
): string => {
  try {
    // Clean up the time string to remove extra decimal places
    const cleanTime = time.split(".")[0]; // Remove microseconds

    // Combine date and time
    const utcDateTime = `${date} ${cleanTime}`;

    // Parse as UTC and convert to user's timezone
    const momentObj = moment(utcDateTime, "YYYY-MM-DD HH:mm:ss").tz(
      "Asia/Dubai",
    );
    if (!momentObj.isValid()) {
      console.warn("Invalid datetime format:", { date, time, utcDateTime });
      return "Invalid Date";
    }

    // Convert to user's timezone
    const userTimezone = momentObj.local();
    return userTimezone.format(outputFormat);
  } catch (error) {
    console.error("Error converting separate date/time:", error);
    return "Invalid Date";
  }
};

/**
 * Convert separate UTC date and time to user's timezone (time only)
 * @param date - The UTC date string (e.g., "2023-10-03")
 * @param time - The UTC time string (e.g., "00:27:03.0000000")
 * @param timeFormat - Format for time display (e.g., 'HH:mm:ss', 'hh:mm:ss A')
 * @returns Formatted time string in user's timezone
 */
export const convertUTCSeparateDateTimeToUserTime = (
  date: string,
  time: string,
  timeFormat: string = "hh:mm:ss A",
): string => {
  try {
    // Clean up the time string to remove extra decimal places
    const cleanTime = time.split(".")[0]; // Remove microseconds

    // Combine date and time
    const utcDateTime = `${date} ${cleanTime}`;

    // Parse as UTC and convert to user's timezone
    const momentObj = moment.utc(utcDateTime, "YYYY-MM-DD HH:mm:ss");
    if (!momentObj.isValid()) {
      console.warn("Invalid datetime format:", { date, time, utcDateTime });
      return "Invalid Date";
    }

    // Convert to user's local timezone
    const userTimezone = momentObj.local();
    return userTimezone.format(timeFormat);
  } catch (error) {
    console.error("Error converting separate UTC date/time:", error);
    return "Invalid Date";
  }
};

/**
 * Convert separate UTC date and time to user's timezone (date only)
 * @param date - The UTC date string (e.g., "2023-10-03")
 * @param time - The UTC time string (e.g., "00:27:03.0000000")
 * @param dateFormat - Format for date display (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY')
 * @returns Formatted date string in user's timezone
 */
export const convertUTCSeparateDateTimeToUserDate = (
  date: string,
  time: string,
  dateFormat: string = "YYYY-MM-DD",
): string => {
  try {
    // Clean up the time string to remove extra decimal places
    const cleanTime = time.split(".")[0]; // Remove microseconds

    // Combine date and time
    const utcDateTime = `${date} ${cleanTime}`;

    // Parse as UTC and convert to user's timezone
    const momentObj = moment.utc(utcDateTime, "YYYY-MM-DD HH:mm:ss");
    if (!momentObj.isValid()) {
      console.warn("Invalid datetime format:", { date, time, utcDateTime });
      return "Invalid Date";
    }

    // Convert to user's local timezone
    const userTimezone = momentObj.local();
    return userTimezone.format(dateFormat);
  } catch (error) {
    console.error("Error converting separate UTC date/time:", error);
    return "Invalid Date";
  }
};

/**
 * Convert UTC datetime to user's timezone with date formatting
 * @param utcDateTime - The UTC datetime string or Date object
 * @param dateFormat - Format for date display (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY')
 * @returns Formatted date string in user's timezone
 */
export const convertUTCDateToUserTimezone = (
  utcDateTime: string | Date,
  dateFormat: string = "YYYY-MM-DD",
): string => {
  return convertUTCToUserTimezone(utcDateTime, {
    inputFormat: "YYYY-MM-DD HH:mm:ss",
    outputFormat: dateFormat,
    showTimezone: false,
  });
};

/**
 * Get user's current timezone automatically
 * @returns Timezone string (e.g., "Asia/Karachi", "America/New_York")
 */
export const getAutoTimezone = (): string => {
  try {
    // Try to get timezone from browser/system
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone) {
        return timezone;
      }
    }
    // Fallback: try to guess timezone using moment
    // This is a fallback if Intl is not available
    return moment.tz.guess() || "UTC";
  } catch (error) {
    console.warn("Could not detect timezone, falling back to UTC:", error);
    return "UTC";
  }
};

/**
 * Get user's current timezone information
 * @returns Object containing timezone details
 */
export const getUserTimezoneInfo = () => {
  const now = moment();
  const autoTimezone = getAutoTimezone();
  return {
    timezone: autoTimezone,
    offset: now.format("Z"),
    offsetMinutes: now.utcOffset(),
    isDST: now.isDST(),
    abbreviation: now.format("z"),
  };
};

/**
 * Format duration in seconds to human readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m 45s")
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return "00:00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  // Format with leading zeros (e.g., 00:00:03 instead of 0:0:3)
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Simple datetime conversion to target timezone with custom format (auto-detects timezone)
 * @param datetime - The datetime string (any format)
 * @param format - The output format (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY', 'hh:mm:ss A', 'YYYY-MM-DD hh:mm:ss A')
 * @param inputFormat - Optional input format if you know the specific format of the input datetime
 * @param targetTimezone - Target timezone (default: auto-detected from browser/system)
 * @returns Formatted datetime string in target timezone
 *
 * @example
 * // Convert any datetime to auto-detected timezone
 * formatDateTimeToLocal('2024-01-15 14:30:00', 'YYYY-MM-DD hh:mm:ss A')
 * formatDateTimeToLocal('2024-01-15T14:30:00Z', 'MM/DD/YYYY hh:mm A')
 * formatDateTimeToLocal('2024-01-15 14:30:00', 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss')
 * formatDateTimeToLocal('2025-12-24 13:04:08 +04:00', 'YYYY-MM-DD hh:mm:ss A', undefined, 'Asia/Karachi')
 */
function parseMomentFromDatetimeStringWithoutInputFormat(datetime: string): moment.Moment {
  const hasTimezone = /[+-]\d{2}:\d{2}$|Z$/.test(datetime);

  if (!hasTimezone) {
    let m = moment.utc(datetime, "YYYY-MM-DD HH:mm:ss");
    if (!m.isValid()) {
      m = moment.utc(datetime);
    }
    return m;
  }

  let momentObj = moment.parseZone(datetime, "YYYY-MM-DD HH:mm:ss ZZ");
  if (!momentObj.isValid()) {
    momentObj = moment.parseZone(datetime, "YYYY-MM-DD HH:mm:ss Z");
  }
  if (!momentObj.isValid()) {
    momentObj = moment.parseZone(datetime);
  }
  return momentObj.utc();
}

function buildMomentForFormatDateTimeToLocal(
  datetime: string | Date,
  inputFormat?: string,
): moment.Moment {
  if (datetime instanceof Date) {
    return moment.utc(datetime);
  }
  if (inputFormat) {
    return moment.utc(datetime, inputFormat);
  }
  return parseMomentFromDatetimeStringWithoutInputFormat(datetime);
}

export const formatDateTimeToLocal = (
  datetime: string | Date,
  format: string = "YYYY-MM-DD hh:mm:ss A",
  inputFormat?: string,
  targetTimezone?: string,
): string => {
  try {
    const timezone = targetTimezone || getAutoTimezone();
    const momentObj = buildMomentForFormatDateTimeToLocal(datetime, inputFormat);

    if (!momentObj.isValid()) {
      console.warn("Invalid datetime format:", datetime);
      return "Invalid Date";
    }

    return momentObj.tz(timezone).format(format);
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return "Invalid Date";
  }
};

/**
 * Convert datetime string with timezone offset to specified timezone (auto-detects timezone)
 * @param datetimeString - Datetime string with timezone offset (e.g., "2025-12-24 13:04:08 +04:00")
 * @param targetTimezone - Target timezone (default: auto-detected from browser/system)
 * @param outputFormat - Optional output format (default: "YYYY-MM-DD hh:mm:ss A")
 * @returns Formatted datetime string in target timezone
 *
 * @example
 * convertDateTimeWithOffsetToLocal("2025-12-24 13:04:08 +04:00")
 * // Returns: converted to auto-detected timezone
 *
 * convertDateTimeWithOffsetToLocal("2025-12-24 13:04:08 +04:00", "Asia/Karachi", "YYYY-MM-DD HH:mm:ss")
 * // Returns: "2025-12-24 14:04:08"
 *
 * convertDateTimeWithOffsetToLocal("2025-12-24 13:04:08 +04:00", "America/New_York")
 * // Returns: "2025-12-24 05:04:08 AM" (converted to America/New_York)
 */
export const convertDateTimeWithOffsetToLocal = (
  datetimeString: string,
  targetTimezone?: string,
  outputFormat: string = "YYYY-MM-DD hh:mm:ss A",
): string => {
  try {
    // Auto-detect timezone if not provided
    const timezone = targetTimezone || getAutoTimezone();

    // Parse the datetime with timezone offset using parseZone to preserve the offset
    // ZZ format handles +04:00 (with colon)
    let momentObj = moment.parseZone(datetimeString, "YYYY-MM-DD HH:mm:ss ZZ");

    // If that fails, try Z format (handles +0400 without colon)
    if (!momentObj.isValid()) {
      momentObj = moment.parseZone(datetimeString, "YYYY-MM-DD HH:mm:ss Z");
    }

    // If format parsing fails, try auto-detect
    if (!momentObj.isValid()) {
      momentObj = moment.parseZone(datetimeString);
    }

    if (!momentObj.isValid()) {
      console.warn("Invalid datetime format:", datetimeString);
      return "Invalid Date";
    }

    // Convert to target timezone and format
    return momentObj.tz(timezone).format(outputFormat);
  } catch (error) {
    console.error("Error converting datetime with offset:", error);
    return "Invalid Date";
  }
};

/**
 * Debug function to test timezone conversion with your specific data
 * @param date - The UTC date string (e.g., "2023-10-03")
 * @param time - The UTC time string (e.g., "00:27:03.0000000")
 * @returns Object with conversion details for debugging
 */
export const debugTimezoneConversion = (date: string, time: string) => {
  const cleanTime = time.split(".")[0];
  const utcDateTime = `${date} ${cleanTime}`;

  const utcMoment = moment.utc(utcDateTime, "YYYY-MM-DD HH:mm:ss");
  const localMoment = utcMoment.local();

  return {
    input: { date, time, cleanTime, utcDateTime },
    utc: {
      formatted: utcMoment.format("YYYY-MM-DD HH:mm:ss"),
      timestamp: utcMoment.valueOf(),
    },
    local: {
      formatted: localMoment.format("YYYY-MM-DD HH:mm:ss"),
      timeFormatted: localMoment.format("hh:mm:ss A"),
      dateFormatted: localMoment.format("YYYY-MM-DD"),
      timezone: localMoment.format("z"),
      offset: localMoment.format("Z"),
    },
    isValid: utcMoment.isValid(),
  };
};

/** Moment format: full month and comma before year (e.g. "30 March, 2026"). */
export const GlobalDateFormat = "D MMMM, YYYY";
export const GlobalTimeFormat = "hh:mm:ss A";
export const GlobalDateTimeFormat = "D MMMM, YYYY hh:mm:ss A";

/** Calendar date for UI using {@link GlobalDateFormat} (e.g. `"02 Apr 2026"`). */
export const formatDateGlobal = (
  date: string | number | Date | null | undefined,
): string => {
  if (date == null || date === "") return "";
  const m = moment(date);
  return m.isValid() ? m.format(GlobalDateFormat) : "";
};

/** Date and time for UI using {@link GlobalDateTimeFormat}. */
export const formatDateTimeGlobal = (
  date: string | number | Date | null | undefined,
): string => {
  if (date == null || date === "") return "";
  const m = moment(date);
  return m.isValid() ? m.format(GlobalDateTimeFormat) : "";
};

/**
 * CRM tables and preview: full month name and comma before year (e.g. "30 March, 2026").
 */
export const formatCrmPreviewDate = (
  date: dateType,
): string => {
  if (!date) return "";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(dateObj.getTime())) return "";

    const day = dateObj.getDate();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    return `${day} ${month}, ${year}`;
  } catch (error) {
    console.error("Error formatting CRM preview date:", error);
    return "";
  }
};

/**
 * Format date for table display (same as {@link formatCrmPreviewDate}: e.g. "30 March, 2026").
 */
export const formatDateForTable = (
  date: string | Date | null | undefined,
): string => {
  return formatCrmPreviewDate(date);
};

/**
 * CRM preview panels with time: e.g. "30 March, 2025 at 03:45 PM"
 */
export const formatCrmPreviewDateTime = (
  date: dateType,
): string => {
  if (!date) return "";
  try {
    const m = moment(date);
    if (!m.isValid()) return "";
    return m.format("D MMMM, YYYY [at] hh:mm A");
  } catch (error) {
    console.error("Error formatting CRM preview datetime:", error);
    return "";
  }
};

/**
 * Convert a local-meeting date/time pair (as chosen by the user in a picker)
 * into UTC strings suitable for transport to the backend. The backend stores
 * meeting_date / meeting_time / start_date_time / end_date_time in UTC.
 *
 * Inputs: localDate "YYYY-MM-DD" and localTime "HH:mm".
 * Returns UTC-equivalent date ("YYYY-MM-DD"), time ("HH:mm"), and ISO string.
 */
export const convertLocalMeetingToUtc = (
  localDate: string,
  localTime: string,
): { utcDate: string; utcTime: string; utcIso: string } => {
  const m = moment(`${localDate} ${localTime}`, "YYYY-MM-DD HH:mm");
  if (!m.isValid()) {
    return { utcDate: localDate, utcTime: localTime, utcIso: "" };
  }
  const u = m.clone().utc();
  return {
    utcDate: u.format("YYYY-MM-DD"),
    utcTime: u.format("HH:mm"),
    utcIso: u.toISOString(),
  };
};

/**
 * Convert UTC-stored meeting date/time values from the backend into local
 * date/time strings for display / prefilling the meeting form.
 */
export const convertUtcMeetingToLocal = (
  utcDate: string | null | undefined,
  utcTime: string | null | undefined,
): { localDate: string; localTime: string } => {
  if (!utcDate || !utcTime) {
    return { localDate: utcDate ?? "", localTime: utcTime ?? "" };
  }
  const datePart = String(utcDate).slice(0, 10);
  const timePart = String(utcTime).trim().slice(0, 5);
  const m = moment.utc(`${datePart} ${timePart}`, "YYYY-MM-DD HH:mm");
  if (!m.isValid()) {
    return { localDate: datePart, localTime: timePart };
  }
  const l = m.clone().local();
  return {
    localDate: l.format("YYYY-MM-DD"),
    localTime: l.format("HH:mm"),
  };
};

/**
 * Format a UTC-stored meeting (date + time) in the viewer's local timezone.
 * Returns a human-readable string like "30 March, 2025 at 03:45 PM".
 */
export const formatMeetingDateTimeLocal = (
  utcDate: string | null | undefined,
  utcTime: string | null | undefined,
): string => {
  if (!utcDate) return "";
  try {
    const datePart = String(utcDate).slice(0, 10);
    const timePart = (utcTime ? String(utcTime).trim().slice(0, 5) : "") || "00:00";
    const m = moment.utc(`${datePart} ${timePart}`, "YYYY-MM-DD HH:mm");
    if (!m.isValid()) return "";
    return m.local().format("D MMMM, YYYY [at] hh:mm A");
  } catch (error) {
    console.error("Error formatting meeting datetime:", error);
    return "";
  }
};

/**
 * Format a UTC-stored meeting time (only) in the viewer's local timezone.
 * Returns a string like "03:45 PM". The date is needed to compute the
 * correct local time (DST / timezone offsets depend on the date).
 */
export const formatMeetingTimeLocal = (
  utcDate: string | null | undefined,
  utcTime: string | null | undefined,
): string => {
  if (!utcDate || !utcTime) return "";
  try {
    const datePart = String(utcDate).slice(0, 10);
    const timePart = String(utcTime).trim().slice(0, 5);
    const m = moment.utc(`${datePart} ${timePart}`, "YYYY-MM-DD HH:mm");
    if (!m.isValid()) return "";
    return m.local().format("hh:mm A");
  } catch (error) {
    console.error("Error formatting meeting time:", error);
    return "";
  }
};

/**
 * Format a UTC-stored meeting date in the viewer's local timezone. The time
 * is needed because the local calendar day can shift across the UTC day
 * boundary.
 */
export const formatMeetingDateLocal = (
  utcDate: string | null | undefined,
  utcTime: string | null | undefined,
): string => {
  if (!utcDate) return "";
  try {
    const datePart = String(utcDate).slice(0, 10);
    const timePart = (utcTime ? String(utcTime).trim().slice(0, 5) : "") || "00:00";
    const m = moment.utc(`${datePart} ${timePart}`, "YYYY-MM-DD HH:mm");
    if (!m.isValid()) return "";
    return m.local().format("D MMMM, YYYY");
  } catch (error) {
    console.error("Error formatting meeting date:", error);
    return "";
  }
};

/** Alias of {@link formatDuration} (zero-padded `HH:MM:SS`). */
export const formatMinutesAndSeconds = (seconds: number): string =>
  formatDuration(seconds);

export const convertSecondsToHHMMSS = (seconds: number): string => {
  if (!seconds || seconds < 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours === 0 && minutes === 0) return `${secs}s`;
  if (hours === 0) return `${minutes}m ${secs}s`;
  return `${hours}h ${minutes}m ${secs}s`;
};

export const convertSecondsToHumanReadable = (seconds: number): string => {
  if (!seconds || seconds < 0) return "0sec";

  const years = Math.floor(seconds / (365 * 24 * 3600));
  const months = Math.floor((seconds % (365 * 24 * 3600)) / (30 * 24 * 3600));
  const weeks = Math.floor((seconds % (30 * 24 * 3600)) / (7 * 24 * 3600));
  const days = Math.floor((seconds % (7 * 24 * 3600)) / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];

  if (years > 0) parts.push(`${years}Y`);
  if (months > 0) parts.push(`${months}M`);
  if (weeks > 0) parts.push(`${weeks}w`);
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}sec`);

  return parts.length > 0 ? parts.join(" ") : "0sec";
};

export const ModuleSlug = {
  CALL_REPORTS: "reports",
  CALL_LOGS: "call-logs",
  CALL_RECORDINGS: "call-recordings",
  TICKET: "tickets",
  BILLING: "accounts",
  LIVE_CALLS: "cti",
  USER_DIRECTORY: "users",

  CRM: "crm",
  CRM_CAMPAIGNS: "crm-campaigns",
  CRM_DATA_MANAGEMENT: "crm-data-management",
  CRM_OPPORTUNITIES: "crm-opportunities",
  CRM_LEADS: "crm-leads",
  CRM_DEALS: "crm-deals",
  CRM_ORDERS: "crm-orders",
  CRM_PRODUCTS: "crm-products",
  CRM_TASKS: "crm-tasks",
  CRM_STAGES: "crm-stages",
  CRM_LOST_REASONS: "crm-lost-reasons",
  CRM_HISTORY: "crm-history",
  CRM_REPORTS: "crm-reports",
  WORK_PLANNER: "work-planner",
  STAFF_MANAGEMENT: "staff-management",
};

export const formatCurrency = (amount: number | null): string => {
  if (amount === null || amount === 0) {
    return "0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

function parseNumericAmountForDisplay(amount: NumericAmountInput): number {
  if (amount === null || amount === undefined || amount === "") {
    return Number.NaN;
  }
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? amount : Number.NaN;
  }
  const cleaned = String(amount).replaceAll(",", "").trim();
  if (cleaned === "") {
    return Number.NaN;
  }
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : Number.NaN;
}

export const formatNumber = (
  amount: NumericAmountInput,
  withoutDecimals?: boolean,
): string => {
  const defaultZero = withoutDecimals ? "0" : "0.00";

  // Handle null, undefined, or empty string
  if (amount === null || amount === undefined || amount === "") {
    return defaultZero;
  }

  const numAmount = parseNumericAmountForDisplay(amount);

  // Check if the conversion resulted in a valid number
  if (Number.isNaN(numAmount) || !Number.isFinite(numAmount)) {
    return defaultZero;
  }

  // Handle zero case
  if (numAmount === 0) {
    return defaultZero;
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: withoutDecimals ? 0 : 2,
    maximumFractionDigits: withoutDecimals ? 0 : 2,
    useGrouping: "always",
  }).format(numAmount);
};

/** Human-readable file size for CRM attachment lists (shared by deals, approvals, orders). */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(Math.max(i, 0), sizes.length - 1);
  return (
    Math.round((bytes / Math.pow(k, idx)) * 100) / 100 + " " + sizes[idx]
  );
};

/**
 * Get cached session or fetch new one if cache is expired
 * This prevents multiple session fetches when checking permissions multiple times
 */
const getCachedSession = async (): Promise<Session | null> => {
  const now = Date.now();

  // Return cached session if it's still valid
  if (sessionCache && now - sessionCache.timestamp < SESSION_CACHE_TTL) {
    return sessionCache.session;
  }

  // Fetch new session and update cache
  try {
    const session = await getSession();
    sessionCache = {
      session,
      timestamp: now,
    };
    return session;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
};

/**
 * Check if the current user has a specific permission
 * Automatically retrieves session permissions from NextAuth with caching
 * @param permission - The permission string to check (e.g., 'view-users', 'edit-users')
 * @param session - Optional session object to use instead of fetching (for performance)
 * @returns Promise<boolean> - true if user has the permission, false otherwise
 *
 * @example
 * // Simple usage - just pass the permission slug (session is cached automatically)
 * const canViewUsers = await hasPermission('view-users');
 * const canEditUsers = await hasPermission('edit-users');
 *
 * // In async functions
 * if (await hasPermission('view-ranks')) {
 *   // User has permission
 * }
 *
 * // If you already have the session, pass it to avoid fetching
 * const session = await getSession();
 * const canView = await hasPermission('view-users', session);
 * const canEdit = await hasPermission('edit-users', session);
 */
export const hasPermission = async (
  permission: string,
  session?: Session | null,
): Promise<boolean> => {
  if (!permission) {
    return false;
  }

  try {
    // Use provided session or get cached session
    const userSession = session ?? (await getCachedSession());

    if (!userSession?.user?.permissions) {
      return false;
    }

    return userSession.user.permissions.includes(permission);
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
};

/**
 * Get the secret key for encoding/decoding from environment variable
 * Falls back to default key if not set
 * @private
 */
const getSecretKey = (): string => {
  const envKey = process.env.NEXT_PUBLIC_ENCODING_SECRET_KEY;
  if (!envKey) {
    console.warn("NEXT_PUBLIC_ENCODING_SECRET_KEY not set, using default key");
    return "A1n@lY$i$K3y#2024!XoR";
  }
  return envKey;
};

/**
 * XOR cipher helper function for obfuscation
 * @private
 */
const xorCipher = (text: string, key: string): string => {
  let result = "";
  for (let i = 0; i < text.length; ) {
    const cp = text.codePointAt(i);
    if (cp === undefined) break;
    const charLen = cp > 0xffff ? 2 : 1;
    const keyChar = key[i % key.length];
    const keyCp = keyChar.codePointAt(0) ?? 0;
    result += String.fromCodePoint(cp ^ keyCp);
    i += charLen;
  }
  return result;
};

/**
 * Apply character rotation/shifting for additional obfuscation
 * @private
 */
const rotateChars = (
  text: string,
  shift: number,
  forward: boolean = true,
): string => {
  return text
    .split("")
    .map((char) => {
      const code = char.codePointAt(0) ?? 0;
      if (code >= 32 && code <= 126) {
        const range = 126 - 32 + 1;
        const newCode = forward
          ? ((code - 32 + shift) % range) + 32
          : ((code - 32 - shift + range) % range) + 32;
        return String.fromCodePoint(newCode);
      }
      return char;
    })
    .join("");
};

/**
 * Apply multi-layer encoding to a string
 * Uses XOR cipher, character rotation, and multiple base64 encoding layers
 * @private
 */
const applyMultiLayerEncoding = (text: string, secretKey: string): string => {
  // Step 1: Apply XOR cipher
  const xorEncrypted = xorCipher(text, secretKey);

  // Step 2: Apply character rotation (forward)
  const rotated = rotateChars(xorEncrypted, 13, true);

  // Step 3: First base64 encoding
  const base64Layer1 = btoa(rotated);

  // Step 4: Apply XOR cipher again on base64 string
  const xorLayer2 = xorCipher(
    base64Layer1,
    secretKey.split("").reverse().join(""),
  );

  // Step 5: Apply reverse character rotation
  const rotated2 = rotateChars(xorLayer2, 7, false);

  // Step 6: Final base64 encoding
  const finalEncoded = btoa(rotated2);

  return finalEncoded;
};

/**
 * Apply multi-layer decoding to reverse the encoding process
 * Reverses XOR cipher, character rotation, and multiple base64 encoding layers
 * @private
 */
const applyMultiLayerDecoding = (
  encodedText: string,
  secretKey: string,
): string => {
  // Step 1: Decode final base64 layer
  const base64Decoded1 = atob(encodedText);

  // Step 2: Reverse character rotation (forward)
  const derotated1 = rotateChars(base64Decoded1, 7, true);

  // Step 3: Reverse XOR cipher (second layer)
  const xorDecrypted1 = xorCipher(
    derotated1,
    secretKey.split("").reverse().join(""),
  );

  // Step 4: Decode first base64 layer
  const base64Decoded2 = atob(xorDecrypted1);

  // Step 5: Reverse character rotation (backward)
  const derotated2 = rotateChars(base64Decoded2, 13, false);

  // Step 6: Reverse XOR cipher (first layer)
  const xorDecrypted2 = xorCipher(derotated2, secretKey);

  return xorDecrypted2;
};

/**
 * Encode analysis data with multi-layer encryption for URL parameter
 * Uses XOR cipher, character rotation, and multiple base64 encoding layers
 *
 * @param dataObject - Object containing analysis parameters (id, file, direction, phone, imagicle, duration)
 * @returns Complex encoded string ready for URL
 *
 * @example
 * const data = { id: '123', file: 'path/to/file', direction: 'IN', phone: '1234567890', imagicle: 'node1', duration: '1234567890' };
 * const encoded = encodeAnalysisData(data);
 */
export const encodeAnalysisData = (dataObject: {
  uuid?: string;
  direction?: string;
  phone?: string;
  imagicle?: string;
  duration?: string;
  dateTime?: string;
  dateOnly?: string;
  remotePartyNumber?: string;
  ownerUsername?: string;
  localPartyNumber?: string;
}): string => {
  try {
    // Get secret key from environment variable
    const secretKey = getSecretKey();

    // Convert to JSON string
    const jsonString = JSON.stringify(dataObject);

    // Apply multi-layer encoding
    const finalEncoded = applyMultiLayerEncoding(jsonString, secretKey);

    return finalEncoded;
  } catch (error) {
    console.error("Error encoding analysis data:", error);
    throw error;
  }
};

/**
 * Decode complex encoded analysis data from URL parameter
 * Reverses the multi-layer encryption process
 *
 * @param encodedData - Complex encoded string from URL
 * @returns Decoded data object with analysis parameters
 *
 * @example
 * const encoded = "...";
 * const decoded = decodeAnalysisData(encoded);
 * // Returns: { id: '123', file: 'path/to/file', direction: 'IN', phone: '1234567890', imagicle: 'node1', duration: '1234567890' }
 */
export const decodeAnalysisData = (
  encodedData: string,
): {
  uuid: string;
  direction: string;
  phone: string;
  imagicle: string;
  duration: string;
  dateTime: string;
  dateOnly: string;
  remotePartyNumber: string;
  ownerUsername: string;
  localPartyNumber: string;
} => {
  try {
    // Get secret key from environment variable (must match encoding key)
    const secretKey = getSecretKey();

    // Decode from URL encoding first
    const urlDecoded = decodeURIComponent(encodedData);

    // Apply multi-layer decoding
    const decodedString = applyMultiLayerDecoding(urlDecoded, secretKey);

    // Parse JSON
    const dataObject = JSON.parse(decodedString);

    return {
      uuid: dataObject.uuid || "",
      direction: dataObject.direction || "",
      phone: dataObject.phone || "",
      imagicle: dataObject.imagicle || "",
      duration: dataObject.duration || "",
      dateTime: dataObject.dateTime || "",
      dateOnly: dataObject.dateOnly || "",
      remotePartyNumber: dataObject.remotePartyNumber || "",
      ownerUsername: dataObject.ownerUsername || "",
      localPartyNumber: dataObject.localPartyNumber || "",
    };
  } catch (error) {
    console.error("Error decoding analysis data:", error);
    throw error;
  }
};

export enum ValidationType {
  EMAIL = "email",
  PHONE = "phone",
}

const customErrorMessages: Record<ValidationType, (name: string) => string> = {
  [ValidationType.EMAIL]: (name: string) =>
    `${name} is not a valid email address`,
  [ValidationType.PHONE]: (name: string) =>
    `${name} is not a valid phone number`,
};

type validationRule<
  T extends {
    [key: string]: unknown;
  },
> =
  | keyof T
  | {
      field: keyof T;
      name: string;
      type?: ValidationType;
      required?: boolean;
    };

type ValidationFieldEntry = Readonly<{
  value: unknown;
  name: string;
  isRequired: boolean;
  validationType?: ValidationType;
}>;

type ObjectValidationRule<T extends { [key: string]: unknown }> = {
  field: keyof T;
  name: string;
  type?: ValidationType;
  required?: boolean;
};

function isObjectValidationRule<T extends { [key: string]: unknown }>(
  field: validationRule<T>,
): field is ObjectValidationRule<T> {
  return typeof field === "object" && field !== null && "field" in field;
}

function resolveValidationFieldEntry<T extends { [key: string]: unknown }>(
  object: T,
  field: validationRule<T>,
): ValidationFieldEntry {
  if (isObjectValidationRule(field)) {
    return {
      value: object[field.field],
      name: field.name,
      isRequired: field.required ?? true,
      validationType: field.type,
    };
  }
  return {
    value: object[field],
    name: String(field),
    isRequired: true,
  };
}

function pushTypedValidationError(
  displayName: string,
  type: ValidationType,
  errorMessages: string[],
): void {
  const method = customErrorMessages[type];
  errorMessages.push(method ? method(displayName) : `Please fix ${displayName}`);
}

export function checkRequiredFields<
  T extends {
    [key: string]: unknown;
  },
>(object: T, requiredFields: validationRule<T>[]): boolean {
  let isValid = true;
  const missingFields: string[] = [];
  const errorMessages: string[] = [];

  for (const field of requiredFields) {
    const entry = resolveValidationFieldEntry(object, field);

    if (entry.validationType && entry.value) {
      if (!checkFieldValidation(entry.value, entry.validationType)) {
        isValid = false;
        pushTypedValidationError(entry.name, entry.validationType, errorMessages);
      }
    }

    if (entry.isRequired && !entry.value) {
      isValid = false;
      missingFields.push(entry.name);
    }
  }

  if (!isValid && missingFields.length > 0) {
    toast.error(
      `The following fields are required: ${missingFields.join(", ")}`,
    );
  }
  for (const errorMessage of errorMessages) {
    toast.error(errorMessage);
  }
  return isValid;
}

function checkFieldValidation(value: unknown, type: ValidationType): boolean {
  let isValid = true;
  switch (type) {
    case ValidationType.EMAIL:
      isValid = isValidEmail(value);
      break;
    case ValidationType.PHONE:
      isValid = isValide164PhoneNumber(value);
      break;
    default:
      isValid = false;
      break;
  }
  return isValid;
}

const MAX_EMAIL_LENGTH = 254;
const MAX_EMAIL_LOCAL_PART_LENGTH = 64;

function emailSegmentContainsAtOrWhitespace(segment: string): boolean {
  for (const ch of segment) {
    if (ch === "@" || /\s/.test(ch)) {
      return true;
    }
  }
  return false;
}

export function isValidEmail(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }
  const s = value.trim();
  if (s.length === 0 || s.length > MAX_EMAIL_LENGTH) {
    return false;
  }
  const at = s.indexOf("@");
  if (at <= 0 || at !== s.lastIndexOf("@")) {
    return false;
  }
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (
    local.length > MAX_EMAIL_LOCAL_PART_LENGTH ||
    emailSegmentContainsAtOrWhitespace(local) ||
    emailSegmentContainsAtOrWhitespace(domain)
  ) {
    return false;
  }
  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((label) => label.length === 0)) {
    return false;
  }
  return true;
}

function isValide164PhoneNumber(value: unknown): boolean {
  if (typeof value === "string") {
    const phoneNumber = parsePhoneNumber(value);
    return phoneNumber?.isValid() ?? false;
  }
  return false;
}

/** Toolbar/search text: strip invisible chars, collapse whitespace, trim. */
export function normalizeSearchQuery(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value)
    .replaceAll(/[\u200B-\u200D\uFEFF\u2060]/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();
}

/**
 * Search field while typing: strip zero-width / invisible chars only.
 * Do not trim or collapse whitespace here — trimming on each keystroke removes
 * trailing spaces and breaks typing multi-word queries (e.g. "John Doe").
 * Use {@link normalizeSearchQuery} when committing search (Enter / API).
 */
export function sanitizeSearchInputLive(value: string | null | undefined): string {
  if (value == null) return "";
  return String(value).replaceAll(/[\u200B-\u200D\uFEFF\u2060]/g, "");
}

/**
 * Convert a snake_case (or already plain) string into a human-readable
 * lower-case phrase. Returns the provided fallback when the value is
 * missing / not a string / empty.
 *
 * @example
 *   humanizeSnakeCase("participant_disconnected"); // "participant disconnected"
 *   humanizeSnakeCase("completed");                 // "completed"
 *   humanizeSnakeCase(null);                        // "—"
 */
export function humanizeSnakeCase(value: unknown, fallback = "—"): string {
  if (value == null) return fallback;
  if (typeof value !== "string") return fallback;
  const s = value.trim();
  if (!s) return fallback;
  if (!s.includes("_")) return s;
  return s
    .replaceAll("_", " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export const getGlobalExcludedPaths = () => ["/auth/signin"];

export enum RECORD_TYPES {
  PROSPECT = "prospect",
  LEAD = "lead",
  DEAL = "deal",
  COMPANY = "company",
  ORDER = "order",
}


export const FORMAT_CLOCK = (clock: string) => {
  const num = Number.parseInt(clock, 10);
  if (Number.isNaN(num)) return clock;

  const d = new Date(num * 1000);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const day = pad(d.getDate());
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // convert to 12-hour format
  const hourStr = pad(hours);

  return `${day} ${month} ${year} ${hourStr}:${minutes}:${seconds} ${ampm}`;
};

/** Minimal shape for company list lookups (CRM + voicebot inbound). */
type CompanyIdListItem = {
  id?: string | number;
  name?: string;
  company_id?: string | number;
  company_name?: string;
  identifier?: string | number;
};

function companyListIdMatches(
  c: CompanyIdListItem,
  idStr: string,
  idNum: number,
): boolean {
  const candidates = [c.id, c.company_id, c.identifier].filter(
    (v) => v != null && v !== "",
  );
  return candidates.some(
    (v) => String(v) === idStr || (!Number.isNaN(idNum) && Number(v) === idNum),
  );
}

/**
 * Find company name by id from a list of { id, name } objects.
 * Also supports voicebot inbound rows (`company_id`, `identifier`, `company_name`)
 * and camelCase-style ids when present on list items.
 * @param id - Company id (e.g. 1)
 * @param companiesObject - Array of objects with at least { id, name }
 * @returns The matching company name or undefined
 */
export function getCompanyByCrmId(
  id: string | number | null | undefined,
  companiesObject: CompanyIdListItem[] | null | undefined,
): string | undefined {
  if (
    id == null ||
    id === "" ||
    !Array.isArray(companiesObject) ||
    companiesObject.length === 0
  ) {
    return undefined;
  }
  const idStr = String(id).trim();
  if (!idStr) return undefined;
  const idNum = Number(idStr);
  const found = companiesObject.find((c) => companyListIdMatches(c, idStr, idNum));
  const rawName = found?.name ?? found?.company_name;
  if (typeof rawName !== "string") return undefined;
  const trimmed = rawName.trim();
  return trimmed || undefined;
}

/** Minimal shape for inbound bot list lookups (snake_case + camelCase ids). */
type InboundBotListItem = {
  id?: string | number;
  bot_id?: string | number;
  name?: string;
  bot_name?: string;
};

/**
 * Resolve a display name for an inbound voicebot from GET /bots/ list items.
 * Matches `id` or `bot_id` (string compare, case-insensitive for UUID-like ids).
 */
export function getBotNameByInboundId(
  id: string | number | null | undefined,
  bots: InboundBotListItem[] | null | undefined,
): string | undefined {
  if (id == null || id === "" || !Array.isArray(bots) || bots.length === 0) {
    return undefined;
  }
  const idStr = String(id).trim();
  if (!idStr) return undefined;
  const idLower = idStr.toLowerCase();
  const found = bots.find((b) => {
    const candidates = [b.id, b.bot_id].filter(
      (v) => v != null && v !== "",
    );
    return candidates.some((v) => {
      const s = String(v).trim();
      return s === idStr || s.toLowerCase() === idLower;
    });
  });
  const rawName = found?.name ?? found?.bot_name;
  if (typeof rawName !== "string") return undefined;
  const trimmed = rawName.trim();
  return trimmed || undefined;
}