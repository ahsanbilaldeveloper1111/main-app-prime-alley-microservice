import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useState, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, {
  FilterPill,
  TableAction,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import {
  createJourneyStep,
  deleteJourney,
  deleteJourneyStep,
  getJourney,
  getJourneys,
  updateJourney,
  updateJourneyStep,
} from "@utils/staffManagement";
import { useMainAppLookups, type MainAppDepartmentLookup } from "@hooks/useMainAppLookups";
import { Briefcase, Check, ChevronRight, Pencil, Plus, Target, Trash2, User } from "lucide-react";
import GenericSidebar, { SidebarSection } from "@components/GenericSidebarNew";
import { JOURNEY_STATUS_OPTIONS } from "@utils/workforce/journeyStatusOptions";
import { toast } from "react-toastify";
import { Form, Modal } from "react-bootstrap";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { getAvatarColor, getInitials } from "@utils/workforceUserAvatar";

const { PERMISSIONS } = HEADER_CONSTANTS;

interface OnboardingEmployee {
  id: string;
  name: string;
  avatar: string;
  startDate: string;
  stages: string[];
  progress: number;
  status: "In Progress" | "On Track" | "Completed";
  role?: string;
  department?: string;
  /** Phone extension / user id from API (table column "Extension") */
  user_id?: string;
  /** Mirrors API `department_name` for table columns */
  department_name?: string;
  /** From API `user_profile.designation` */
  designation?: string;
  total_steps_count?: string | number;
  completed_steps_count?: string | number;
  /** From API `user_profile.contract_type` */
  contract_type?: string;
  /** From API `user_profile.employment_type` */
  employment_type?: string;
}

type LookupUser = {
  id: string | number;
  name?: string | null;
  phone?: string | null;
} & Record<string, unknown>;


/** API journey item shape (matches API response) */
interface JourneyRecord {
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

interface JourneyStepRecord {
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

/** API pagination shape */
interface JourneysPagination {
  total?: number;
  limit?: number;
  page?: number;
  last_page?: number;
  from?: number;
  to?: number;
}

const STATUS_DISPLAY: Record<string, "In Progress" | "On Track" | "Completed"> = {
  in_progress: "In Progress",
  on_track: "On Track",
  completed: "Completed",
};

function statusDisplayToApiValue(display: string): string {
  const map: Record<string, string> = {
    "In Progress": "in_progress",
    "On Track": "on_track",
    Completed: "completed",
  };
  return map[display] ?? "in_progress";
}

function isEmployeeJourneyDisplayCompleted(status: string): boolean {
  return status.trim().toLowerCase() === "completed";
}

function formatJourneyStepStatusForDisplay(status: string): string {
  return status
    .split("_")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

/** Step is complete when API set completed_at or status is completed (matches journey detail payload). */
function isJourneyStepRecordCompleted(step: JourneyStepRecord): boolean {
  const at = step.completed_at;
  if (at != null && String(at).trim() !== "") {
    return true;
  }
  const st = String(step.status ?? "")
    .trim()
    .toLowerCase();
  return st === "completed";
}

/** Progress bar + counts from live journey steps (detail API), not stale list aggregates. */
function deriveJourneyProgressFromSteps(steps: JourneyStepRecord[]): {
  total: number;
  completed: number;
  progress: number;
} {
  const total = steps.length;
  const completed = steps.filter(isJourneyStepRecordCompleted).length;
  const progress =
    total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));
  return { total, completed, progress };
}

function journeyStartDateToInputMin(iso: string | null | undefined): string | undefined {
  if (iso == null || String(iso).trim() === "") return undefined;
  const trimmed = String(iso).trim();
  if (Number.isNaN(Date.parse(trimmed))) return undefined;
  const parsed = new Date(trimmed);
  const y = parsed.getUTCFullYear();
  const m = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const d = String(parsed.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function readJourneyStartDateFromPayload(data: unknown): string | null {
  if (data == null || typeof data !== "object") return null;
  const startDate = (data as { start_date?: unknown }).start_date;
  return typeof startDate === "string" && startDate.trim() !== "" ? startDate.trim() : null;
}

function clampDueDateToJourneyMin(due: string, min: string | undefined): string {
  if (min == null || min === "") return due;
  return due < min ? min : due;
}

function toInputDate(value: string | null | undefined): string {
  if (value == null || value.trim() === "") return new Date().toISOString().slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().slice(0, 10);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDueDateForDisplay(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance", "Temporary"];
const CONTRACT_TYPES = ["Permanent", "Temporary", "Freelance", "Fixed-term", "Probation"];

const ITEMS_PER_PAGE = 15;

function journeyUsersPillLabel(selectedCount: number, appliedCount: number): string | undefined {
  if (selectedCount > 0) return `${selectedCount} selected`;
  if (appliedCount > 0) return `${appliedCount} selected`;
  return undefined;
}

function getDepartmentFilterLabel(
  departments: MainAppDepartmentLookup[],
  departmentId: string,
): string {
  if (departmentId === "") return "";
  const department = departments.find(
    (dept: MainAppDepartmentLookup) => String(dept.id) === departmentId,
  );
  if (department == null) return departmentId;
  return hierarchyLabel(department);
}

function getJourneyStatusLabel(status: string): string {
  if (status === "") return "";
  const option = JOURNEY_STATUS_OPTIONS.find(
    (o: { value: string; label: string }) => o.value === status,
  );
  return option?.label ?? status;
}

function pickActiveLabel(
  selectedValue: string,
  appliedValue: string,
  selectedLabel: string,
  appliedLabel: string,
): string | undefined {
  if (selectedValue) return selectedLabel;
  if (appliedValue) return appliedLabel;
  return undefined;
}

function reconcileSelectedEmployeeProgress(params: {
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

function toggleSelectedJourneyUserIds(
  previousIds: string[],
  idStr: string,
  isSelected: boolean,
): string[] {
  if (isSelected) return previousIds.filter((id) => id !== idStr);
  return [...previousIds, idStr];
}

function filterJourneyManagers(managers: LookupUser[], userSearchTerm: string): LookupUser[] {
  const needle = userSearchTerm.trim().toLowerCase();
  if (!needle) return managers;
  return managers.filter((mgr) => hierarchyLabel(mgr).toLowerCase().includes(needle));
}

async function applyJourneyStatusChange(params: {
  journeyId: number;
  nextStatus: string;
  setStatusValue: React.Dispatch<React.SetStateAction<string>>;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<OnboardingEmployee | null>>;
  setRefreshJourneysKey: React.Dispatch<React.SetStateAction<number>>;
}): Promise<void> {
  await updateJourney(params.journeyId, { status: params.nextStatus });
  params.setStatusValue(params.nextStatus);
  params.setSelectedEmployee((prev) => {
    if (!prev) return prev;
    const displayStatus = STATUS_DISPLAY[params.nextStatus] ?? prev.status;
    return { ...prev, status: displayStatus };
  });
  toast.success("Status updated.");
  params.setRefreshJourneysKey((k) => k + 1);
}

async function deleteJourneyAndRefresh(params: {
  journeyId: number;
  setShowDeleteJourneyModal: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<OnboardingEmployee | null>>;
  setRefreshJourneysKey: React.Dispatch<React.SetStateAction<number>>;
}): Promise<void> {
  await deleteJourney(params.journeyId);
  toast.success("Journey deleted.");
  params.setShowDeleteJourneyModal(false);
  params.setIsSidebarOpen(false);
  params.setSelectedEmployee(null);
  params.setRefreshJourneysKey((k) => k + 1);
}

async function deleteJourneyStepAndRefresh(params: {
  journeyId: number;
  stepId: number;
  refreshSteps: () => Promise<void>;
  closeDeleteStepModal: () => void;
  setRefreshJourneysKey: React.Dispatch<React.SetStateAction<number>>;
}): Promise<void> {
  await deleteJourneyStep(params.journeyId, params.stepId);
  toast.success("Step deleted.");
  await params.refreshSteps();
  params.closeDeleteStepModal();
  params.setRefreshJourneysKey((k) => k + 1);
}

async function handleJourneyStatusSelect(params: {
  nextStatus: string;
  canUpdateJourneyRecord: boolean;
  isJourneyCompleted: boolean;
  journeyId: number;
  setStatusUpdating: React.Dispatch<React.SetStateAction<boolean>>;
  setStatusValue: React.Dispatch<React.SetStateAction<string>>;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<OnboardingEmployee | null>>;
  setRefreshJourneysKey: React.Dispatch<React.SetStateAction<number>>;
}): Promise<void> {
  if (!params.canUpdateJourneyRecord || params.isJourneyCompleted) return;
  params.setStatusUpdating(true);
  try {
    await applyJourneyStatusChange({
      journeyId: params.journeyId,
      nextStatus: params.nextStatus,
      setStatusValue: params.setStatusValue,
      setSelectedEmployee: params.setSelectedEmployee,
      setRefreshJourneysKey: params.setRefreshJourneysKey,
    });
  } catch (error: unknown) {
    console.error("[WorkforceJourney] updateJourney failed", error);
  } finally {
    params.setStatusUpdating(false);
  }
}

async function handleJourneyStepDeleteConfirm(params: {
  stepPendingDelete: JourneyStepRecord | null;
  canDeleteJourneyStepPerm: boolean;
  journeyId: number;
  refreshSteps: () => Promise<void>;
  closeDeleteStepModal: () => void;
  setRefreshJourneysKey: React.Dispatch<React.SetStateAction<number>>;
  setDeletingStepId: React.Dispatch<React.SetStateAction<number | null>>;
}): Promise<void> {
  const step = params.stepPendingDelete;
  if (!params.canDeleteJourneyStepPerm || step?.id == null) {
    params.closeDeleteStepModal();
    return;
  }
  params.setDeletingStepId(step.id);
  try {
    await deleteJourneyStepAndRefresh({
      journeyId: params.journeyId,
      stepId: step.id,
      refreshSteps: params.refreshSteps,
      closeDeleteStepModal: params.closeDeleteStepModal,
      setRefreshJourneysKey: params.setRefreshJourneysKey,
    });
  } catch (error: unknown) {
    console.error("[WorkforceJourney] deleteJourneyStep failed", error);
  } finally {
    params.setDeletingStepId(null);
  }
}

async function handleJourneyDelete(params: {
  canDeleteJourneyRecord: boolean;
  journeyId: number;
  setDeletingJourney: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDeleteJourneyModal: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedEmployee: React.Dispatch<React.SetStateAction<OnboardingEmployee | null>>;
  setRefreshJourneysKey: React.Dispatch<React.SetStateAction<number>>;
}): Promise<void> {
  if (!params.canDeleteJourneyRecord) return;
  params.setDeletingJourney(true);
  try {
    await deleteJourneyAndRefresh({
      journeyId: params.journeyId,
      setShowDeleteJourneyModal: params.setShowDeleteJourneyModal,
      setIsSidebarOpen: params.setIsSidebarOpen,
      setSelectedEmployee: params.setSelectedEmployee,
      setRefreshJourneysKey: params.setRefreshJourneysKey,
    });
  } catch (error: unknown) {
    console.error("[WorkforceJourney] deleteJourney failed", error);
  } finally {
    params.setDeletingJourney(false);
  }
}

function hierarchyLabel(item: unknown): string {
  if (item == null) return "—";
  if (typeof item === "string") return item;
  if (typeof item === "object" && item !== null) {
    const o = item as { name?: string; id?: string | number; [key: string]: unknown };
    return String(o.name ?? o.id ?? "—");
  }
  if (typeof item === "number" || typeof item === "boolean" || typeof item === "bigint") return String(item);
  if (typeof item === "symbol") return item.description ?? "—";
  if (typeof item === "function") return item.name || "—";
  return "—";
}

const getStatusColor = (status: OnboardingEmployee["status"]) => {
  switch (status) {
    case "In Progress":
      return { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" };
    case "On Track":
      return { bg: "#fef3c7", color: "#92400e", dot: "#fbbf24" };
    case "Completed":
      return { bg: "#ecfdf5", color: "#065f46", dot: "#10b981" };
  }
};

function mapJourneyRecordsToEmployees(data: JourneyRecord[], users: LookupUser[]): OnboardingEmployee[] {
  return data.map((j) => {
    const rawUserId = j.user_id ?? j.user_profile?.user_id;
    const userId = rawUserId == null ? "" : String(rawUserId).trim();
    const name =
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
      name,
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

type BuildJourneySidebarSectionsParams = {
  selectedEmployee: OnboardingEmployee | null;
  journeyIdValid: boolean;
  stepsLoading: boolean;
  journeySteps: JourneyStepRecord[];
  canUpdateJourneyRecord: boolean;
  canCreateJourneyStep: boolean;
  canUpdateJourneyStep: boolean;
  canDeleteJourneyStepPerm: boolean;
  deletingStepId: number | null;
  statusValue: string;
  statusUpdating: boolean;
  isJourneyCompleted: boolean;
  handleStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => Promise<void>;
  setShowAddStepForm: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingStep: React.Dispatch<React.SetStateAction<JourneyStepRecord | null>>;
  openDeleteStepModal: (step: JourneyStepRecord) => void;
};

function buildJourneySidebarSections({
  selectedEmployee,
  journeyIdValid,
  stepsLoading,
  journeySteps,
  canUpdateJourneyRecord,
  canCreateJourneyStep,
  canUpdateJourneyStep,
  canDeleteJourneyStepPerm,
  deletingStepId,
  statusValue,
  statusUpdating,
  isJourneyCompleted,
  handleStatusChange,
  setShowAddStepForm,
  setEditingStep,
  openDeleteStepModal,
}: Readonly<BuildJourneySidebarSectionsParams>): SidebarSection[] {
  if (!selectedEmployee) return [];

  const useLiveStepsProgress = journeyIdValid && !stepsLoading;
  const liveProgress = useLiveStepsProgress
    ? deriveJourneyProgressFromSteps(journeySteps)
    : null;
  const totalSteps = liveProgress
    ? liveProgress.total
    : Math.max(1, Number(selectedEmployee.total_steps_count ?? 0));
  const completedSteps = liveProgress
    ? liveProgress.completed
    : Number(selectedEmployee.completed_steps_count ?? 0);
  const progressPercent = liveProgress ? liveProgress.progress : selectedEmployee.progress;
  const statusColors = getStatusColor(selectedEmployee.status);

  return [
    {
      id: "journey-employee-details",
      title: "Employee Details",
      icon: User,
      collapsible: true,
      defaultExpanded: true,
      fields: [
        { label: "Extension", value: selectedEmployee.user_id || "—" },
        { label: "Department", value: selectedEmployee.department_name || "—" },
        { label: "Designation", value: selectedEmployee.designation || "—" },
        { label: "Start Date", value: selectedEmployee.startDate || "—" },
        { label: "Role", value: selectedEmployee.role || "—" },
      ],
    },
    {
      id: "journey-employment-info",
      title: "Employment Info",
      icon: Briefcase,
      collapsible: true,
      defaultExpanded: true,
      fields: [
        { label: "Contract Type", value: selectedEmployee.contract_type || "—" },
        { label: "Employment Type", value: selectedEmployee.employment_type || "—" },
      ],
    },
    {
      id: "journey-onboarding-progress",
      title: "Onboarding Progress",
      icon: Target,
      collapsible: true,
      defaultExpanded: true,
      customContent: (
        <div style={{ padding: "0 4px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <span style={{ fontSize: "13px", color: "#6b7280" }}>
              {completedSteps} of {totalSteps} steps completed
            </span>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>
              {progressPercent}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#e9d5ff",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                backgroundColor: "#8b5cf6",
                borderRadius: "4px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              backgroundColor: statusColors.bg,
              borderRadius: "16px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: statusColors.dot,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "13px", fontWeight: "500", color: statusColors.color }}>
              {selectedEmployee.status}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "journey-status",
      title: "Status",
      icon: Target,
      collapsible: true,
      defaultExpanded: true,
      customContent: (
        <div style={{ padding: "0 4px" }}>
          <label
            htmlFor="journey-sidebar-status"
            style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}
          >
            Journey Status
          </label>
          <select
            id="journey-sidebar-status"
            className="form-select"
            value={statusValue}
            onChange={handleStatusChange}
            disabled={statusUpdating || isJourneyCompleted || !canUpdateJourneyRecord}
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: "14px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: isJourneyCompleted ? "#f9fafb" : "white",
              color: "#1f2937",
              cursor: statusUpdating || isJourneyCompleted ? "not-allowed" : "pointer",
            }}
          >
            {JOURNEY_STATUS_OPTIONS.map((opt: { value: string; label: string }) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {statusUpdating && (
            <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>Updating...</div>
          )}
        </div>
      ),
    },
    {
      id: "journey-steps",
      title: "Steps",
      icon: Check,
      collapsible: true,
      defaultExpanded: true,
      customContent: (
        <JourneyStepsSidebarSection
          steps={journeySteps}
          loading={stepsLoading}
          isCompleted={isJourneyCompleted}
          canAddStep={canCreateJourneyStep}
          canEditStep={canUpdateJourneyStep}
          canDeleteStep={canDeleteJourneyStepPerm}
          deletingStepId={deletingStepId}
          onAddStep={() => setShowAddStepForm(true)}
          onEditStep={(step) => setEditingStep(step)}
          onDeleteStep={openDeleteStepModal}
        />
      ),
    },
  ];
}

type BuildJourneyFilterPillsParams = {
  selectedEmploymentType: string;
  appliedEmploymentType: string;
  setSelectedEmploymentType: React.Dispatch<React.SetStateAction<string>>;
  setAppliedEmploymentType: React.Dispatch<React.SetStateAction<string>>;
  selectedContract: string;
  appliedContract: string;
  setSelectedContract: React.Dispatch<React.SetStateAction<string>>;
  setAppliedContract: React.Dispatch<React.SetStateAction<string>>;
  selectedDepartment: string;
  appliedDepartment: string;
  departmentPillActiveLabel: string | undefined;
  setSelectedDepartment: React.Dispatch<React.SetStateAction<string>>;
  setAppliedDepartment: React.Dispatch<React.SetStateAction<string>>;
  selectedUserIds: string[];
  appliedUserIds: string[];
  setSelectedUserIds: React.Dispatch<React.SetStateAction<string[]>>;
  setAppliedUserIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedStatus: string;
  appliedStatus: string;
  statusPillActiveLabel: string | undefined;
  setSelectedStatus: React.Dispatch<React.SetStateAction<string>>;
  setAppliedStatus: React.Dispatch<React.SetStateAction<string>>;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  employmentFilterOptions: {
    label: string;
    value: string;
    onClick: () => void;
  }[];
  contractFilterOptions: {
    label: string;
    value: string;
    onClick: () => void;
  }[];
  departmentFilterOptions: {
    label: string;
    value: string;
    onClick: () => void;
  }[];
  statusFilterOptions: {
    label: string;
    value: string;
    onClick: () => void;
  }[];
  usersDropdownContent: React.ReactNode;
};

function buildJourneyFilterPills(params: Readonly<BuildJourneyFilterPillsParams>) {
  const {
    selectedEmploymentType,
    appliedEmploymentType,
    setSelectedEmploymentType,
    setAppliedEmploymentType,
    selectedContract,
    appliedContract,
    setSelectedContract,
    setAppliedContract,
    selectedDepartment,
    appliedDepartment,
    departmentPillActiveLabel,
    setSelectedDepartment,
    setAppliedDepartment,
    selectedUserIds,
    appliedUserIds,
    setSelectedUserIds,
    setAppliedUserIds,
    selectedStatus,
    appliedStatus,
    statusPillActiveLabel,
    setSelectedStatus,
    setAppliedStatus,
    setCurrentPage,
    employmentFilterOptions,
    contractFilterOptions,
    departmentFilterOptions,
    statusFilterOptions,
    usersDropdownContent,
  } = params;

  return [
    {
      id: "journey-employment",
      label: "Employment",
      showDropdown: true,
      searchable: true,
      dropdownSelectedValue: selectedEmploymentType || "__all__",
      active: Boolean(selectedEmploymentType || appliedEmploymentType),
      activeLabel: selectedEmploymentType || appliedEmploymentType || undefined,
      onClear:
        selectedEmploymentType || appliedEmploymentType
          ? () => {
              setSelectedEmploymentType("");
              setAppliedEmploymentType("");
              setCurrentPage(1);
            }
          : undefined,
      dropdownOptions: employmentFilterOptions,
    },
    {
      id: "journey-contract",
      label: "Contract",
      showDropdown: true,
      searchable: true,
      dropdownSelectedValue: selectedContract || "__all__",
      active: Boolean(selectedContract || appliedContract),
      activeLabel: selectedContract || appliedContract || undefined,
      onClear:
        selectedContract || appliedContract
          ? () => {
              setSelectedContract("");
              setAppliedContract("");
              setCurrentPage(1);
            }
          : undefined,
      dropdownOptions: contractFilterOptions,
    },
    {
      id: "journey-department",
      label: "Department",
      showDropdown: true,
      searchable: true,
      dropdownSelectedValue: selectedDepartment || "__all__",
      active: Boolean(selectedDepartment || appliedDepartment),
      activeLabel: departmentPillActiveLabel,
      onClear:
        selectedDepartment || appliedDepartment
          ? () => {
              setSelectedDepartment("");
              setAppliedDepartment("");
              setCurrentPage(1);
            }
          : undefined,
      dropdownOptions: departmentFilterOptions,
    },
    {
      id: "journey-users",
      label: "Users",
      showDropdown: true,
      active: selectedUserIds.length > 0 || appliedUserIds.length > 0,
      activeLabel: journeyUsersPillLabel(selectedUserIds.length, appliedUserIds.length),
      onClear:
        selectedUserIds.length > 0 || appliedUserIds.length > 0
          ? () => {
              setSelectedUserIds([]);
              setAppliedUserIds([]);
              setCurrentPage(1);
            }
          : undefined,
      dropdownContent: usersDropdownContent,
    },
    {
      id: "journey-status",
      label: "Status",
      showDropdown: true,
      searchable: true,
      dropdownSelectedValue: selectedStatus || "__all__",
      active: Boolean(selectedStatus || appliedStatus),
      activeLabel: statusPillActiveLabel,
      onClear:
        selectedStatus || appliedStatus
          ? () => {
              setSelectedStatus("");
              setAppliedStatus("");
              setCurrentPage(1);
            }
          : undefined,
      dropdownOptions: statusFilterOptions,
    },
  ] as FilterPill[];
}

function hasAppliedJourneyFilters(params: {
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

function getJourneySidebarQuickActions(params: {
  canDeleteJourneyRecord: boolean;
  deletingJourney: boolean;
  setShowDeleteJourneyModal: React.Dispatch<React.SetStateAction<boolean>>;
}) {
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

type JourneyStepsSidebarSectionProps = {
  steps: JourneyStepRecord[];
  loading: boolean;
  isCompleted: boolean;
  canAddStep: boolean;
  canEditStep: boolean;
  canDeleteStep: boolean;
  deletingStepId: number | null;
  onAddStep: () => void;
  onEditStep: (step: JourneyStepRecord) => void;
  onDeleteStep: (step: JourneyStepRecord) => void;
};

function JourneyStepsSidebarSection({
  steps,
  loading,
  isCompleted,
  canAddStep,
  canEditStep,
  canDeleteStep,
  deletingStepId,
  onAddStep,
  onEditStep,
  onDeleteStep,
}: Readonly<JourneyStepsSidebarSectionProps>) {
  return (
    <div style={{ padding: "0 4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>Journey Steps</span>
        {!isCompleted && canAddStep && (
          <button
            type="button"
            onClick={onAddStep}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              backgroundColor: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            Add step
          </button>
        )}
      </div>

      {loading && <div style={{ fontSize: "13px", color: "#6b7280" }}>Loading steps...</div>}
      {!loading && steps.length === 0 && (
        <div style={{ fontSize: "13px", color: "#6b7280" }}>No steps yet.</div>
      )}
      {!loading && steps.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {steps.map((step) => {
            const fallbackKey = `${step.title ?? "untitled"}-${step.stage ?? "nostage"}-${step.due_date ?? "nodue"}`;
            return (
              <li
                key={step.id == null ? fallbackKey : `journey-step-${step.id}`}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>
                      {step.title || "—"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>
                      {step.stage ? <span style={{ marginRight: "8px" }}>{step.stage}</span> : null}
                      {step.status ? (
                        <span style={{ padding: "2px 6px", backgroundColor: "#e5e7eb", borderRadius: "4px" }}>
                          {formatJourneyStepStatusForDisplay(step.status)}
                        </span>
                      ) : null}
                    </div>
                    {step.description && <div style={{ fontSize: "13px", color: "#4b5563" }}>{step.description}</div>}
                    {step.due_date && (
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                        Due: {formatDueDateForDisplay(step.due_date)}
                      </div>
                    )}
                  </div>
                  {!isCompleted && (canEditStep || canDeleteStep) ? (
                    <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                      {canEditStep ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditStep(step);
                        }}
                        title="Edit"
                        style={{
                          padding: "6px",
                          border: "none",
                          borderRadius: "6px",
                          backgroundColor: "#e0e7ff",
                          color: "#4338ca",
                          cursor: "pointer",
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      ) : null}
                      {canDeleteStep ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStep(step);
                        }}
                        disabled={deletingStepId === step.id}
                        title="Delete"
                        style={{
                          padding: "6px",
                          border: "none",
                          borderRadius: "6px",
                          backgroundColor: "#fee2e2",
                          color: "#b91c1c",
                          cursor: deletingStepId === step.id ? "not-allowed" : "pointer",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hook: useWorkforceJourneysList
// ---------------------------------------------------------------------------
type JourneysListParams = {
  companyIdentifier: string | null | undefined;
  currentPage: number;
  rowsPerPage: number;
  refreshKey: number;
  appliedSearch: string;
  appliedDepartment: string;
  appliedEmploymentType: string;
  appliedContract: string;
  appliedUserIds: string[];
  appliedStatus: string;
};

function useWorkforceJourneysList({
  companyIdentifier,
  currentPage,
  rowsPerPage,
  refreshKey,
  appliedSearch,
  appliedDepartment,
  appliedEmploymentType,
  appliedContract,
  appliedUserIds,
  appliedStatus,
}: Readonly<JourneysListParams>) {
  const [journeysData, setJourneysData] = useState<JourneyRecord[]>([]);
  const [journeysPagination, setJourneysPagination] = useState<JourneysPagination | null>(null);
  const [loadingJourneys, setLoadingJourneys] = useState(true);

  useEffect(() => {
    if (!companyIdentifier) {
      setLoadingJourneys(false);
      return;
    }
    const fetchJourneys = async () => {
      setLoadingJourneys(true);
      try {
        const params: {
          page: number;
          limit: number;
          search?: string;
          employment_type?: string;
          contract_type?: string;
          user_ids?: string[];
          department_id?: number;
          status?: string;
        } = { page: currentPage, limit: rowsPerPage };
        if (appliedSearch?.trim()) params.search = appliedSearch.trim();
        if (appliedDepartment?.trim()) {
          const deptId = Number(appliedDepartment.trim());
          if (!Number.isNaN(deptId)) params.department_id = deptId;
        }
        if (appliedEmploymentType?.trim()) params.employment_type = appliedEmploymentType.trim();
        if (appliedContract?.trim()) params.contract_type = appliedContract.trim();
        if (appliedUserIds.length > 0) params.user_ids = appliedUserIds;
        if (appliedStatus?.trim()) params.status = appliedStatus.trim().toLowerCase().replaceAll(/\s/g, "_");
        const journeysResult = await getJourneys(params);
        const data = Array.isArray(journeysResult?.data) ? (journeysResult.data as JourneyRecord[]) : [];
        setJourneysData(data);
        setJourneysPagination((journeysResult?.pagination as JourneysPagination) ?? null);
      } catch (e) {
        console.error("[Onboarding] fetch journeys error:", e);
        setJourneysData([]);
        setJourneysPagination(null);
      } finally {
        setLoadingJourneys(false);
      }
    };
    fetchJourneys();
  }, [
    companyIdentifier,
    currentPage,
    rowsPerPage,
    refreshKey,
    appliedSearch,
    appliedDepartment,
    appliedEmploymentType,
    appliedContract,
    appliedUserIds,
    appliedStatus,
  ]);

  return { journeysData, journeysPagination, loadingJourneys };
}

// ---------------------------------------------------------------------------
// Hook: useSelectedJourneyDetail
// ---------------------------------------------------------------------------
function useSelectedJourneyDetail(journeyId: number, loadDetailEnabled: boolean) {
  const [journeySteps, setJourneySteps] = useState<JourneyStepRecord[]>([]);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [journeyStartDateIso, setJourneyStartDateIso] = useState<string | null>(null);

  useEffect(() => {
    if (!loadDetailEnabled) {
      setJourneySteps([]);
      setJourneyStartDateIso(null);
      return;
    }
    let cancelled = false;
    setStepsLoading(true);
    setJourneyStartDateIso(null);
    getJourney(journeyId)
      .then((data: unknown) => {
        if (cancelled) return;
        const raw = data as { steps?: JourneyStepRecord[]; start_date?: string };
        setJourneySteps(Array.isArray(raw?.steps) ? raw.steps : []);
        setJourneyStartDateIso(readJourneyStartDateFromPayload(raw));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[WorkforceJourney] getJourney failed", error);
        setJourneySteps([]);
        setJourneyStartDateIso(null);
      })
      .finally(() => {
        if (!cancelled) setStepsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [journeyId, loadDetailEnabled]);

  const refreshSteps = useCallback(async () => {
    const data = (await getJourney(journeyId)) as { steps?: JourneyStepRecord[]; start_date?: string };
    setJourneySteps(Array.isArray(data?.steps) ? data.steps : []);
    setJourneyStartDateIso(readJourneyStartDateFromPayload(data));
  }, [journeyId]);

  return { journeySteps, stepsLoading, journeyStartDateIso, refreshSteps };
}

// ---------------------------------------------------------------------------
// Component: AddJourneyStepModal
// ---------------------------------------------------------------------------
type AddJourneyStepModalProps = {
  show: boolean;
  journeyId: number;
  journeyDueDateMin: string | undefined;
  stepCount: number;
  onHide: () => void;
  onStepAdded: () => void;
  onRefreshJourneys: () => void;
};

function AddJourneyStepModal({
  show,
  journeyId,
  journeyDueDateMin,
  stepCount,
  onHide,
  onStepAdded,
  onRefreshJourneys,
}: Readonly<AddJourneyStepModalProps>) {
  const [form, setForm] = useState({
    stage: "",
    title: "",
    description: "",
    due_date: new Date().toISOString().slice(0, 10),
    status: "pending",
    sort_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!show || journeyDueDateMin == null) return;
    setForm((prev) => (prev.due_date < journeyDueDateMin ? { ...prev, due_date: journeyDueDateMin } : prev));
  }, [show, journeyDueDateMin]);

  useEffect(() => {
    if (show) {
      setForm((prev) => ({
        ...prev,
        sort_order: stepCount,
        due_date: clampDueDateToJourneyMin(prev.due_date, journeyDueDateMin),
      }));
    }
  }, [show, stepCount, journeyDueDateMin]);

  const handleSubmit = async () => {
    if (form.title.trim() === "") {
      toast.error("Task is required");
      return;
    }
    if (journeyDueDateMin != null && form.due_date !== "" && form.due_date < journeyDueDateMin) {
      toast.error("Due date cannot be before the journey start date.");
      return;
    }
    setSubmitting(true);
    try {
      await createJourneyStep(journeyId, {
        stage: form.stage,
        title: form.title,
        description: form.description,
        due_date: form.due_date,
        status: form.status,
        sort_order: form.sort_order,
      });
      toast.success("Step added.");
      onHide();
      setForm({
        stage: "",
        title: "",
        description: "",
        due_date: clampDueDateToJourneyMin(new Date().toISOString().slice(0, 10), journeyDueDateMin),
        status: "pending",
        sort_order: stepCount,
      });
      onStepAdded();
      onRefreshJourneys();
    } catch (error: unknown) {
      console.error("[WorkforceJourney] createJourneyStep failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered style={{ zIndex: 99999 }}>
      <Modal.Header closeButton>
        <Modal.Title>New step</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Form.Group className="mb-3">
            <Form.Label>Stage</Form.Label>
            <Form.Control
              type="text"
              placeholder="Type the stage"
              value={form.stage}
              onChange={(e) => setForm((prev) => ({ ...prev, stage: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>
             Title <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Type the title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Due Date</Form.Label>
            <Form.Control
              type="date"
              min={journeyDueDateMin}
              value={form.due_date}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  due_date: clampDueDateToJourneyMin(e.target.value, journeyDueDateMin),
                }))
              }
            />
          </Form.Group>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={onHide}
          disabled={submitting}
          style={{
            padding: "8px 16px",
            backgroundColor: "white",
            color: "#6b7280",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || form.title.trim() === ""}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: submitting || form.title.trim() === "" ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Adding..." : "Add step"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Component: EditJourneyStepModal
// ---------------------------------------------------------------------------
type EditJourneyStepModalProps = {
  step: JourneyStepRecord | null;
  journeyId: number;
  journeyDueDateMin: string | undefined;
  onHide: () => void;
  onStepUpdated: () => void;
  onRefreshJourneys: () => void;
};

function EditJourneyStepModal({
  step,
  journeyId,
  journeyDueDateMin,
  onHide,
  onStepUpdated,
  onRefreshJourneys,
}: Readonly<EditJourneyStepModalProps>) {
  const [form, setForm] = useState({
    stage: "",
    title: "",
    description: "",
    due_date: "",
    status: "pending",
    sort_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (step == null) return;
    const dueRaw = step.due_date ? toInputDate(step.due_date) : new Date().toISOString().slice(0, 10);
    setForm({
      stage: step.stage ?? "",
      title: step.title ?? "",
      description: step.description ?? "",
      due_date: clampDueDateToJourneyMin(dueRaw, journeyDueDateMin),
      status: step.status ?? "pending",
      sort_order: Number(step.sort_order ?? 0),
    });
  }, [step, journeyDueDateMin]);

  const handleSubmit = async () => {
    if (step?.id == null) return;
    if (journeyDueDateMin != null && form.due_date !== "" && form.due_date < journeyDueDateMin) {
      toast.error("Due date cannot be before the journey start date.");
      return;
    }
    setSubmitting(true);
    try {
      await updateJourneyStep(journeyId, step.id, {
        stage: form.stage,
        title: form.title,
        description: form.description,
        due_date: form.due_date,
        status: form.status,
        sort_order: form.sort_order,
      });
      toast.success("Step updated.");
      onHide();
      onStepUpdated();
      onRefreshJourneys();
    } catch (error: unknown) {
      console.error("[WorkforceJourney] updateJourneyStep failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={step != null} onHide={onHide} centered style={{ zIndex: 99999 }}>
      <Modal.Header closeButton>
        <Modal.Title>Edit step</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Stage</Form.Label>
          <Form.Control
            type="text"
            placeholder="Stage"
            value={form.stage}
            onChange={(e) => setForm((prev) => ({ ...prev, stage: e.target.value }))}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Due Date</Form.Label>
          <Form.Control
            type="date"
            min={journeyDueDateMin}
            value={form.due_date}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                due_date: clampDueDateToJourneyMin(e.target.value, journeyDueDateMin),
              }))
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Control
            as="select"
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Form.Control>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          onClick={onHide}
          disabled={submitting}
          style={{
            padding: "8px 16px",
            backgroundColor: "white",
            color: "#6b7280",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
const EmployeesOnboarding = () => {
  const { hasPermission } = usePermissions();
  const { mainAppUsers, mainAppDepartments, companyIdentifier } = useMainAppLookups();
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [appliedDepartment, setAppliedDepartment] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedContract, setSelectedContract] = useState("");
  const [appliedEmploymentType, setAppliedEmploymentType] = useState("");
  const [appliedContract, setAppliedContract] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [appliedUserIds, setAppliedUserIds] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [selectedEmployee, setSelectedEmployee] = useState<OnboardingEmployee | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [statusValue, setStatusValue] = useState<string>("in_progress");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showAddStepForm, setShowAddStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState<JourneyStepRecord | null>(null);
  const [deletingStepId, setDeletingStepId] = useState<number | null>(null);
  const [deletingJourney, setDeletingJourney] = useState(false);
  const [showDeleteJourneyModal, setShowDeleteJourneyModal] = useState(false);
  const [showDeleteStepModal, setShowDeleteStepModal] = useState(false);
  const [stepPendingDelete, setStepPendingDelete] = useState<JourneyStepRecord | null>(null);
  const [refreshJourneysKey, setRefreshJourneysKey] = useState(0);

  const users = useMemo(() => (mainAppUsers ?? []) as LookupUser[], [mainAppUsers]);
  const managers = users;

  const journeyId = Number(selectedEmployee?.id);
  const journeyIdValid = Number.isInteger(journeyId) && journeyId > 0;
  const canUpdateJourneyRecord =
    journeyIdValid && hasPermission(PERMISSIONS.UPDATE_JOURNEY_STAFF_MANAGEMENT);
  const canDeleteJourneyRecord =
    journeyIdValid && hasPermission(PERMISSIONS.DELETE_JOURNEY_STAFF_MANAGEMENT);
  const canCreateJourneyStep =
    journeyIdValid && hasPermission(PERMISSIONS.CREATE_JOURNEY_STEP_STAFF_MANAGEMENT);
  const canUpdateJourneyStep =
    journeyIdValid && hasPermission(PERMISSIONS.UPDATE_JOURNEY_STEP_STAFF_MANAGEMENT);
  const canDeleteJourneyStepPerm =
    journeyIdValid && hasPermission(PERMISSIONS.DELETE_JOURNEY_STEP_STAFF_MANAGEMENT);
  const isJourneyCompleted = useMemo(
    () => statusValue === "completed" || isEmployeeJourneyDisplayCompleted(selectedEmployee?.status ?? ""),
    [statusValue, selectedEmployee?.status],
  );

  const { journeysData, journeysPagination, loadingJourneys } = useWorkforceJourneysList({
    companyIdentifier,
    currentPage,
    rowsPerPage,
    refreshKey: refreshJourneysKey,
    appliedSearch,
    appliedDepartment,
    appliedEmploymentType,
    appliedContract,
    appliedUserIds,
    appliedStatus,
  });

  const { journeySteps, stepsLoading, journeyStartDateIso, refreshSteps } = useSelectedJourneyDetail(
    journeyId,
    journeyIdValid,
  );

  /** Keep list row / sidebar counts aligned with detail steps after add/edit/delete (list API aggregates can lag). */
  useEffect(() => {
    if (!journeyIdValid || stepsLoading) return;
    setSelectedEmployee((prev) =>
      reconcileSelectedEmployeeProgress({
        previousEmployee: prev,
        journeyId,
        journeySteps,
      }),
    );
  }, [journeySteps, stepsLoading, journeyIdValid, journeyId]);

  const journeyDueDateMin = useMemo(
    () => journeyStartDateToInputMin(journeyStartDateIso),
    [journeyStartDateIso],
  );

  useEffect(() => {
    setStatusValue(statusDisplayToApiValue(selectedEmployee?.status ?? "In Progress"));
  }, [selectedEmployee?.id, selectedEmployee?.status]);

  const toggleSelectedUserId = useCallback((idStr: string, isSelected: boolean) => {
    setSelectedUserIds((prev) =>
      toggleSelectedJourneyUserIds(prev, idStr, isSelected),
    );
  }, []);

  const filteredManagers = useMemo(
    () => filterJourneyManagers(managers, userSearchTerm),
    [managers, userSearchTerm],
  );

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    await handleJourneyStatusSelect({
      nextStatus: e.target.value,
      canUpdateJourneyRecord,
      isJourneyCompleted,
      journeyId,
      setStatusUpdating,
      setStatusValue,
      setSelectedEmployee,
      setRefreshJourneysKey,
    });
  };

  const openDeleteStepModal = (step: JourneyStepRecord) => {
    if (step.id == null) return;
    setStepPendingDelete(step);
    setShowDeleteStepModal(true);
  };

  const closeDeleteStepModal = () => {
    setShowDeleteStepModal(false);
    setStepPendingDelete(null);
  };

  const confirmDeleteStep = useCallback(async () => {
    await handleJourneyStepDeleteConfirm({
      stepPendingDelete,
      canDeleteJourneyStepPerm,
      journeyId,
      refreshSteps,
      closeDeleteStepModal,
      setRefreshJourneysKey,
      setDeletingStepId,
    });
  }, [canDeleteJourneyStepPerm, journeyId, stepPendingDelete, refreshSteps]);

  const handleDeleteJourney = async () => {
    await handleJourneyDelete({
      canDeleteJourneyRecord,
      journeyId,
      setDeletingJourney,
      setShowDeleteJourneyModal,
      setIsSidebarOpen,
      setSelectedEmployee,
      setRefreshJourneysKey,
    });
  };

  const employees = useMemo<OnboardingEmployee[]>(
    () => mapJourneyRecordsToEmployees(journeysData, users),
    [journeysData, users],
  );

  const handleApply = () => {
    setAppliedSearch(searchTerm);
    setAppliedDepartment(selectedDepartment);
    setAppliedEmploymentType(selectedEmploymentType);
    setAppliedContract(selectedContract);
    setAppliedUserIds(selectedUserIds);
    setAppliedStatus(selectedStatus);
    setCurrentPage(1);
  };

  const handlePaginationChange = useCallback((page: number, limit: number) => {
    setRowsPerPage((prevLimit) => {
      if (prevLimit !== limit) {
        setCurrentPage(1);
        return limit;
      }
      setCurrentPage(page);
      return prevLimit;
    });
  }, []);

  const resetFilters = () => {
    setSearchTerm("");
    setAppliedSearch("");
    setSelectedDepartment("");
    setAppliedDepartment("");
    setSelectedEmploymentType("");
    setAppliedEmploymentType("");
    setSelectedContract("");
    setAppliedContract("");
    setSelectedUserIds([]);
    setAppliedUserIds([]);
    setSelectedStatus("");
    setAppliedStatus("");
    setUserSearchTerm("");
    setCurrentPage(1);
  };

  const appliedUserNames = useMemo(
    () =>
      appliedUserIds
        .map((id) => {
          const idStr = String(id).trim();
          const byPhone = users.find((u) => String(u.phone ?? "").trim() === idStr);
          const byId = users.find((u) => String(u.id) === idStr);
          return byPhone?.name ?? byId?.name ?? id;
        })
        .join(", "),
    [appliedUserIds, users],
  );

  const departments = useMemo(() => mainAppDepartments ?? [], [mainAppDepartments]);

  const selectedDepartmentLabel = useMemo(
    () => getDepartmentFilterLabel(departments, selectedDepartment),
    [selectedDepartment, departments],
  );

  const appliedDepartmentLabel = useMemo(
    () => getDepartmentFilterLabel(departments, appliedDepartment),
    [appliedDepartment, departments],
  );

  const departmentPillActiveLabel = useMemo(() => {
    return pickActiveLabel(
      selectedDepartment,
      appliedDepartment,
      selectedDepartmentLabel,
      appliedDepartmentLabel,
    );
  }, [
    selectedDepartment,
    appliedDepartment,
    selectedDepartmentLabel,
    appliedDepartmentLabel,
  ]);

  const selectedStatusLabel = useMemo(
    () => getJourneyStatusLabel(selectedStatus),
    [selectedStatus],
  );

  const appliedStatusLabel = useMemo(
    () => getJourneyStatusLabel(appliedStatus),
    [appliedStatus],
  );

  const statusPillActiveLabel = useMemo(() => {
    return pickActiveLabel(
      selectedStatus,
      appliedStatus,
      selectedStatusLabel,
      appliedStatusLabel,
    );
  }, [selectedStatus, appliedStatus, selectedStatusLabel, appliedStatusLabel]);

  const onboardingColumns = useMemo<TableColumn<OnboardingEmployee>[]>(
    () => [
      {
        key: "name",
        label: "Employee Name",
        type: "avatar",
        sortable: false,
        avatar: {
          getInitials: (row) => getInitials(row.name),
          getColor: (row) => getAvatarColor(row.name),
        },
      },
      {
        key: "user_id",
        label: "Extension",
        type: "text",
        sortable: false,
      },
      {
        key: "department_name",
        label: "Department",
        type: "text",
        sortable: false,
      },
      {
        key: "designation",
        label: "Designation",
        type: "text",
        sortable: false,
      },
      {
        key: "contract_type",
        label: "Contract Type",
        type: "text",
        sortable: false,
      },
      {
        key: "employment_type",
        label: "Employment Type",
        type: "text",
        sortable: false,
      },
      {
        key: "startDate",
        label: "Start Date",
        type: "text",
        sortable: false,
      },
      {
        key: "stages",
        label: "Steps",
        type: "custom",
        sortable: false,
        render: (row) => (
          <span>{row.completed_steps_count ?? 0}/{row.total_steps_count ?? 0}</span>
        ),
      },
      {
        key: "progress",
        label: "Progress",
        type: "custom",
        sortable: false,
        render: (row) => (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                flex: 1,
                height: "8px",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden",
                maxWidth: "120px",
              }}
            >
              <div
                style={{
                  width: `${row.progress}%`,
                  height: "100%",
                  backgroundColor: "#8b5cf6",
                  borderRadius: "4px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "#1f2937",
                minWidth: "40px",
              }}
            >
              {row.progress}%
            </span>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        type: "custom",
        sortable: false,
        render: (row) => {
          const statusColors = getStatusColor(row.status);
          return (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                backgroundColor: statusColors.bg,
                borderRadius: "16px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: statusColors.dot,
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  color: statusColors.color,
                }}
              >
                {row.status}
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  const onboardingActions = useMemo<TableAction<OnboardingEmployee>[]>(
    () => [
      {
        label: "View",
        icon: <ChevronRight size={16} />,
        onClick: (row) => {
          setSelectedEmployee(row);
          setIsSidebarOpen(true);
        },
        variant: "link",
      },
    ],
    [],
  );

  const journeySidebarSections = useMemo<SidebarSection[]>(
    () =>
      buildJourneySidebarSections({
        selectedEmployee,
        journeyIdValid,
        stepsLoading,
        journeySteps,
        canUpdateJourneyRecord,
        canCreateJourneyStep,
        canUpdateJourneyStep,
        canDeleteJourneyStepPerm,
        deletingStepId,
        statusValue,
        statusUpdating,
        isJourneyCompleted,
        handleStatusChange,
        setShowAddStepForm,
        setEditingStep,
        openDeleteStepModal,
      }),
    [
      selectedEmployee,
      journeyIdValid,
      stepsLoading,
      journeySteps,
      canUpdateJourneyRecord,
      canCreateJourneyStep,
      canUpdateJourneyStep,
      canDeleteJourneyStepPerm,
      deletingStepId,
      statusValue,
      statusUpdating,
      isJourneyCompleted,
      handleStatusChange,
    ],
  );

  const employmentFilterOptions = useMemo(
    () => [
      {
        label: "All employment types",
        value: "__all__",
        onClick: () => setSelectedEmploymentType(""),
      },
      ...EMPLOYMENT_TYPES.map((type) => ({
        label: type,
        value: type,
        onClick: () => setSelectedEmploymentType(type),
      })),
    ],
    [],
  );

  const contractFilterOptions = useMemo(
    () => [
      {
        label: "All contract types",
        value: "__all__",
        onClick: () => setSelectedContract(""),
      },
      ...CONTRACT_TYPES.map((type) => ({
        label: type,
        value: type,
        onClick: () => setSelectedContract(type),
      })),
    ],
    [],
  );

  const departmentFilterOptions = useMemo(
    () => [
      {
        label: "All departments",
        value: "__all__",
        onClick: () => setSelectedDepartment(""),
      },
      ...departments.map((dept: MainAppDepartmentLookup) => {
        const idStr = String(dept.id);
        return {
          label: hierarchyLabel(dept),
          value: idStr,
          onClick: () => setSelectedDepartment(idStr),
        };
      }),
    ],
    [departments],
  );

  const statusFilterOptions = useMemo(
    () => [
      {
        label: "All statuses",
        value: "__all__",
        onClick: () => setSelectedStatus(""),
      },
      ...JOURNEY_STATUS_OPTIONS.map((opt: { value: string; label: string }) => ({
        label: opt.label,
        value: opt.value,
        onClick: () => setSelectedStatus(opt.value),
      })),
    ],
    [],
  );

  const usersDropdownContent = useMemo(
    () => (
      <div style={{ minWidth: "260px" }}>
        <input
          type="text"
          placeholder="Search user..."
          value={userSearchTerm}
          onChange={(e) => setUserSearchTerm(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            marginBottom: "8px",
            padding: "8px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "13px",
          }}
        />
        <div style={{ marginBottom: "8px" }}>
          {filteredManagers.map((mgr: LookupUser, idx: number) => {
            const label = hierarchyLabel(mgr);
            const phone = String(mgr.phone ?? "").trim();
            const idStr = phone || String(mgr.id ?? idx);
            const rowKey = `${String(mgr.id ?? "row")}-${idx}`;
            const isSelected = selectedUserIds.includes(idStr);
            return (
              <label
                key={rowKey}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 4px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onMouseDown={(e) => e.stopPropagation()}
                  onChange={() => {
                    toggleSelectedUserId(idStr, isSelected);
                  }}
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => {
              setAppliedUserIds(selectedUserIds);
              setCurrentPage(1);
            }}
            style={{
              border: "none",
              backgroundColor: "#6366f1",
              color: "white",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "12px",
            }}
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedUserIds([]);
              setAppliedUserIds([]);
              setCurrentPage(1);
            }}
            style={{
              border: "1px solid #d1d5db",
              backgroundColor: "white",
              color: "#374151",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "12px",
            }}
          >
            Clear
          </button>
        </div>
      </div>
    ),
    [filteredManagers, selectedUserIds, userSearchTerm, toggleSelectedUserId],
  );

  const filterPills = useMemo<FilterPill[]>(
    () =>
      buildJourneyFilterPills({
        selectedEmploymentType,
        appliedEmploymentType,
        setSelectedEmploymentType,
        setAppliedEmploymentType,
        selectedContract,
        appliedContract,
        setSelectedContract,
        setAppliedContract,
        selectedDepartment,
        appliedDepartment,
        departmentPillActiveLabel,
        setSelectedDepartment,
        setAppliedDepartment,
        selectedUserIds,
        appliedUserIds,
        setSelectedUserIds,
        setAppliedUserIds,
        selectedStatus,
        appliedStatus,
        statusPillActiveLabel,
        setSelectedStatus,
        setAppliedStatus,
        setCurrentPage,
        employmentFilterOptions,
        contractFilterOptions,
        departmentFilterOptions,
        statusFilterOptions,
        usersDropdownContent,
      }),
    [
      selectedEmploymentType,
      appliedEmploymentType,
      selectedContract,
      appliedContract,
      selectedDepartment,
      appliedDepartment,
      departmentPillActiveLabel,
      selectedUserIds,
      appliedUserIds,
      selectedStatus,
      appliedStatus,
      statusPillActiveLabel,
      employmentFilterOptions,
      contractFilterOptions,
      departmentFilterOptions,
      statusFilterOptions,
      usersDropdownContent,
    ],
  );

  const onboardingToolbar = useMemo<ToolbarConfig>(
    () => ({
      showTabs: true,
      tabs: [
        {
          id: "employees-journey",
          label: "Employees Journey",
          count: journeysPagination?.total,
        },
      ],
      activeTab: "employees-journey",
      showSearch: true,
      searchValue: searchTerm,
      searchPlaceholder: "Search by extension or designation",
      onSearchChange: setSearchTerm,
      onSearch: handleApply,
      showFiltersButton: true,
      showFilterPills: false,
      filterPills,
      showMoreFiltersButton: false,
      customActions: (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={handleApply}
            style={{
              border: "none",
              backgroundColor: "#6366f1",
              color: "white",
              borderRadius: "6px",
              padding: "7px 12px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Apply
          </button>
          <button
            type="button"
            onClick={resetFilters}
            style={{
              border: "1px solid #d1d5db",
              backgroundColor: "white",
              color: "#374151",
              borderRadius: "6px",
              padding: "7px 12px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            Clear
          </button>
        </div>
      ),
    }),
    [searchTerm, filterPills, journeysPagination?.total],
  );

  const hasAppliedFilters = useMemo(
    () =>
      hasAppliedJourneyFilters({
        appliedSearch,
        appliedDepartment,
        appliedEmploymentType,
        appliedContract,
        appliedStatus,
        appliedUserIds,
      }),
    [
      appliedSearch,
      appliedDepartment,
      appliedEmploymentType,
      appliedContract,
      appliedStatus,
      appliedUserIds,
    ],
  );

  const sidebarQuickActions = useMemo(
    () =>
      getJourneySidebarQuickActions({
        canDeleteJourneyRecord,
        deletingJourney,
        setShowDeleteJourneyModal,
      }),
    [canDeleteJourneyRecord, deletingJourney],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Employees Journey" />
      <div
        className="journey-page-shell"
        style={{ display: "flex", gap: 0, height: "calc(100vh)", overflow: "hidden" }}
      >
        <div
          className="journey-table-pane"
          style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}
        >
          <GenericTable<OnboardingEmployee>
            data={employees}
            columns={onboardingColumns}
            actions={onboardingActions}
            showActions={true}
            actionsLabel="View"
            loading={loadingJourneys}
            loadingMessage="Loading onboarding data..."
            emptyMessage="No onboarding journeys found"
            hover={true}
            uniqueKey="id"
            pagination={
              journeysPagination
                ? {
                    currentPage: journeysPagination.page ?? currentPage,
                    rowsPerPage: journeysPagination.limit ?? rowsPerPage,
                    totalRows: journeysPagination.total ?? 0,
                    pageSizeOptions: [15, 25, 50, 100],
                  }
                : undefined
            }
            onPaginationChange={handlePaginationChange}
            onRowClick={(row) => {
              setSelectedEmployee(row);
              setIsSidebarOpen(true);
            }}
            onPreviewClick={(row) => {
              setSelectedEmployee(row);
              setIsSidebarOpen(true);
            }}
            showToolbar={true}
            toolbar={onboardingToolbar}
            showToolbarActions={false}
            fixedHeight={true}
            maxHeight="calc(100vh - 295px)"
          />

          {hasAppliedFilters && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280", padding: "0 4px" }}>
              {appliedSearch.trim() ? `Search: ${appliedSearch} | ` : ""}
              {appliedDepartment ? `Department: ${appliedDepartmentLabel} | ` : ""}
              {appliedEmploymentType ? `Employment: ${appliedEmploymentType} | ` : ""}
              {appliedContract ? `Contract: ${appliedContract} | ` : ""}
              {appliedStatus ? `Status: ${appliedStatusLabel} | ` : ""}
              {appliedUserIds.length > 0 ? `Users: ${appliedUserNames}` : ""}
            </div>
          )}
        </div>

        {isSidebarOpen && selectedEmployee && (
          <GenericSidebar
            isOpen={isSidebarOpen}
            onClose={() => {
              setIsSidebarOpen(false);
              setSelectedEmployee(null);
            }}
            title={selectedEmployee.name}
            subtitle={selectedEmployee.role ?? selectedEmployee.designation ?? ""}
            company={selectedEmployee.department_name}
            avatar={{
              initials: getInitials(selectedEmployee.name),
              name: selectedEmployee.name,
              gradient: getAvatarColor(selectedEmployee.name),
            }}
            quickActions={sidebarQuickActions}
            sections={journeySidebarSections}
          />
        )}

        <AddJourneyStepModal
          show={showAddStepForm}
          journeyId={journeyId}
          journeyDueDateMin={journeyDueDateMin}
          stepCount={journeySteps.length}
          onHide={() => setShowAddStepForm(false)}
          onStepAdded={refreshSteps}
          onRefreshJourneys={() => setRefreshJourneysKey((k) => k + 1)}
        />

        <EditJourneyStepModal
          step={editingStep}
          journeyId={journeyId}
          journeyDueDateMin={journeyDueDateMin}
          onHide={() => setEditingStep(null)}
          onStepUpdated={refreshSteps}
          onRefreshJourneys={() => setRefreshJourneysKey((k) => k + 1)}
        />

        <DeleteConfirmationModal
          show={showDeleteStepModal}
          onHide={closeDeleteStepModal}
          onConfirm={confirmDeleteStep}
          itemName={stepPendingDelete?.title?.trim() ? `step "${stepPendingDelete.title.trim()}"` : "this journey step"}
          itemType="step"
          loading={deletingStepId != null}
        />
        <DeleteConfirmationModal
          show={showDeleteJourneyModal}
          onHide={() => setShowDeleteJourneyModal(false)}
          onConfirm={handleDeleteJourney}
          itemName={selectedEmployee ? `onboarding journey for ${selectedEmployee.name}` : "this journey"}
          itemType="journey"
          loading={deletingJourney}
        />
      </div>
    </React.Fragment>
  );
};

EmployeesOnboarding.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EmployeesOnboarding;
