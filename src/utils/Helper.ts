import { v4 as uuidv4 } from 'uuid';

import moment from 'moment-timezone';

export const generateCustomId = (prefix = '', length = 12) => {
  
  const id = uuidv4().replace(/-/g, ''); // Remove dashes to make it shorter
  return prefix + id.substring(0, length);
};

export const generateComplexId = (length = 12) => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Ensure at least one of each type
  let result = '';
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
  result = result.split('').sort(() => Math.random() - 0.5).join('');
  
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
  options: TimezoneConversionOptions = {}
): string => {
  const {
    inputFormat = 'YYYY-MM-DD HH:mm:ss',
    outputFormat = 'YYYY-MM-DD hh:mm:ss A',
    showTimezone = false,
    fallbackToUTC = true
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
        console.warn('Invalid datetime provided, falling back to UTC:', utcDateTime);
        return moment.utc().format(outputFormat) + (showTimezone ? ' UTC' : '');
      }
      throw new Error('Invalid datetime format');
    }

    // Convert to user's timezone
    const userTimezone = momentObj.local();
    
    // Format the result
    let formatted = userTimezone.format(outputFormat);
    
    if (showTimezone) {
      const timezoneAbbr = userTimezone.format('z');
      formatted += ` ${timezoneAbbr}`;
    }
    
    return formatted;
  } catch (error) {
    console.error('Error converting timezone:', error);
    if (fallbackToUTC) {
      return moment.utc().format(outputFormat) + (showTimezone ? ' UTC' : '');
    }
    return 'Invalid Date';
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
  timeFormat: string = 'hh:mm:ss A'
): string => {
  return convertUTCToUserTimezone(utcDateTime, {
    inputFormat: 'YYYY-MM-DD HH:mm:ss',
    outputFormat: timeFormat,
    showTimezone: false
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
  outputFormat: string = 'YYYY-MM-DD hh:mm:ss A'
): string => {
  try {
    // Clean up the time string to remove extra decimal places
    const cleanTime = time.split('.')[0]; // Remove microseconds
    
    // Combine date and time
    const utcDateTime = `${date} ${cleanTime}`;
    
    // Parse as UTC and convert to user's timezone
    const momentObj = moment(utcDateTime, 'YYYY-MM-DD HH:mm:ss').tz('Asia/Dubai');
    if (!momentObj.isValid()) {
      console.warn('Invalid datetime format:', { date, time, utcDateTime });
      return 'Invalid Date';
    }
    
    // Convert to user's timezone
    const userTimezone = momentObj.local();
    return userTimezone.format(outputFormat);
  } catch (error) {
    console.error('Error converting separate date/time:', error);
    return 'Invalid Date';
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
  timeFormat: string = 'hh:mm:ss A'
): string => {
  return convertDubaiDateTimeToUserTimezone(date, time, timeFormat);
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
  dateFormat: string = 'YYYY-MM-DD'
): string => {
  return convertDubaiDateTimeToUserTimezone(date, time, dateFormat);
};

/**
 * Convert UTC datetime to user's timezone with date formatting
 * @param utcDateTime - The UTC datetime string or Date object
 * @param dateFormat - Format for date display (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY')
 * @returns Formatted date string in user's timezone
 */
export const convertUTCDateToUserTimezone = (
  utcDateTime: string | Date,
  dateFormat: string = 'YYYY-MM-DD'
): string => {
  return convertUTCToUserTimezone(utcDateTime, {
    inputFormat: 'YYYY-MM-DD HH:mm:ss',
    outputFormat: dateFormat,
    showTimezone: false
  });
};

/**
 * Get user's current timezone information
 * @returns Object containing timezone details
 */
export const getUserTimezoneInfo = () => {
  const now = moment();
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    offset: now.format('Z'),
    offsetMinutes: now.utcOffset(),
    isDST: now.isDST(),
    abbreviation: now.format('z')
  };
};

/**
 * Format duration in seconds to human readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2h 30m 45s")
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds < 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
};

/**
 * Simple datetime conversion to local timezone with custom format
 * @param datetime - The datetime string (any format)
 * @param format - The output format (e.g., 'YYYY-MM-DD', 'MM/DD/YYYY', 'hh:mm:ss A', 'YYYY-MM-DD hh:mm:ss A')
 * @param inputFormat - Optional input format if you know the specific format of the input datetime
 * @returns Formatted datetime string in user's local timezone
 * 
 * @example
 * // Convert any datetime to local timezone
 * formatDateTimeToLocal('2024-01-15 14:30:00', 'YYYY-MM-DD hh:mm:ss A')
 * formatDateTimeToLocal('2024-01-15T14:30:00Z', 'MM/DD/YYYY hh:mm A')
 * formatDateTimeToLocal('2024-01-15 14:30:00', 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss')
 */
export const formatDateTimeToLocal = (
  datetime: string | Date,
  format: string = 'YYYY-MM-DD hh:mm:ss A',
  inputFormat?: string
): string => {
  try {
    let momentObj: moment.Moment;
    
    if (datetime instanceof Date) {
      momentObj = moment.utc(datetime);
    } else if (inputFormat) {
      // Parse with specific input format
      momentObj = moment.utc(datetime, inputFormat);
    } else {
      // Auto-detect format
      momentObj = moment.utc(datetime);
    }
    
    if (!momentObj.isValid()) {
      console.warn('Invalid datetime format:', datetime);
      return 'Invalid Date';
    }
    
    // Convert to user's local timezone and format
    return momentObj.local().format(format);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid Date';
  }
};

/**
 * Debug function to test timezone conversion with your specific data
 * @param date - The UTC date string (e.g., "2023-10-03")
 * @param time - The UTC time string (e.g., "00:27:03.0000000")
 * @returns Object with conversion details for debugging
 */
export const debugTimezoneConversion = (date: string, time: string) => {
  const cleanTime = time.split('.')[0];
  const utcDateTime = `${date} ${cleanTime}`;
  
  const utcMoment = moment.utc(utcDateTime, 'YYYY-MM-DD HH:mm:ss');
  const localMoment = utcMoment.local();
  
  return {
    input: { date, time, cleanTime, utcDateTime },
    utc: {
      formatted: utcMoment.format('YYYY-MM-DD HH:mm:ss'),
      timestamp: utcMoment.valueOf()
    },
    local: {
      formatted: localMoment.format('YYYY-MM-DD HH:mm:ss'),
      timeFormatted: localMoment.format('hh:mm:ss A'),
      dateFormatted: localMoment.format('YYYY-MM-DD'),
      timezone: localMoment.format('z'),
      offset: localMoment.format('Z')
    },
    isValid: utcMoment.isValid()
  };
};



export const GlobalDateFormat = 'DD-MM-YYYY';
export const GlobalTimeFormat = 'hh:mm:ss A';
export const GlobalDateTimeFormat = 'DD-MM-YYYY hh:mm:ss A';

export const ModuleSlug = {
  CALL_REPORTS: 'call-reports',
  CALL_LOGS: 'call-logs',
  CALL_RECORDINGS: 'call-recordings',
  TICKET:'tickets',
  CRM:'crm',
  REPORTS:'reports'
}
