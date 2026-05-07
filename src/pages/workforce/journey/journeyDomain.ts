import type { Dispatch, SetStateAction } from "react";
import type { MainAppDepartmentLookup, MainAppUserLookup } from "@hooks/useMainAppLookups";
import { Trash2 } from "lucide-react";
import { JOURNEY_STATUS_OPTIONS } from "@utils/workforce/journeyStatusOptions";
import { hierarchyLabel } from "../employees/employeesDomain";

export interface OnboardingEmployee {
  id: string;
  name: string;
  avatar: string;
  startDate: string;
  stages: string[];
  progress: number;
  status: "In Progress" | "On Track" | "Completed";
  role?: string;
  department?: string;
  user_id?: string;
  department_name?: string;
  designation?: string;
  total_steps_count?: string | number;
  completed_steps_count?: string | number;
  contract_type?: string;
  employment_type?: string;
}

/** API journey item shape */
export interface JourneyRecord {
  id?: number;
  user_profile_id?: string | number;
  user_id?: string | number;
  job_title?: string;
  department_name?: string;
  start_date?: string;
  status?: string;
  total_steps_count?: string | number;
  completed_steps_count?: string | number;
  steps?: { name?: string; [key: string]: unknown }[];
  user_profile?: {
    id?: number;
    user_id?: string;
    job_title?: string;
    designation?: string;
    contract_type?: string;
    employment_type?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface JourneyStepRecord {
  id?: number;
  journey_id?: string | number;
  stage?: string;
  title?: string;
  description?: string;
  status?: string;
  sort_order?: string | number;
  due_date?: string | null;
  completed_at?: string | null;
  [key: string]: unknown;
}

export interface JourneysPagination {
  total?: number;
  limit?: number;
  page?: number;
  last_page?: number;
  from?: number;
  to?: number;
}

export const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance", "Temporary"];
export const CONTRACT_TYPES = ["Permanent", "Temporary", "Freelance", "Fixed-term", "Probation"];
export const ITEMS_PER_PAGE = 15;

export const STATUS_DISPLAY: Record<string, OnboardingEmployee["status"]> = {
  in_progress: "In Progress",
  on_track: "On Track",
  completed: "Completed",
};

export function statusDisplayToApiValue(display: string): string {
  const map: Record<string, string> = {
    "In Progress": "in_progress",
    "On Track": "on_track",
    Completed: "completed",
  };
  return map[display] ?? "in_progress";
}

export function isEmployeeJourneyDisplayCompleted(status: string): boolean {
  return status.trim().toLowerCase() === "completed";
}

export function formatJourneyStepStatusForDisplay(status: string): string {
  return status
    .split("_")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

export function isJourneyStepRecordCompleted(step: JourneyStepRecord): boolean {
  const at = step.completed_at;
  if (at != null && String(at).trim() !== "") {
    return true;
  }
  const st = String(step.status ?? "")
    .trim()
    .toLowerCase();
  return st === "completed";
}

export function deriveJourneyProgressFromSteps(steps: JourneyStepRecord[]): {
  total: number;
  completed: number;
  progress: number;
} {
  const total = steps.length;
  const completed = steps.filter(isJourneyStepRecordCompleted).length;
  const progress = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  return { total, completed, progress };
}

export function journeyStartDateToInputMin(iso: string | null | undefined): string | undefined {
  if (iso == null || String(iso).trim() === "") return undefined;
  const trimmed = String(iso).trim();
  if (Number.isNaN(Date.parse(trimmed))) return undefined;
  const parsed = new Date(trimmed);
  const y = parsed.getUTCFullYear();
  const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const d = String(parsed.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function readJourneyStartDateFromPayload(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const startDate = (data as { start_date?: unknown }).start_date;
  return typeof startDate === "string" && startDate.trim() !== "" ? startDate.trim() : null;
}

export function clampDueDateToJourneyMin(due: string, min: string | undefined): string {
  if (min == null || min === "") return due;
  return due < min ? min : due;
}

export function toInputDate(value: string | null | undefined): string {
  if (value == null || value.trim() === "") return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDueDateForDisplay(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export function journeyUsersPillLabel(selectedCount: number, appliedCount: number): string | undefined {
  if (selectedCount > 0) return `${selectedCount} selected`;
  if (appliedCount > 0) return `${appliedCount} selected`;
  return undefined;
}

export function getDepartmentFilterLabel(departments: MainAppDepartmentLookup[], departmentId: string): string {
  if (departmentId === "") return "";
  const department = departments.find((dept) => String(dept.id) === departmentId);
  if (department == null) return departmentId;
  return hierarchyLabel(department);
}

export function getJourneyStatusLabel(status: string): string {
  if (status === "") return "";
  const option = JOURNEY_STATUS_OPTIONS.find((o: { value: string; label: string }) => o.value === status);
  return option?.label ?? status;
}

export function pickActiveLabel(
  selectedValue: string,
  appliedValue: string,
  selectedLabel: string,
  appliedLabel: string,
): string | undefined {
  if (selectedValue) return selectedLabel;
  if (appliedValue) return appliedLabel;
  return undefined;
}

export function reconcileSelectedEmployeeProgress(params: {
  previousEmployee: OnboardingEmployee | null;
  journeyId: number;
  journeySteps: JourneyStepRecord[];
}): OnboardingEmployee | null {
  const prev = params.previousEmployee;
  if (!prev || Number(prev.id) !== params.journeyId) return prev;
  const { total, completed, progress } = deriveJourneyProgressFromSteps(params.journeySteps);
  if (
    Number(prev.total_steps_count ?? 0) === total &&
    Number(prev.completed_steps_count ?? 0) === completed &&
    prev.progress === progress
  ) {
    return prev;
  }
  return {
    ...prev,
    total_steps_count: total,
    completed_steps_count: completed,
    progress,
  };
}

export function toggleSelectedJourneyUserIds(previousIds: string[], idStr: string, isSelected: boolean): string[] {
  if (isSelected) return previousIds.filter((id) => id !== idStr);
  return [...previousIds, idStr];
}

export function filterJourneyManagers(managers: MainAppUserLookup[], userSearchTerm: string): MainAppUserLookup[] {
  const needle = userSearchTerm.trim().toLowerCase();
  if (!needle) return managers;
  return managers.filter((mgr) => hierarchyLabel(mgr).toLowerCase().includes(needle));
}

export function hasAppliedJourneyFilters(params: {
  appliedSearch: string;
  appliedDepartment: string;
  appliedEmploymentType: string;
  appliedContract: string;
  appliedStatus: string;
  appliedUserIds: string[];
}): boolean {
  return Boolean(
    params.appliedSearch.trim() ||
      params.appliedDepartment ||
      params.appliedEmploymentType ||
      params.appliedContract ||
      params.appliedStatus ||
      params.appliedUserIds.length > 0,
  );
}

export function getJourneySidebarQuickActions(params: {
  canDeleteJourneyRecord: boolean;
  deletingJourney: boolean;
  setShowDeleteJourneyModal: Dispatch<SetStateAction<boolean>>;
}): Array<{
  id: string;
  label: string;
  icon: typeof Trash2;
  onClick: () => void;
  disabled: boolean;
}> | undefined {
  if (!params.canDeleteJourneyRecord) return undefined;
  return [
    {
      id: "delete-journey",
      label: "Delete",
      icon: Trash2,
      onClick: () => params.setShowDeleteJourneyModal(true),
      disabled: params.deletingJourney,
    },
  ];
}

export const getStatusColor = (status: OnboardingEmployee["status"]) => {
  switch (status) {
    case "In Progress":
      return { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" };
    case "On Track":
      return { bg: "#fef3c7", color: "#92400e", dot: "#fbbf24" };
    case "Completed":
      return { bg: "#ecfdf5", color: "#065f46", dot: "#10b981" };
  }
};

export function mapJourneyRecordsToEmployees(data: JourneyRecord[], users: MainAppUserLookup[]): OnboardingEmployee[] {
  return data.map((j) => {
    const rawUserId = j.user_id ?? j.user_profile?.user_id;
    const userId = rawUserId == null ? "" : String(rawUserId).trim();
    const resolvedName =
      users.find((u) => String(u.phone ?? "").trim() === userId || String(u.id) === userId)?.name ??
      (userId || "—");
    const statusKey = (j.status ?? "in_progress").toLowerCase().replaceAll(/\s/g, "_");
    const status: OnboardingEmployee["status"] = STATUS_DISPLAY[statusKey] ?? "In Progress";
    const totalSteps = Math.max(1, Number(j.total_steps_count ?? 0));
    const completedSteps = Number(j.completed_steps_count ?? 0);
    const progress = Math.min(100, Math.round((completedSteps / totalSteps) * 100));
    const steps = Array.isArray(j.steps) ? j.steps : [];
    const stepNames = steps.length
      ? steps.map((s) => (s.name ?? "document").toLowerCase())
      : ["document", "profile"];
    const startDateFormatted = j.start_date
      ? new Date(j.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "—";
    const profile = j.user_profile;
    const contractRaw = profile?.contract_type;
    const employmentRaw = profile?.employment_type;
    const designationRaw = profile?.designation;
    const designation =
      designationRaw != null && String(designationRaw).trim() !== ""
        ? String(designationRaw).trim()
        : undefined;
    return {
      id: String(j.id ?? j.user_profile_id ?? (userId || "unknown")),
      name: String(resolvedName),
      avatar: "",
      startDate: startDateFormatted,
      stages: stepNames,
      progress,
      status,
      role: j.job_title ?? profile?.job_title ?? undefined,
      department: j.department_name ?? undefined,
      user_id: userId || undefined,
      department_name: j.department_name ?? undefined,
      designation,
      total_steps_count: j.total_steps_count,
      completed_steps_count: j.completed_steps_count,
      contract_type:
        contractRaw != null && String(contractRaw).trim() !== "" ? String(contractRaw).trim() : undefined,
      employment_type:
        employmentRaw != null && String(employmentRaw).trim() !== "" ? String(employmentRaw).trim() : undefined,
    };
  });
}

export interface JourneyListAppliedFilters {
  appliedSearch: string;
  appliedDepartment: string;
  appliedEmploymentType: string;
  appliedContract: string;
  appliedUserIds: string[];
  appliedStatus: string;
}

export function serializeJourneyListFiltersKey(filters: JourneyListAppliedFilters): string {
  return JSON.stringify({
    search: filters.appliedSearch,
    department: filters.appliedDepartment,
    employmentType: filters.appliedEmploymentType,
    contract: filters.appliedContract,
    userIds: [...filters.appliedUserIds].sort(),
    status: filters.appliedStatus,
  });
}

export function buildGetJourneysRequestParams(
  page: number,
  limit: number,
  filters: JourneyListAppliedFilters,
): {
  page: number;
  limit: number;
  search?: string;
  employment_type?: string;
  contract_type?: string;
  user_ids?: string[];
  department_id?: number;
  status?: string;
} {
  const params: {
    page: number;
    limit: number;
    search?: string;
    employment_type?: string;
    contract_type?: string;
    user_ids?: string[];
    department_id?: number;
    status?: string;
  } = { page, limit };
  if (filters.appliedSearch?.trim()) params.search = filters.appliedSearch.trim();
  if (filters.appliedDepartment?.trim()) {
    const deptId = Number(filters.appliedDepartment.trim());
    if (!Number.isNaN(deptId)) params.department_id = deptId;
  }
  if (filters.appliedEmploymentType?.trim()) params.employment_type = filters.appliedEmploymentType.trim();
  if (filters.appliedContract?.trim()) params.contract_type = filters.appliedContract.trim();
  if (filters.appliedUserIds.length > 0) params.user_ids = filters.appliedUserIds;
  if (filters.appliedStatus?.trim()) params.status = filters.appliedStatus.trim().toLowerCase().replaceAll(/\s/g, "_");
  return params;
}
