import type {
  CreateHolidayCalendarPayload,
  HolidayCalendar,
  HolidayCalendarHoliday,
} from "@utils/staffManagement";
import { formatDateForTable } from "@utils/Helper";

export type HolidayTenantOption = Readonly<{
  value: string;
  label: string;
}>;

export const HOLIDAY_CALENDAR_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
] as const;

export const HOLIDAY_CALENDAR_STATUS_FORM_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
] as const;

export type CreateHolidayCalendarFormState = Omit<
  CreateHolidayCalendarPayload,
  "tenant_id"
>;

export function createDefaultHolidayCalendarFormState(): CreateHolidayCalendarFormState {
  return {
    name: "",
    year: new Date().getFullYear(),
    status: "draft",
  };
}

export function validateCreateHolidayCalendarForm(
  form: CreateHolidayCalendarFormState,
  tenantId: string,
): string | null {
  if (!tenantId.trim()) {
    return "Select a tenant.";
  }
  if (!form.name.trim()) {
    return "Calendar name is required.";
  }
  if (!Number.isFinite(form.year) || form.year < 1900 || form.year > 9999) {
    return "Enter a valid year.";
  }
  if (!form.status.trim()) {
    return "Status is required.";
  }
  return null;
}

export function buildCreateHolidayCalendarPayload(
  tenantId: string,
  form: CreateHolidayCalendarFormState,
): CreateHolidayCalendarPayload {
  return {
    tenant_id: tenantId,
    year: form.year,
    name: form.name.trim(),
    status: form.status.trim(),
  };
}

export type HolidayDepartmentOption = Readonly<{
  value: string;
  label: string;
}>;

export const HOLIDAY_SCOPE_FORM_OPTIONS = [
  { value: "company", label: "Company-wide" },
  { value: "department", label: "Department" },
] as const;

export const HOLIDAY_HALF_DAY_FORM_OPTIONS = [
  { value: "", label: "Full day" },
  { value: "am", label: "Morning (AM)" },
  { value: "pm", label: "Afternoon (PM)" },
] as const;

export type HolidayScopeValue = (typeof HOLIDAY_SCOPE_FORM_OPTIONS)[number]["value"];
export type HolidayHalfDayFormValue = (typeof HOLIDAY_HALF_DAY_FORM_OPTIONS)[number]["value"];

export type CreateCalendarHolidayFormState = Readonly<{
  name: string;
  date: string;
  scope: HolidayScopeValue;
  department_id: string;
  half_day: HolidayHalfDayFormValue;
}>;

export function createDefaultCalendarHolidayFormState(): CreateCalendarHolidayFormState {
  return {
    name: "",
    date: "",
    scope: "company",
    department_id: "",
    half_day: "",
  };
}

function isValidHolidayDate(value: string): boolean {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const [year, month, day] = trimmed.split("-").map(Number);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() + 1 === month &&
    parsed.getDate() === day
  );
}

export function getCalendarHolidayDateBounds(
  calendarYear: number,
): Readonly<{ min: string; max: string }> {
  return {
    min: `${calendarYear}-01-01`,
    max: `${calendarYear}-12-31`,
  };
}

export function validateCreateCalendarHolidayForm(
  form: CreateCalendarHolidayFormState,
  options?: Readonly<{ calendarYear?: number | null }>,
): string | null {
  if (!form.name.trim()) {
    return "Holiday name is required.";
  }
  if (!form.date.trim()) {
    return "Holiday date is required.";
  }
  if (!isValidHolidayDate(form.date)) {
    return "Enter a valid date (YYYY-MM-DD).";
  }
  const calendarYear = options?.calendarYear;
  if (calendarYear == null || !Number.isFinite(calendarYear)) {
    return "Calendar year is not available.";
  }
  const dateYear = Number(form.date.trim().slice(0, 4));
  if (dateYear !== calendarYear) {
    return `Holiday date must fall within calendar year ${calendarYear}.`;
  }
  if (form.scope === "department") {
    const departmentId = Number(form.department_id);
    if (!form.department_id.trim() || !Number.isFinite(departmentId)) {
      return "Select a department for department-scoped holidays.";
    }
  }
  if (form.half_day && form.half_day !== "am" && form.half_day !== "pm") {
    return "Half day must be AM or PM.";
  }
  return null;
}

