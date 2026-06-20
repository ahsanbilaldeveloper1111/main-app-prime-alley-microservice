import moment from "moment";
import type { CallLogRow } from "./callLogTypes";

export function extractCallLogRows(response: any): CallLogRow[] {
  const rawData = response?.data;
  if (Array.isArray(rawData)) return rawData;
  if (Array.isArray(rawData?.data)) return rawData.data;
  if (Array.isArray(rawData?.rows)) return rawData.rows;
  if (Array.isArray(response?.dataList)) return response.dataList;
  if (Array.isArray(response?.rows)) return response.rows;
  return [];
}

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

function readRowString(
  row: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = readScalarAsString(row[key]);
    if (value !== undefined) return value;
  }
  return undefined;
}

function assignStringFieldIfMissing(
  target: CallLogRow,
  field: keyof CallLogRow,
  row: Record<string, unknown>,
  sourceKeys: string[],
): void {
  if (target[field]) return;
  const value = readRowString(row, ...sourceKeys);
  if (value !== undefined) {
    target[field] = value;
  }
}

const CALL_LOG_STRING_FIELD_MAPPINGS: ReadonlyArray<{
  field: keyof CallLogRow;
  sourceKeys: string[];
}> = [
  { field: "Date", sourceKeys: ["Date", "date"] },
  { field: "Time", sourceKeys: ["Time", "time", "StartTime", "start_time"] },
  {
    field: "username",
    sourceKeys: ["user_name", "agent_name", "Username"],
  },
  {
    field: "department_name",
    sourceKeys: ["Department", "DepartmentName", "department"],
  },
  { field: "call_type", sourceKeys: ["CallType", "callType"] },
  { field: "extension", sourceKeys: ["Extension", "AgentExtension"] },
  { field: "phone_number", sourceKeys: ["phone", "number", "PhoneNumber"] },
];

function applyCallLogStringFieldMappings(
  target: CallLogRow,
  row: Record<string, unknown>,
): void {
  for (const { field, sourceKeys } of CALL_LOG_STRING_FIELD_MAPPINGS) {
    assignStringFieldIfMissing(target, field, row, sourceKeys);
  }
}

function normalizeDurationValue(
  row: Record<string, unknown>,
  current: CallLogRow["duration"],
): CallLogRow["duration"] | undefined {
  if (current !== undefined && current !== null && current !== "") {
    return current;
  }

  const candidate = row.duration ?? row.Duration ?? row.DurationInSeconds;
  if (candidate === undefined || candidate === null) {
    return undefined;
  }
  if (typeof candidate === "number" || typeof candidate === "string") {
    return candidate;
  }
  return undefined;
}

function answeredValueToLabel(value: unknown): string | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return readScalarAsString(value);
}

function normalizeAnsweredField(
  row: Record<string, unknown>,
  current: CallLogRow["is_answered"],
): string | undefined {
  if (current !== undefined && current !== null && current !== "") {
    return answeredValueToLabel(current) ?? current;
  }
  return answeredValueToLabel(row.is_answered ?? row.IsAnswered);
}

function applyIsoDateTimeFallback(
  target: CallLogRow,
  row: Record<string, unknown>,
): void {
  if (target.Date && target.Time) return;

  const isoCandidate = readRowString(
    row,
    "call_datetime",
    "start_time",
    "call_date_time",
    "datetime",
    "created_at",
    "UtcStartDateTime",
  );
  if (!isoCandidate?.includes("T")) return;

  const parsed = moment.utc(isoCandidate);
  if (!parsed.isValid()) return;

  target.Date = parsed.format("YYYY-MM-DD");
  target.Time = parsed.format("HH:mm:ss");
}

/** Map alternate API field names and split combined UTC datetimes when Date/Time are missing */
export function normalizeCallLogRow(
  row: CallLogRow & Record<string, unknown>,
): CallLogRow {
  const next: CallLogRow = { ...row };

  applyCallLogStringFieldMappings(next, row);

  const duration = normalizeDurationValue(row, next.duration);
  if (duration !== undefined) {
    next.duration = duration;
  }

  const answered = normalizeAnsweredField(row, next.is_answered);
  if (answered !== undefined) {
    next.is_answered = answered;
  }

  applyIsoDateTimeFallback(next, row);
  return next;
}
