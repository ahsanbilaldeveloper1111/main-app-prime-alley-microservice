/**
 * Shared follow-up task due date/time for CRM activity modals (note, email, SMS, task).
 * UI / callbacks use local calendar date (YYYY-MM-DD) + local time (HH:mm).
 * API: `follow_up_task_due_date` is UTC calendar YYYY-MM-DD; `follow_up_task_due_time` is
 * UTC time as `HH:mm:ssZ` (ISO 8601 UTC “time” with Z). Values come from the same instant
 * as the user’s local date + time.
 */

export type FollowUpTaskFields = {
  createFollowUpTask: boolean;
  followUpTaskDueDate: string | null;
  followUpTaskDueTime: string | null;
};

/**
 * Resolves activity date dropdown values to YYYY-MM-DD.
 * Use `customYmd` when the picker value is "Custom...".
 * Accepts an already-selected calendar date (YYYY-MM-DD) from TaskModal-style saves.
 */
export function resolveFollowUpDueDateYmd(
  activityDateLabel: string,
  customYmd: string,
): string {
  const trimmed = activityDateLabel.trim();
  if (trimmed === "Custom...") {
    return customYmd.slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const base = `${y}-${m}-${d}`;
  if (trimmed === "Today") return base;
  const addDays = (n: number) => {
    const t = new Date(today);
    t.setDate(t.getDate() + n);
    return t.toISOString().slice(0, 10);
  };
  if (trimmed === "Tomorrow") return addDays(1);
  if (
    activityDateLabel.includes("3 business") ||
    activityDateLabel.includes("Friday") ||
    activityDateLabel.includes("Wednesday")
  )
    return addDays(3);
  if (trimmed === "In 1 week") return addDays(7);
  if (trimmed === "In 2 weeks") return addDays(14);
  if (trimmed === "In 1 month") return addDays(30);
  return addDays(3);
}

function normalizeFollowUpTimeHHmm(timeHHmm: string): string | null {
  if (typeof timeHHmm !== "string") return null;
  if (timeHHmm.length >= 5) return timeHHmm.slice(0, 5);
  if (timeHHmm.length > 0) return timeHHmm;
  return null;
}

export function buildFollowUpTaskFields(
  enabled: boolean,
  activityDatePicker: string,
  customYmd: string,
  timeHHmm: string,
): FollowUpTaskFields {
  const time = normalizeFollowUpTimeHHmm(timeHHmm);
  if (!enabled) {
    return {
      createFollowUpTask: false,
      followUpTaskDueDate: null,
      followUpTaskDueTime: null,
    };
  }
  const ymd = resolveFollowUpDueDateYmd(activityDatePicker, customYmd);
  return {
    createFollowUpTask: true,
    followUpTaskDueDate: ymd,
    followUpTaskDueTime: time,
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Interprets local YYYY-MM-DD + local HH:mm as one instant and returns UTC parts for the API.
 * `utcHm` is `HH:mm:ssZ` (explicit UTC / Zulu).
 */
export function localFollowUpYmdAndHmToUtcParts(
  ymdLocal: string,
  timeHHmmLocal: string | null,
): { utcYmd: string; utcHm: string } {
  const y = Number.parseInt(ymdLocal.slice(0, 4), 10);
  const m = Number.parseInt(ymdLocal.slice(5, 7), 10);
  const d = Number.parseInt(ymdLocal.slice(8, 10), 10);
  const t =
    typeof timeHHmmLocal === "string" && timeHHmmLocal.length >= 5
      ? timeHHmmLocal.slice(0, 5)
      : "00:00";
  const [hhStr, mmStr] = t.split(":");
  const hh = Number.parseInt(hhStr ?? "0", 10) || 0;
  const mm = Number.parseInt(mmStr ?? "0", 10) || 0;
  const localInstant = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (Number.isNaN(localInstant.getTime())) {
    return {
      utcYmd: ymdLocal.slice(0, 10),
      utcHm: `${t}:00Z`,
    };
  }
  const utcYmd = `${localInstant.getUTCFullYear()}-${pad2(localInstant.getUTCMonth() + 1)}-${pad2(localInstant.getUTCDate())}`;
  const utcHm = `${pad2(localInstant.getUTCHours())}:${pad2(localInstant.getUTCMinutes())}:${pad2(localInstant.getUTCSeconds())}Z`;
  return { utcYmd, utcHm };
}

/** Maps modal fields to communications / CRM API request keys (due date/time in explicit UTC form). */
export function followUpTaskFieldsToApiPayload(
  f: FollowUpTaskFields,
): {
  create_follow_up_task: boolean;
  follow_up_task_due_date: string | null;
  /** UTC time with Zulu suffix, e.g. `06:50:00Z`. */
  follow_up_task_due_time: string | null;
} {
  if (!f.createFollowUpTask) {
    return {
      create_follow_up_task: false,
      follow_up_task_due_date: null,
      follow_up_task_due_time: null,
    };
  }
  const ymd = f.followUpTaskDueDate?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    return {
      create_follow_up_task: true,
      follow_up_task_due_date: f.followUpTaskDueDate,
      follow_up_task_due_time: f.followUpTaskDueTime,
    };
  }
  const { utcYmd, utcHm } = localFollowUpYmdAndHmToUtcParts(
    ymd,
    f.followUpTaskDueTime,
  );
  return {
    create_follow_up_task: true,
    follow_up_task_due_date: utcYmd,
    follow_up_task_due_time: utcHm,
  };
}