export function buildCreateCalendarHolidayPayload(form: CreateCalendarHolidayFormState) {
  const departmentId =
    form.scope === "department" ? Number(form.department_id) : null;

  return {
    name: form.name.trim(),
    date: form.date.trim(),
    scope: form.scope,
    department_id: Number.isFinite(departmentId) ? departmentId : null,
    half_day: form.half_day === "am" || form.half_day === "pm" ? form.half_day : null,
  };
}

export function normalizeHolidayDateKey(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return null;
  return trimmed.slice(0, 10);
}

export function readCalendarHolidayId(holiday: HolidayCalendarHoliday): number | null {
  const id = holiday.id;
  if (typeof id === "number" && Number.isFinite(id)) return id;
  return null;
}

export function calendarHolidayToFormState(
  holiday: HolidayCalendarHoliday,
): CreateCalendarHolidayFormState {
  const record = holiday as Record<string, unknown>;
  const scopeRaw = String(holiday.scope ?? record.scope ?? "company").trim().toLowerCase();
  const halfDayRaw = holiday.half_day ?? record.half_day;
  let half_day: HolidayHalfDayFormValue = "";
  if (halfDayRaw === "am" || halfDayRaw === "pm") {
    half_day = halfDayRaw;
  }

  const departmentId = holiday.department_id ?? record.department_id;
  return {
    name: String(holiday.name ?? "").trim(),
    date: normalizeHolidayDateKey(holiday.date) ?? "",
    scope: scopeRaw === "department" ? "department" : "company",
    department_id:
      departmentId != null && String(departmentId).trim() !== ""
        ? String(departmentId)
        : "",
    half_day,
  };
}

export function buildHolidaysByDateMap(
  holidays: readonly HolidayCalendarHoliday[],
): Map<string, HolidayCalendarHoliday[]> {
  const map = new Map<string, HolidayCalendarHoliday[]>();
  for (const holiday of holidays) {
    const dateKey = normalizeHolidayDateKey(holiday.date);
    if (!dateKey) continue;
    const existing = map.get(dateKey) ?? [];
    map.set(dateKey, [...existing, holiday]);
  }
  return map;
}

export function sortCalendarHolidaysByDate(
  holidays: readonly HolidayCalendarHoliday[],
): HolidayCalendarHoliday[] {
  return [...holidays].sort((left, right) => {
    const leftDate = normalizeHolidayDateKey(left.date) ?? "";
    const rightDate = normalizeHolidayDateKey(right.date) ?? "";
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
    return String(left.name ?? "").localeCompare(String(right.name ?? ""));
  });
}

export function formatHolidayScopeLabel(
  holiday: HolidayCalendarHoliday,
  departmentOptions: readonly HolidayDepartmentOption[],
): string {
  const record = holiday as Record<string, unknown>;
  const scope = String(holiday.scope ?? record.scope ?? "company").trim().toLowerCase();
  if (scope !== "department") return "Company-wide";
  const departmentId = holiday.department_id ?? record.department_id;
  const departmentLabel = departmentOptions.find(
    (option) => option.value === String(departmentId ?? ""),
  )?.label;
  return departmentLabel ? `Department: ${departmentLabel}` : "Department";
}

export function formatHolidayHalfDayLabel(holiday: HolidayCalendarHoliday): string {
  const record = holiday as Record<string, unknown>;
  const halfDay = holiday.half_day ?? record.half_day;
  if (halfDay === "am") return "Morning (AM)";
  if (halfDay === "pm") return "Afternoon (PM)";
  return "Full day";
}

