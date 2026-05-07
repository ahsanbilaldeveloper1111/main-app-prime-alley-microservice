import type { FilterPill } from "@components/GenericTable";

/** API row */
export interface CDRRecord {
  Id: number;
  DateTime: string;
  CallingNumber: string;
  CalledNumber: string;
  UserID: string;
  AllowLocalDNCLCalls: string;
  AllowApiDNCLCalls: string;
  AllowRepetitiveCalls: string;
  IndividualRepetitiveCallsAllowDaily: string;
  IndividualRepetitiveCallsAllowWeekly: string;
  CallRepFollowCompSettings: string;
  CompanyRepetitiveCallsAllowDaily: string;
  CompanyRepetitiveCallsAllowWeekly: string;
  LocalDNDStatus: string;
  CallRepetitionStatus: string;
  DNCRAPIStatus: string;
  TotalTimeTakenMs: number;
  CreatedDate: string;
}

export interface CDRResponse {
  statistics?: {
    this_month?: {
      total_calls: number;
      local_dnd: {
        allowed: number;
        blocked: number;
        not_checked: number;
      };
      call_repetition: {
        allowed: number;
        blocked: number;
        not_checked: number;
      };
      dncr_api: {
        allowed: number;
        blocked: number;
        not_checked: number;
        invalid: number;
        none: number;
        error: number;
      };
      performance: {
        avg_time_ms: number;
        min_time_ms: number;
        max_time_ms: number;
      };
    };
    [key: string]: unknown;
  };
  status: string;
  message: string;
  authenticated_user: string;
  metadata: {
    total_records: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
    timestamp: string;
  };
  data: CDRRecord[];
}

export type StatusChipTone = {
  color: string;
  backgroundColor: string;
};

export function getTriStateTone(
  value: string,
  positive: string,
  neutral: string,
): StatusChipTone {
  if (value === positive)
    return { color: "#0d8a5e", backgroundColor: "#d1f4e8" };
  if (value === neutral) return { color: "#6c757d", backgroundColor: "#e9ecef" };
  return { color: "#dc3545", backgroundColor: "#f8d7da" };
}

export function getDncrTone(value: string): StatusChipTone {
  if (value === "TRUE") return { color: "#dc3545", backgroundColor: "#f8d7da" };
  if (value === "FALSE") return { color: "#0d8a5e", backgroundColor: "#d1f4e8" };
  return { color: "#6c757d", backgroundColor: "#e9ecef" };
}

export const DNCR_API_STATUS_LABELS: Record<string, string> = {
  "": "DNCR API",
  TRUE: "🚫 TRUE (Blocked in DNCR)",
  FALSE: "✅ FALSE (Allowed by DNCR)",
  "Not Checked": "⏭️ Not Checked",
  INVALID: "⚠️ INVALID (Not Found)",
  NONE: "⚠️ NONE (Null Status)",
  NULL: "⚠️ NULL (Null Status)",
  UNKNOWN: "❌ UNKNOWN (Timeout/Error)",
  ERROR: "❌ ERROR (API Failed)",
  "%CACHE-BLOCKED": "🔄 Cache: Blocked",
  "%CACHE-ALLOWED": "🔄 Cache: Allowed",
  "%NOT-IN-CACHE": "🚫 Cache: Miss (Fail-closed)",
};

export const CDR_REPETITION_STATUS_CHOICES = [
  { label: "Allowed", value: "Allowed" },
  { label: "Blocked Daily", value: "Blocked - Daily" },
  { label: "Blocked Weekly", value: "Blocked - Weekly" },
  { label: "Blocked Both", value: "Blocked - Both" },
  { label: "Not Checked", value: "Not Checked" },
  {
    label: "Not Checked - Zero Limits",
    value: "Not Checked - Zero Limits",
  },
] as const;

export const CDR_LOCAL_DND_STATUS_CHOICES = [
  { label: "Allowed", value: "Allowed" },
  { label: "Blocked", value: "Blocked" },
  { label: "Not Checked", value: "Not Checked" },
] as const;

export type CdrFilterChoice = { label: string; value: string };

export function buildCdrFilterPillDropdownOptions(
  allRowLabel: string,
  choices: readonly CdrFilterChoice[],
  currentValue: string,
  setValue: (value: string) => void,
): NonNullable<FilterPill["dropdownOptions"]> {
  return [
    {
      label: allRowLabel,
      value: "__all__",
      selected: currentValue === "",
      onClick: () => setValue(""),
    },
    ...choices.map((c) => ({
      label: c.label,
      value: c.value,
      selected: currentValue === c.value,
      onClick: () => setValue(c.value),
    })),
  ];
}

