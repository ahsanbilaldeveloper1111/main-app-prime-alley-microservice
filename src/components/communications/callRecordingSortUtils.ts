import type { CallRecordingRow } from "./callRecordingTypes";

const DOTNET_TICKS_PER_SECOND = 10_000_000;

function readStringField(row: CallRecordingRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

export function getCallRecordingDateTimeSortValue(row: CallRecordingRow): number {
  const raw = readStringField(
    row,
    "DateTime",
    "dateTime",
    "datetime",
    "UtcStartDateTime",
    "start_datetime",
  );
  if (!raw) return 0;

  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getCallRecordingDurationSortValue(row: CallRecordingRow): number {
  const raw = row.Duration ?? row.duration ?? row.DurationInSeconds;
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  if (Number.isNaN(parsed)) return 0;

  if (parsed >= DOTNET_TICKS_PER_SECOND) {
    return parsed / DOTNET_TICKS_PER_SECOND;
  }
  return parsed;
}

export function getCallRecordingRowSortValue(
  row: CallRecordingRow,
  columnKey: string,
): string | number {
  switch (columnKey) {
    case "DateTime":
    case "Time":
      return getCallRecordingDateTimeSortValue(row);
    case "Duration":
      return getCallRecordingDurationSortValue(row);
    case "AgentExtension":
      return readStringField(
        row,
        "AgentExtension",
        "agent_extension",
        "extension",
        "Extension",
      ).toLowerCase();
    case "Username":
      return readStringField(
        row,
        "Username",
        "username",
        "user_name",
        "agent_name",
      ).toLowerCase();
    case "Department":
      return readStringField(
        row,
        "Department",
        "department",
        "department_name",
        "DepartmentName",
      ).toLowerCase();
    case "RemotePartyNumber":
      return readStringField(
        row,
        "RemotePartyNumber",
        "remote_party_number",
        "phone_number",
        "PhoneNumber",
      ).toLowerCase();
    case "Direction":
      return readStringField(
        row,
        "Direction",
        "direction",
        "call_direction",
        "CallDirection",
      ).toLowerCase();
    default: {
      const value = row[columnKey];
      if (value === null || value === undefined) return "";
      if (typeof value === "number") return value;
      return String(value).toLowerCase();
    }
  }
}
