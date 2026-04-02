import { v4 as uuidv4 } from "uuid";
import parsePhoneNumber from "libphonenumber-js";
import { toast } from "react-toastify";
import { getSession } from "next-auth/react";
import type { Session } from "next-auth";

import moment from "moment-timezone";

// Cache for session data to avoid multiple fetches
let sessionCache: { session: Session | null; timestamp: number } | null = null;
const SESSION_CACHE_TTL = 5000; // 5 seconds cache TTL

export const generateCustomId = (prefix = "", length = 12) => {
  const id = uuidv4().replace(/-/g, ""); // Remove dashes to make it shorter
  return prefix + id.substring(0, length);
};

export const generateComplexId = (length = 8) => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@";

  // Ensure at least one of each type
  let result = "";
  result += upper.charAt(Math.floor(Math.random() * upper.length));
  result += lower.charAt(Math.floor(Math.random() * lower.length));
  result += digits.charAt(Math.floor(Math.random() * digits.length));
  result += special.charAt(Math.floor(Math.random() * special.length));

  // Fill remaining length with random chars from all types
  const allChars = upper + lower + digits + special;
  const remainingLength = length - result.length;
  for (let i = 0; i < remainingLength; i++) {
    result += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the result
  result = result
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return result;
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
    // Parse the UTC datetime
    let momentObj: moment.Moment;

    if (utcDateTime instanceof Date) {
      momentObj = moment.utc(utcDateTime);
    } else {
      // Try to parse with the input format first
      momentObj = moment.utc(utcDateTime, inputFormat);

      // If parsing fails, try common formats
      if (!momentObj.isValid()) {
        momentObj = moment.utc(utcDateTime);
      }
    }

    // If still invalid and fallback is enabled, return UTC
    if (!momentObj.isValid()) {
      if (fallbackToUTC) {
        console.warn(
          "Invalid datetime provided, falling back to UTC:",
          utcDateTime,
        );
        return moment.utc().format(outputFormat) + (showTimezone ? " UTC" : "");
      }
      throw new Error("Invalid datetime format");
    }

    // Convert to user's timezone
    const userTimezone = momentObj.local();

    // Format the result
    let formatted = userTimezone.format(outputFormat);

    if (showTimezone) {
      const timezoneAbbr = userTimezone.format("z");
      formatted += ` ${timezoneAbbr}`;
    }

    return formatted;
  } catch (error) {
    console.error("Error converting timezone:", error);
    if (fallbackToUTC) {
      return moment.utc().format(outputFormat) + (showTimezone ? " UTC" : "");
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
export const formatDateTimeToLocal = (
  datetime: string | Date,
  format: string = "YYYY-MM-DD hh:mm:ss A",
  inputFormat?: string,
  targetTimezone?: string,
): string => {
  try {
    // Auto-detect timezone if not provided
    const timezone = targetTimezone || getAutoTimezone();

    let momentObj: moment.Moment;

    if (datetime instanceof Date) {
      momentObj = moment.utc(datetime);
    } else if (inputFormat) {
      // Parse with specific input format as UTC
      momentObj = moment.utc(datetime, inputFormat);
    } else {
      // Check if datetime string contains timezone offset (e.g., +04:00, -05:00, Z)
      const hasTimezone = /[+-]\d{2}:\d{2}$|Z$/.test(datetime);

      if (hasTimezone) {
        // Parse with timezone offset - ZZ format handles +04:00 (with colon)
        // Try ZZ first (handles +04:00), then Z (handles +0400), then auto-detect
        momentObj = moment.parseZone(datetime, "YYYY-MM-DD HH:mm:ss ZZ");

        if (!momentObj.isValid()) {
          momentObj = moment.parseZone(datetime, "YYYY-MM-DD HH:mm:ss Z");
        }

        // If format parsing fails, try without format (for ISO formats)
        if (!momentObj.isValid()) {
          momentObj = moment.parseZone(datetime);
        }

        // parseZone preserves the timezone offset
        // Convert to UTC first, then we'll convert to target timezone
        // This ensures proper timezone conversion
        momentObj = momentObj.utc();
      } else {
        // Parse as UTC (server sends UTC times without offset)
        // Try common UTC formats first
        momentObj = moment.utc(datetime, "YYYY-MM-DD HH:mm:ss");

        // If that fails, try auto-detect but still assume UTC
        if (!momentObj.isValid()) {
          momentObj = moment.utc(datetime);
        }
      }
    }

    if (!momentObj.isValid()) {
      console.warn("Invalid datetime format:", datetime);
      return "Invalid Date";
    }

    // Convert to target timezone and format
    // If momentObj is in parseZone mode (has timezone), convert to target timezone
    // Otherwise, it's already in UTC mode, so convert to target timezone
    if (momentObj.isValid()) {
      return momentObj.tz(timezone).format(format);
    }

    return "Invalid Date";
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

/**
 * CRM tables and preview: full month name and comma before year (e.g. "30 March, 2026").
 */
export const formatCrmPreviewDate = (
  date: string | Date | null | undefined,
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
  date: string | Date | null | undefined,
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
 * Format seconds into minutes and seconds (e.g., "1m 20s")
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1m 20s", "20s")
 */
export const formatMinutesAndSeconds = (seconds: number): string => {
  if (!seconds || seconds < 0) return "00:00:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  // if (minutes === 0) return `${secs}s`;
  // return `${minutes}m ${secs}s`;
};

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
  if (amount === null || amount === 0 || amount === 0.0 || amount === 0.0) {
    return "0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatNumber = (
  amount: number | string | null | undefined,
  withoutDecimals?: boolean,
): string => {
  const defaultZero = withoutDecimals ? "0" : "0.00";

  // Handle null, undefined, or empty string
  if (amount === null || amount === undefined || amount === "") {
    return defaultZero;
  }

  // Convert string to number if needed
  const numAmount =
    typeof amount === "string" ? Number.parseFloat(amount) : amount;

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
  }).format(numAmount);
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
  for (let i = 0; i < text.length; i++) {
    const keyChar = key[i % key.length];
    result += String.fromCharCode(text.charCodeAt(i) ^ keyChar.charCodeAt(0));
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
      const code = char.charCodeAt(0);
      if (code >= 32 && code <= 126) {
        // Printable ASCII range
        const range = 126 - 32 + 1;
        const newCode = forward
          ? ((code - 32 + shift) % range) + 32
          : ((code - 32 - shift + range) % range) + 32;
        return String.fromCharCode(newCode);
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
export function checkRequiredFields<
  T extends {
    [key: string]: unknown;
  },
>(object: T, requiredFields: validationRule<T>[]): boolean {
  let isValid = true;
  const missingFields: string[] = [];
  const errorMessages: string[] = [];
  for (const field of requiredFields) {
    let value: unknown = "";
    let name: string = "";
    const isRequired =
      typeof field === "object" ? (field?.required ?? true) : true;
    if (typeof field === "string") {
      value = object[field];
      name = field;
    } else if (typeof field === "object") {
      value = object[field.field];
      name = field.name;
      if (field?.type && value) {
        const isFieldValid = checkFieldValidation(value, field.type);
        if (!isFieldValid) {
          isValid = false;
          const method = customErrorMessages?.[field.type];
          let errMessage = `Please fix ${field.name}`;
          if (method) {
            errMessage = method(field.name);
          }
          errorMessages.push(errMessage);
        }
      }
    }
    if (isRequired && !value) {
      isValid = false;
      missingFields.push(name);
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

function isValidEmail(value: unknown): boolean {
  if (typeof value === "string") {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  return false;
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

export const getGlobalExcludedPaths = () => ["/auth/signin"];

export enum RECORD_TYPES {
  PROSPECT = "prospect",
  LEAD = "lead",
  DEAL = "deal",
  COMPANY = "company",
  ORDER = "order",
}


export const FORMAT_CLOCK = (clock: string) => {
  const num = parseInt(clock, 10);
  if (isNaN(num)) return clock;

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

/**
 * Find company name by id from a list of { id, name } objects.
 * @param id - Company id (e.g. 1)
 * @param companiesObject - Array of objects with at least { id, name }
 * @returns The matching company name or undefined
 */
export function getCompanyByCrmId(
  id: string | number | null | undefined,
  companiesObject: { id?: string | number; name?: string }[] | null | undefined
): string | undefined {
  console.log('id', id);
  if (id == null || id === '' || !Array.isArray(companiesObject) || companiesObject.length === 0) {
    return undefined;
  }
  const idStr = String(id);
  const idNum = Number(id);
  const found = companiesObject.find(
    (c) => String(c.id) === idStr || Number(c.id) === idNum
  );
  return found?.name;
}