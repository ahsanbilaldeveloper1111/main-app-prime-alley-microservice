import type { CallLogRow } from "./callLogTypes";

function readStringField(row: CallLogRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

export function getCallLogDateTimeSortValue(row: CallLogRow): number {
  const date = readStringField(row, "Date", "date", "UtcStartDateTime");
  const time = readStringField(row, "Time", "time", "StartTime", "start_time");

  if (date.includes("T")) {
    const isoParsed = Date.parse(date);
    if (!Number.isNaN(isoParsed)) return isoParsed;
  }

  if (!date) return 0;

  const parsed = Date.parse(`${date}T${time || "00:00:00"}`);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getCallLogDurationSortValue(row: CallLogRow): number {
  const raw = row.duration ?? row.Duration ?? row.DurationInSeconds;
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getCallLogAnsweredSortValue(row: CallLogRow): number {
  const raw = row.is_answered ?? row.IsAnswered;
  if (raw === true || raw === "Yes" || raw === "yes" || raw === 1 || raw === "1") {
    return 1;
  }
  if (raw === false || raw === "No" || raw === "no" || raw === 0 || raw === "0") {
    return 0;
  }
  return -1;
}

export function getCallLogRowSortValue(
  row: CallLogRow,
  columnKey: string,
): string | number {
  switch (columnKey) {
    case "Date":
    case "Time":
      return getCallLogDateTimeSortValue(row);
    case "duration":
      return getCallLogDurationSortValue(row);
    case "is_answered":
      return getCallLogAnsweredSortValue(row);
    case "username":
      return readStringField(row, "username", "Username", "user_name", "agent_name").toLowerCase();
    case "department_name":
      return readStringField(
        row,
        "department_name",
        "Department",
        "DepartmentName",
        "department",
      ).toLowerCase();
    case "call_type":
      return readStringField(row, "call_type", "CallType", "callType").toLowerCase();
    case "extension":
      return readStringField(row, "extension", "Extension", "AgentExtension").toLowerCase();
    case "phone_number":
      return readStringField(
        row,
        "phone_number",
        "PhoneNumber",
        "phone",
        "number",
      ).toLowerCase();
    default: {
      const value = row[columnKey];
      if (value === null || value === undefined) return "";
      if (typeof value === "number") return value;
      return String(value).toLowerCase();
    }
  }
}