/** UI row for GenericTable */
export interface MappedCDRRecord {
  id: string;
  dateTime: string;
  calling: string;
  called: string;
  userId: string;
  localDND: string;
  repetition: string;
  dncrApi: string;
  time: string;
  allowLocalDNCL: string;
  allowApiDNCLCalls: string;
  allowRepetition: string;
}

export interface AppliedFilters {
  search: string;
  calling_number: string;
  called_number: string;
  user_id: string;
  call_repetition_status: string;
  local_dnd_status: string;
  dncr_api_status: string;
  date_from: string;
  date_to: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Value for `<input type="datetime-local" />` in the user's local timezone. */
export function toDatetimeLocalInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Parse `YYYY-MM-DDTHH:mm` from datetime-local controls as local wall time. */
export function parseDatetimeLocalFilterValue(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const date = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    0,
    0,
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Human-readable label for datetime filter pills (not raw `YYYY-MM-DDTHH:mm`). */
export function formatCdrFilterDatetimeForDisplay(value: string): string {
  const parsed = parseDatetimeLocalFilterValue(value);
  if (!parsed) {
    return value.trim();
  }
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getCdrDefaultDateFromLocal(): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return toDatetimeLocalInputValue(start);
}

export function getCdrDefaultDateToLocal(): string {
  const end = new Date();
  end.setHours(23, 59, 0, 0);
  return toDatetimeLocalInputValue(end);
}

export function buildCdrQueryParams(
  currentPage: number,
  recordsPerPage: number,
  filters: AppliedFilters,
): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {
    page: currentPage,
    per_page: recordsPerPage,
    include_statistics: true,
  };

  if (filters.search) params.search = filters.search;
  if (filters.calling_number) params.calling_number = filters.calling_number;
  if (filters.called_number) params.called_number = filters.called_number;
  if (filters.user_id.trim()) params.user_id = filters.user_id.trim();
  if (filters.call_repetition_status)
    params.call_repetition_status = filters.call_repetition_status;
  if (filters.local_dnd_status) params.local_dnd_status = filters.local_dnd_status;
  if (filters.dncr_api_status) params.dncr_api_status = filters.dncr_api_status;
  params.date_from = filters.date_from.trim() || getCdrDefaultDateFromLocal();
  params.date_to = filters.date_to.trim() || getCdrDefaultDateToLocal();
  return params;
}

export interface CdrAggregatedStats {
  totalRecords: number;
  localDNDNotChecked: number;
  localDNDAllowed: number;
  localDNDBlocked: number;
  repetitionAllowed: number;
  repetitionNotAllowed: number;
  repetitionNotChecked: number;
  dncrApiFalse: number;
  dncrApiTrue: number;
  dncrApiNotChecked: number;
  dncrApiInvalid: number;
  dncrApiNone: number;
  dncrApiError: number;
  allowLocalDNCLTrue: number;
  allowLocalDNCLFalse: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  totalTime: number;
}

export function cdrEmptyAggregateStats(totalRecords: number): CdrAggregatedStats {
  return {
    totalRecords,
    localDNDNotChecked: 0,
    localDNDAllowed: 0,
    localDNDBlocked: 0,
    repetitionAllowed: 0,
    repetitionNotAllowed: 0,
    repetitionNotChecked: 0,
    dncrApiFalse: 0,
    dncrApiTrue: 0,
    dncrApiNotChecked: 0,
    dncrApiInvalid: 0,
    dncrApiNone: 0,
    dncrApiError: 0,
    allowLocalDNCLTrue: 0,
    allowLocalDNCLFalse: 0,
    avgTime: 0,
    minTime: 0,
    maxTime: 0,
    totalTime: 0,
  };
}

export function cdrAggregatedStatsFromThisMonth(
  tm: NonNullable<NonNullable<CDRResponse["statistics"]>["this_month"]>,
): CdrAggregatedStats {
  return {
    totalRecords: tm.total_calls || 0,
    localDNDNotChecked: tm.local_dnd?.not_checked || 0,
    localDNDAllowed: tm.local_dnd?.allowed || 0,
    localDNDBlocked: tm.local_dnd?.blocked || 0,
    repetitionAllowed: tm.call_repetition?.allowed || 0,
    repetitionNotAllowed: tm.call_repetition?.blocked || 0,
    repetitionNotChecked: tm.call_repetition?.not_checked || 0,
    dncrApiFalse: tm.dncr_api?.allowed || 0,
    dncrApiTrue: tm.dncr_api?.blocked || 0,
    dncrApiNotChecked: tm.dncr_api?.not_checked || 0,
    dncrApiInvalid: tm.dncr_api?.invalid || 0,
    dncrApiNone: tm.dncr_api?.none || 0,
    dncrApiError: tm.dncr_api?.error || 0,
    allowLocalDNCLTrue: 0,
    allowLocalDNCLFalse: 0,
    totalTime: 0,
    avgTime: tm.performance?.avg_time_ms || 0,
    minTime: tm.performance?.min_time_ms || 0,
    maxTime: tm.performance?.max_time_ms || 0,
  };
}

export function computeCdrAggregatedStats(
  statistics: CDRResponse["statistics"] | null,
  apiData: CDRRecord[],
  metadataTotalRecords: number,
): CdrAggregatedStats {
  const thisMonthStats = statistics?.this_month;
  if (thisMonthStats) {
    return cdrAggregatedStatsFromThisMonth(thisMonthStats);
  }
  if (!apiData || apiData.length === 0) {
    return cdrEmptyAggregateStats(metadataTotalRecords);
  }
  const stats = {
    ...cdrEmptyAggregateStats(metadataTotalRecords || apiData.length),
  };
  apiData.forEach((record) => {
    if (
      record.LocalDNDStatus?.toLowerCase().includes("not blocked") ||
      record.LocalDNDStatus?.toLowerCase().includes("allowed")
    ) {
      stats.localDNDAllowed++;
    } else if (record.LocalDNDStatus?.toLowerCase().includes("blocked")) {
      stats.localDNDBlocked++;
    } else {
      stats.localDNDNotChecked++;
    }
    if (record.CallRepetitionStatus?.toLowerCase().includes("allowed")) {
      stats.repetitionAllowed++;
    } else if (record.CallRepetitionStatus?.toLowerCase().includes("blocked")) {
      stats.repetitionNotAllowed++;
    } else {
      stats.repetitionNotChecked++;
    }
    if (record.DNCRAPIStatus === "Blocked") {
      stats.dncrApiTrue++;
    } else {
      stats.dncrApiFalse++;
    }
    if (record.AllowLocalDNCLCalls?.toLowerCase() === "true") {
      stats.allowLocalDNCLTrue++;
    } else {
      stats.allowLocalDNCLFalse++;
    }
    stats.totalTime += record.TotalTimeTakenMs || 0;
  });
  return {
    ...stats,
    avgTime: apiData.length > 0 ? stats.totalTime / apiData.length : 0,
    minTime: 0,
    maxTime: 0,
  };
}

export function createDefaultCdrAppliedFilters(): AppliedFilters {
  return {
    search: "",
    calling_number: "",
    called_number: "",
    user_id: "",
    call_repetition_status: "",
    local_dnd_status: "",
    dncr_api_status: "",
    date_from: getCdrDefaultDateFromLocal(),
    date_to: getCdrDefaultDateToLocal(),
  };
}

export function mapCdrRecordToUI(record: CDRRecord): MappedCDRRecord {
  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return date
        .toLocaleString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace(",", "");
    } catch {
      return dateTimeStr;
    }
  };

  const mapRepetitionStatus = (status: string) => {
    if (status?.toLowerCase().includes("allowed")) {
      return "Allowed";
    }
    if (
      status?.toLowerCase().includes("not allowed") ||
      status?.toLowerCase().includes("blocked")
    ) {
      return "Not Allowed";
    }
    return status || "Unknown";
  };

  return {
    id: String(record.Id),
    dateTime: formatDateTime(record.DateTime),
    calling: record.CallingNumber || "",
    called: record.CalledNumber || "",
    userId: record.UserID || "",
    localDND: record.LocalDNDStatus,
    repetition: mapRepetitionStatus(record.CallRepetitionStatus),

    dncrApi: record.DNCRAPIStatus,

    time: record.TotalTimeTakenMs?.toFixed(2) || "0",
    allowLocalDNCL: record.AllowLocalDNCLCalls,
    allowApiDNCLCalls: record.AllowApiDNCLCalls,
    allowRepetition: record.AllowRepetitiveCalls,
  };
}
