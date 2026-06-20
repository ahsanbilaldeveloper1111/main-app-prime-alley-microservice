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

/** Map alternate API field names and split combined UTC datetimes when Date/Time are missing */
export function normalizeCallLogRow(
  row: CallLogRow & Record<string, unknown>,
): CallLogRow {
  const next: CallLogRow = { ...row };

  if (!next.Date) {
    next.Date = (row.Date as string) ?? (row.date as string) ?? next.Date;
  }
  if (!next.Time) {
    next.Time =
      (row.Time as string) ??
      (row.time as string) ??
      (row.StartTime as string) ??
      (row.start_time as string) ??
      next.Time;
  }
  if (!next.username) {
    next.username =
      (row.user_name as string) ??
      (row.agent_name as string) ??
      (row.Username as string) ??
      next.username;
  }
  if (!next.department_name) {
    next.department_name =
      (row.Department as string) ??
      (row.DepartmentName as string) ??
      (row.department as string) ??
      next.department_name;
  }
  if (!next.call_type) {
    next.call_type =
      (row.CallType as string) ??
      (row.callType as string) ??
      next.call_type;
  }
  if (!next.extension) {
    next.extension =
      (row.Extension as string) ??
      (row.AgentExtension as string) ??
      next.extension;
  }
  if (next.duration === undefined || next.duration === null || next.duration === "") {
    const durationCandidate = row.duration ?? row.Duration ?? row.DurationInSeconds;
    if (durationCandidate !== undefined && durationCandidate !== null) {
      next.duration = durationCandidate as string | number;
    }
  }
  if (!next.phone_number) {
    next.phone_number =
      (row.phone as string) ??
      (row.number as string) ??
      (row.PhoneNumber as string) ??
      next.phone_number;
  }
  if (next.is_answered === undefined || next.is_answered === null || next.is_answered === "") {
    const answeredCandidate = row.is_answered ?? row.IsAnswered;
    if (typeof answeredCandidate === "boolean") {
      next.is_answered = answeredCandidate ? "Yes" : "No";
    } else if (answeredCandidate !== undefined && answeredCandidate !== null) {
      next.is_answered = String(answeredCandidate);
    }
  } else if (typeof next.is_answered === "boolean") {
    next.is_answered = next.is_answered ? "Yes" : "No";
  }

  if (next.Date && next.Time) return next;

  const isoCandidate =
    (row.call_datetime as string) ??
    (row.start_time as string) ??
    (row.call_date_time as string) ??
    (row.datetime as string) ??
    (row.created_at as string) ??
    (row.UtcStartDateTime as string);
  if (typeof isoCandidate === "string" && isoCandidate.includes("T")) {
    const m = moment.utc(isoCandidate);
    if (m.isValid()) {
      next.Date = m.format("YYYY-MM-DD");
      next.Time = m.format("HH:mm:ss");
    }
  }
  return next;
}