export const HOLIDAY_MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const HOLIDAY_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function buildHolidayMonthMatrix(
  year: number,
  month: number,
): ReadonlyArray<ReadonlyArray<Date | null>> {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
  const cells: Array<Date | null> = [];

  for (let index = 0; index < mondayBasedOffset; index += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: Array<Array<Date | null>> = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function formatIsoDateFromLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildHolidayYearFilterOptions(
  centerYear = new Date().getFullYear(),
  span = 5,
): ReadonlyArray<{ value: string; label: string }> {
  const startYear = centerYear - Math.floor(span / 2);
  const years = Array.from({ length: span }, (_, index) => startYear + index);
  return [
    { value: "", label: "All years" },
    ...years.map((year) => ({ value: String(year), label: String(year) })),
  ];
}

export const HOLIDAY_LIST_DEFAULT_LIMIT = 25;

export const HOLIDAY_LIST_PAGE_SIZE_OPTIONS = [15, 25, 50, 100] as const;

export function formatHolidayCalendarLabel(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "—";
  if (trimmed !== trimmed.toUpperCase()) return trimmed;
  return trimmed
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function isHolidayCalendarDraft(
  calendar: Pick<HolidayCalendar, "status">,
): boolean {
  return (calendar.status ?? "").trim().toLowerCase() === "draft";
}

export function formatHolidayCalendarDateValue(
  value: string | null | undefined,
): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "—";
  const formatted = formatDateForTable(trimmed);
  return formatted || trimmed;
}

function coerceHolidayCalendarYear(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function readHolidayCalendarYear(calendar: HolidayCalendar): number | null {
  const record = calendar as Record<string, unknown>;
  return (
    coerceHolidayCalendarYear(calendar.year) ??
    coerceHolidayCalendarYear(record.calendar_year) ??
    coerceHolidayCalendarYear(record.calendarYear)
  );
}

export function formatHolidayCalendarYear(value: unknown): string {
  const year = coerceHolidayCalendarYear(value);
  if (year == null) return "—";
  return String(year);
}

export function formatHolidayCalendarHolidaysCount(
  holidays: HolidayCalendar["holidays"],
): string {
  if (!Array.isArray(holidays)) return "—";
  return String(holidays.length);
}

export function formatHolidayCalendarDefaultFlag(
  value: boolean | null | undefined,
): string {
  if (value == null) return "—";
  return value ? "Yes" : "No";
}

export function resolveHolidayCalendarTenantId(
  calendar: HolidayCalendar,
  fallback: string,
): string {
  const candidate = calendar.tenant_id ?? calendar.tenantId;
  if (typeof candidate === "string" && candidate.trim()) {
    return candidate.trim();
  }
  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return String(candidate);
  }
  return fallback;
}

export function filterHolidayCalendarsBySearch(
  rows: HolidayCalendar[],
  searchValue: string,
): HolidayCalendar[] {
  const query = searchValue.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) => {
    const haystack = [
      row.name,
      row.description,
      row.status,
      row.country_code,
      readHolidayCalendarYear(row),
      formatHolidayCalendarLabel(row.status),
      formatHolidayCalendarHolidaysCount(row.holidays),
    ]
      .map((part) => String(part ?? "").toLowerCase())
      .join(" ");
    return haystack.includes(query);
  });
}

export const HOLIDAY_CALENDAR_API_FIELD_KEYS = [
  "name",
  "year",
  "status",
  "holidays",
  "country_code",
  "is_default",
  "description",
] as const;

export type HolidayCalendarApiFieldKey = (typeof HOLIDAY_CALENDAR_API_FIELD_KEYS)[number];

export type HolidayCalendarTableColumnKey = HolidayCalendarApiFieldKey | "tenant_id";

const HOLIDAY_TABLE_ALWAYS_VISIBLE_COLUMNS: readonly HolidayCalendarTableColumnKey[] = [
  "name",
  "year",
  "status",
  "holidays",
];

export function holidayCalendarFieldHasDisplayValue(
  calendar: HolidayCalendar,
  field: HolidayCalendarTableColumnKey,
): boolean {
  switch (field) {
    case "name":
      return Boolean(calendar.name?.trim());
    case "year":
      return readHolidayCalendarYear(calendar) != null;
    case "status":
      return Boolean(calendar.status?.trim());
    case "holidays":
      return Array.isArray(calendar.holidays);
    case "country_code":
      return Boolean(calendar.country_code?.trim());
    case "is_default":
      return calendar.is_default != null;
    case "description":
      return Boolean(calendar.description?.trim());
    case "tenant_id":
      return Boolean(resolveHolidayCalendarTenantId(calendar, ""));
    default:
      return false;
  }
}

export function resolveVisibleHolidayCalendarTableColumns(
  rows: readonly HolidayCalendar[],
  options?: Readonly<{ includeTenant?: boolean }>,
): HolidayCalendarTableColumnKey[] {
  const columns: HolidayCalendarTableColumnKey[] = [
    ...HOLIDAY_TABLE_ALWAYS_VISIBLE_COLUMNS,
  ];

  for (const field of ["country_code", "is_default", "description"] as const) {
    if (rows.some((row) => holidayCalendarFieldHasDisplayValue(row, field))) {
      columns.push(field);
    }
  }

  if (options?.includeTenant && rows.some((row) => holidayCalendarFieldHasDisplayValue(row, "tenant_id"))) {
    columns.push("tenant_id");
  }

  return columns;
}
