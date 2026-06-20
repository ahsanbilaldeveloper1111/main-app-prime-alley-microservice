import type { CallRecordingRow } from "./callRecordingTypes";

const DOTNET_TICKS_PER_SECOND = 10_000_000;

function readScalarAsString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return undefined;
}

function readStringField(row: CallRecordingRow, ...keys: string[]): string {
  for (const key of keys) {
    const text = readScalarAsString(row[key]);
    if (text) return text;
  }
  return "";
}

function readDurationSortNumber(row: CallRecordingRow): number {
  const raw = row.Duration ?? row.duration ?? row.DurationInSeconds;
  const text = readScalarAsString(raw);
  if (text === undefined) return 0;

  const parsed = Number.parseInt(text, 10);
  if (Number.isNaN(parsed)) return 0;

  if (parsed >= DOTNET_TICKS_PER_SECOND) {
    return parsed / DOTNET_TICKS_PER_SECOND;
  }
  return parsed;
}

function readDefaultColumnSortValue(
  row: CallRecordingRow,
  columnKey: string,
): string | number {
  const value = row[columnKey];
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  const text = readScalarAsString(value);
  return text ? text.toLowerCase() : "";
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
  return readDurationSortNumber(row);
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
    default:
      return readDefaultColumnSortValue(row, columnKey);
  }
}
