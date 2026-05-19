export type MainDashboardRangePill = "daily" | "weekly" | "monthly";

export interface MainDashboardDateRange {
  start_date: string;
  end_date: string;
}

/** Format as YYYY-MM-DD for API query params. */
export function formatMainDashboardApiDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseMainDashboardApiDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Display as d/M/yyyy (matches existing chart date labels). */
export function formatMainDashboardDisplayDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function displayDateToApiDate(displayDate: string): string | null {
  const parts = displayDate.split("/");
  if (parts.length !== 3) return null;
  const [dayStr, monthStr, yearStr] = parts;
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = Number(yearStr);
  if (!day || !month || !year) return null;
  return formatMainDashboardApiDate(new Date(year, month - 1, day));
}

export function apiDateToDisplayDate(apiDate: string): string {
  const parsed = parseMainDashboardApiDate(apiDate);
  return parsed ? formatMainDashboardDisplayDate(parsed) : apiDate;
}

export function getMainDashboardDateRange(pill: MainDashboardRangePill): MainDashboardDateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);

  if (pill === "weekly") {
    start.setDate(start.getDate() - 6);
  } else if (pill === "monthly") {
    start.setDate(1);
  }

  return {
    start_date: formatMainDashboardApiDate(start),
    end_date: formatMainDashboardApiDate(end),
  };
}

/** Default CRM activity chart window: last 30 days through today. */
export function getDefaultCrmActivityDateRange(): MainDashboardDateRange {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 30);
  return {
    start_date: formatMainDashboardApiDate(start),
    end_date: formatMainDashboardApiDate(end),
  };
}
