#!/usr/bin/env node

/**
 * Script to convert datetime with timezone offset to local timezone
 * 
 * Usage:
 *   node scripts/convert-datetime-to-local.js "2025-12-24 13:04:08 +04:00"
 *   node scripts/convert-datetime-to-local.js "2025-12-24 13:04:08 +04:00" "Asia/Karachi"
 * 
 * Or run without arguments to use the default example:
 *   node scripts/convert-datetime-to-local.js
 */

const moment = require("moment-timezone");

/**
 * Convert datetime string with timezone offset to specified timezone (default: Asia/Karachi)
 * @param {string} datetimeString - Datetime string in format "YYYY-MM-DD HH:mm:ss +HH:mm" (e.g., "2025-12-24 13:04:08 +04:00")
 * @param {string} targetTimezone - Target timezone (default: "Asia/Karachi")
 * @param {string} outputFormat - Optional output format (default: "YYYY-MM-DD hh:mm:ss A")
 * @returns {string} Formatted datetime string in target timezone
 */
function convertToLocalTimezone(datetimeString, targetTimezone = "Asia/Karachi", outputFormat = "YYYY-MM-DD hh:mm:ss A") {
  try {
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
      throw new Error(`Invalid datetime format: ${datetimeString}`);
    }
    
    // Convert to target timezone
    const targetMoment = momentObj.tz(targetTimezone);
    
    // Get system timezone for comparison
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Get timezone info
    const timezoneInfo = {
      original: {
        datetime: datetimeString,
        timezone: momentObj.format("z"),
        offset: momentObj.format("Z"),
      },
      converted: {
        datetime: targetMoment.format(outputFormat),
        timezone: targetMoment.format("z"),
        offset: targetMoment.format("Z"),
        timezoneName: targetTimezone,
      },
      system: {
        timezoneName: systemTimezone,
        note: systemTimezone !== targetTimezone ? `(System timezone is ${systemTimezone}, but converted to ${targetTimezone})` : "(Using system timezone)"
      }
    };
    
    return JSON.stringify(timezoneInfo, null, 2);
  } catch (error) {
    console.error("Error converting datetime:", error);
    return `Error: ${error.message || String(error)}`;
  }
}

// Main execution
function main() {
  // Get datetime from command line argument or use default
  const datetimeString = process.argv[2] || "2025-12-24 13:04:08 +04:00";
  // Get target timezone from command line argument or use default (Asia/Karachi)
  const targetTimezone = process.argv[3] || "Asia/Karachi";
  
  console.log("Converting datetime to target timezone...");
  console.log(`Input: ${datetimeString}`);
  console.log(`Target Timezone: ${targetTimezone}\n`);
  
  const result = convertToLocalTimezone(datetimeString, targetTimezone);
  console.log(result);
  
  // Also show a simple formatted version
  const simpleResult = convertToLocalTimezone(datetimeString, targetTimezone, "YYYY-MM-DD HH:mm:ss");
  const parsed = JSON.parse(simpleResult);
  console.log(`\nSimple format: ${parsed.converted.datetime} ${parsed.converted.timezone} (${parsed.converted.timezoneName})`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { convertToLocalTimezone };

