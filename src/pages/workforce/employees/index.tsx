import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericSidebar, { SidebarSection } from "@components/GenericSidebarNew";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import AddEmployeeModal from "@pages/workforce/AddEmployeeModal";
import EditEmployeeModal from "@pages/workforce/EditEmployeeModal";

import {
  getUserProfiles,
  getUserProfile,
  deleteUserProfile,
  getEmployeeDashboardCounters,
  getEmployeeDashboardGraphDepartmentHeadcount,
  createJourney,
  type UserProfile,
  type UserProfileAddress,
} from "@utils/staffManagement";
import { useMainAppLookups, type MainAppUserLookup } from "@hooks/useMainAppLookups";
import { toast } from "react-toastify";
import { Button, Form, Modal } from "react-bootstrap";
import GenericTable, { FilterPill, TabConfig, TableAction, TableColumn, ToolbarConfig } from "@components/GenericTable";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { Plus, Pencil, Trash2, User, Calendar } from "lucide-react";
import moment from "moment";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { formatPhoneForDisplay } from "@utils/phoneDisplay";

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance", "Temporary"];
const CONTRACT_TYPES = ["Permanent", "Temporary", "Freelance", "Fixed-term", "Probation"];
const EMPLOYEE_STATUS_OPTIONS = ["Active", "Inactive"];

/** Dashboard counters API response shape */
interface EmployeeDashboardCountersData {
  employees?: { total?: number; active?: number; inactive?: number };
  approvals?: {
    pending?: number;
    aging?: { "0_3_days"?: number; "4_7_days"?: number; "8_plus_days"?: number };
    avg_aging?: number;
    pending_leave?: number;
    pending_other?: number;
  };
  leave?: { on_leave_today?: number; upcoming_7_days?: number };
  journey?: { total?: number; in_progress?: number; on_track?: number; overdue?: number; completed?: number };
  attendance?: {
    today?: { with_record?: number; checked_in?: number; checked_out?: number; no_record_estimate?: number };
  };
  compliance_alerts?: { high?: number; medium?: number; low?: number; total?: number };
}
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useSession } from "next-auth/react";

interface Document {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedDate: string;
  tags: string[];
  role?: string;
  location?: string;
}

interface MainAppDepartment {
  id: number;
  name?: string;
  [key: string]: unknown;
}

interface MainAppUser {
  id: string | number;
  user_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  department_id?: number;
  [key: string]: unknown;
}

/** Value sent as `user_ids` in getUserProfiles — matches profile `user_id` (phone / extension). */
function userIdForProfilePayload(u: { phone?: string | null }): string {
  const raw = u.phone;
  if (raw == null) return "";
  return String(raw).trim();
}

/** Address form row with country-state-city cascade fields */
type AddressFormItem = UserProfileAddress & { state?: string; countryCode?: string; stateCode?: string };

function displayProfileName(p: UserProfile): string {
  return String((p as UserProfile & { name?: string }).name ?? p.user_id ?? p.employee_code ?? p.id ?? "—");
}

/** Label for department headcount chart: resolve id via main-app departments, else legacy name or placeholder */
function departmentHeadcountDisplayName(
  departmentId: number | null,
  departments: MainAppDepartment[],
  legacyName?: string | null
): string {
  if (departmentId != null) {
    const match = departments.find((d) => Number(d.id) === Number(departmentId));
    if (match?.name != null && String(match.name).trim() !== "") {
      return String(match.name).trim();
    }
    return `Department ${departmentId}`;
  }
  if (legacyName != null && legacyName.trim() !== "") {
    return legacyName.trim();
  }
  return "—";
}

function parseDepartmentIdFromApi(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function legacyDisplayNameFromApi(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

interface DepartmentHeadcountRawRow {
  departmentId: number | null;
  count: number;
  legacyName: string | null;
}

interface DepartmentHeadcountChartRow {
  name: string;
  count: number;
  color: string;
  rowKey: string;
}

const ITEMS_PER_PAGE = 15;

const DEPARTMENT_CHART_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

const E164_MAX_DIGITS = 15;

/** Format phone input to E.164: optional leading +, then digits only, max 15 digits */
function toE164Phone(value: string): string {
  const hasPlus = value.trimStart().startsWith("+");
  const digits = value.replaceAll(/\D/g, "").slice(0, E164_MAX_DIGITS);
  const prefix = hasPlus ? "+" : "";
  return digits.length ? prefix + digits : prefix;
}

// Custom styles to match Bootstrap form control height and styling (same as UserProfileTab)
const selectStyles = {
  control: (provided: Record<string, unknown>, state: { isFocused?: boolean }) => ({
    ...provided,
    minHeight: "48px",
    height: "48px",
    fontSize: "0.875rem",
    borderColor: state.isFocused ? "#86b7fe" : "#dee2e6",
    boxShadow: state.isFocused ? "0 0 0 0.2rem rgba(13, 110, 253, 0.25)" : "none",
    borderRadius: "0.375rem",
    "&:hover": {
      borderColor: state.isFocused ? "#86b7fe" : "#DBE0E5",
    },
  }),
  valueContainer: (provided: Record<string, unknown>) => ({
    ...provided,
    height: "48px",
    padding: "0 8px",
  }),
  input: (provided: Record<string, unknown>) => ({
    ...provided,
    margin: "0px",
    padding: "0px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  indicatorsContainer: (provided: Record<string, unknown>) => ({
    ...provided,
    height: "48px",
  }),
  placeholder: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#6c757d",
    fontSize: "0.875rem",
  }),
  singleValue: (provided: Record<string, unknown>) => ({
    ...provided,
    fontSize: "0.875rem",
    lineHeight: "1.5",
  }),
  multiValue: (provided: Record<string, unknown>) => ({
    ...provided,
    backgroundColor: "#e7f1ff",
    borderRadius: "0.25rem",
  }),
  multiValueLabel: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#0d6efd",
    fontSize: "0.875rem",
    padding: "2px 6px",
  }),
  multiValueRemove: (provided: Record<string, unknown>) => ({
    ...provided,
    color: "#0d6efd",
    "&:hover": {
      backgroundColor: "#b6d4fe",
      color: "#0d6efd",
    },
  }),
};

/** Normalize hierarchy list item to string for display (handles both string and { name?, id? } shapes) */
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

/** Local calendar date as YYYY-MM-DD for `<input type="date" min>` and comparisons */
function localDateIsoToday(): string {
  return moment().format("YYYY-MM-DD");
}

/**
 * Earliest allowed journey start: not before the employee record's `created_at` (local calendar day)
 * and not before today.
 */
function journeyStartDateMinIso(profile: UserProfile | null | undefined): string {
  const today = localDateIsoToday();
  if (profile == null) return today;
  const raw = profile["created_at"];
  if (typeof raw !== "string" || raw.trim() === "") return today;
  const createdDay = moment(raw);
  if (!createdDay.isValid()) return today;
  const createdIso = createdDay.format("YYYY-MM-DD");
  const todayM = moment(today, "YYYY-MM-DD");
  const createdM = moment(createdIso, "YYYY-MM-DD");
  return moment.max(todayM, createdM).format("YYYY-MM-DD");
}

function ManagerFilterPillContent({
  managers,
  selectedManagerIds,
  onToggle,
  closeMenu,
}: Readonly<{
  managers: MainAppUserLookup[];
  selectedManagerIds: string[];
  onToggle: (idStr: string, isSelected: boolean) => void;
  closeMenu: () => void;
}>) {
  const [query, setQuery] = useState("");

  const filteredManagers = useMemo(
    () =>
      managers.filter((mgr: MainAppUserLookup) => {
        if (userIdForProfilePayload(mgr) === "") return false;
        const label = hierarchyLabel(mgr);
        return !query.trim() || label.toLowerCase().includes(query.trim().toLowerCase());
      }),
    [managers, query],
  );

  return (
    <div style={{ minWidth: "260px", maxHeight: "320px", overflow: "hidden" }}>
      <div className="p-2 border-bottom">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search user..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div style={{ maxHeight: "220px", overflowY: "auto" }}>
        <button
          type="button"
          className="dropdown-item"
          onClick={() => closeMenu()}
        >
          Done
        </button>
        {filteredManagers.map((mgr: MainAppUserLookup) => {
          const label = hierarchyLabel(mgr);
          const userIdStr = userIdForProfilePayload(mgr);
          const isSelected = selectedManagerIds.includes(userIdStr);
          return (
            <button
              type="button"
              key={String(mgr.id)}
              className="dropdown-item d-flex align-items-center gap-2"
              onClick={() => onToggle(userIdStr, isSelected)}
              style={{ backgroundColor: isSelected ? "#eef2ff" : undefined }}
            >
              <span style={{ width: "16px" }}>{isSelected ? "✓" : ""}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function UsersPillDropdownContent({
  closeMenu,
  managers,
  selectedManagerIds,
  onToggle,
}: Readonly<{
  closeMenu: () => void;
  managers: MainAppUserLookup[];
  selectedManagerIds: string[];
  onToggle: (idStr: string, isSelected: boolean) => void;
}>) {
  return (
    <ManagerFilterPillContent
      managers={managers}
      selectedManagerIds={selectedManagerIds}
      onToggle={onToggle}
      closeMenu={closeMenu}
    />
  );
}

const Employees = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { mainAppDepartments, mainAppUsers, companyIdentifier } = useMainAppLookups();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedContract, setSelectedContract] = useState("");
  /** Applied filter values (sent to API) – only updated when Apply is clicked */
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedDepartment, setAppliedDepartment] = useState("");
  const [appliedLocationId, setAppliedLocationId] = useState<number | null>(null);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedEmploymentType, setAppliedEmploymentType] = useState("");
  const [appliedContract, setAppliedContract] = useState("");
  const [appliedManagerIds, setAppliedManagerIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; last_page: number } | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<UserProfile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [journeyModalProfile, setJourneyModalProfile] = useState<UserProfile | null>(null);
  const [journeyForm, setJourneyForm] = useState<{ startDate: string; status: string }>({ startDate: "", status: "in_progress" });
  const [journeySubmitting, setJourneySubmitting] = useState(false);

  const [departmentHeadcountRaw, setDepartmentHeadcountRaw] = useState<DepartmentHeadcountRawRow[]>([]);
  const [dashboardCounters, setDashboardCounters] = useState<EmployeeDashboardCountersData | null>(null);

  const fetchDepartmentHeadcount = useCallback(async () => {
    try {
      const data = await getEmployeeDashboardGraphDepartmentHeadcount();
      let raw: unknown[] = [];
      if (Array.isArray(data)) raw = data;
      else if (data && typeof data === "object" && Array.isArray((data as { data?: unknown[] }).data)) raw = (data as { data: unknown[] }).data;
      const list: DepartmentHeadcountRawRow[] = (raw as Record<string, unknown>[]).map((item) => {
        const departmentId = parseDepartmentIdFromApi(item.department_id);
        const count = Number(item.count ?? 0);
        const legacyName = legacyDisplayNameFromApi(item.name);
        return { departmentId, count, legacyName };
      });
      setDepartmentHeadcountRaw(list);
    } catch (e) {
      console.error("[Employees] getEmployeeDashboardGraphDepartmentHeadcount error", e);
      setDepartmentHeadcountRaw([]);
    }
  }, []);

  const departmentHeadcountData: DepartmentHeadcountChartRow[] = useMemo(() => {
    const departments = mainAppDepartments ?? [];
    return departmentHeadcountRaw.map((row, i) => {
      const name = departmentHeadcountDisplayName(row.departmentId, departments, row.legacyName);
      const color = DEPARTMENT_CHART_COLORS[i % DEPARTMENT_CHART_COLORS.length];
      const rowKey =
        row.departmentId == null ? `row-${i}-${row.legacyName ?? "x"}` : `dept-${row.departmentId}`;
      return { name, count: row.count, color, rowKey };
    });
  }, [departmentHeadcountRaw, mainAppDepartments]);

  const fetchDashboardCounters = useCallback(async () => {
    try {
      const data = await getEmployeeDashboardCounters();
      setDashboardCounters((data as EmployeeDashboardCountersData) ?? null);
    } catch (e) {
      console.error("[Employees] getEmployeeDashboardCounters error", e);
      setDashboardCounters(null);
    }
  }, []);

  useEffect(() => {
    fetchDepartmentHeadcount();
    fetchDashboardCounters();
  }, [fetchDepartmentHeadcount, fetchDashboardCounters]);

  const loadProfiles = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; employment_type?: string; contract_type?: string; status?: string; location_id?: number; department_id?: number; search?: string; user_ids?: string[] } = {
        page,
        limit: rowsPerPage,
      };
      if (appliedEmploymentType?.trim()) params.employment_type = appliedEmploymentType.trim();
      if (appliedContract?.trim()) params.contract_type = appliedContract.trim();
      if (appliedStatus?.trim()) params.status = appliedStatus.trim().toLowerCase();
      if (appliedLocationId != null) params.location_id = appliedLocationId;
      if (appliedDepartment?.trim()) params.department_id = Number(appliedDepartment.trim());
      if (appliedSearch?.trim()) params.search = appliedSearch.trim();
      if (appliedManagerIds.length > 0) params.user_ids = appliedManagerIds;
      const { data, pagination: p } = await getUserProfiles(params);
      setProfiles(data ?? []);
      if (p) setPagination({ page: p.page, limit: p.limit, total: p.total, last_page: p.last_page });
      else setPagination(null);
    } catch (err) {
      console.error("[Employees] getUserProfiles error", err);
      setProfiles([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [appliedEmploymentType, appliedContract, appliedStatus, appliedLocationId, appliedDepartment, appliedSearch, appliedManagerIds, rowsPerPage]);

  useEffect(() => {
    loadProfiles(currentPage);
  }, [currentPage, rowsPerPage, loadProfiles]);

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

  const refreshAfterProfileSave = useCallback(() => {
    loadProfiles(currentPage);
    fetchDepartmentHeadcount();
    fetchDashboardCounters();
  }, [currentPage, loadProfiles, fetchDepartmentHeadcount, fetchDashboardCounters]);

  // Open sidebar when navigating from notification with ?openId= (target_id)
  useEffect(() => {
    if (!router.isReady || !router.query.openId) return;
    const openId = router.query.openId;
    let id: string | undefined;
    if (typeof openId === "string") id = openId;
    else if (Array.isArray(openId)) id = openId[0];
    if (!id || Number.isNaN(Number(id))) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getUserProfile(Number(id));
        if (!cancelled && profile) setSelectedProfile(profile);
      } catch (err) {
        console.error("[Employees] getUserProfile(openId) error", err);
      } finally {
        if (!cancelled) {
          const { openId: _openId, ...rest } = router.query;
          router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [router.isReady, router.query.openId]);

  const handleProfileClick = useCallback(async (profile: UserProfile) => {
    try {
      const fullProfile = await getUserProfile(profile.id);
      setSelectedProfile(fullProfile);
    } catch (err) {
      console.error("[Employees] getUserProfile error", err);
      setSelectedProfile(profile);
    }
  }, []);

  const closeSidebar = useCallback(() => {
    setSelectedProfile(null);
  }, []);


  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const openJourneyModal = useCallback((profile: UserProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setJourneyModalProfile(profile);
    setJourneyForm({
      startDate: journeyStartDateMinIso(profile),
      status: "in_progress",
    });
    setShowJourneyModal(true);
  }, []);

  const closeJourneyModal = useCallback(() => {
    setShowJourneyModal(false);
    setJourneyModalProfile(null);
    setJourneyForm({ startDate: "", status: "in_progress" });
  }, []);

  const handleCreateJourney = async () => {
    if (journeyModalProfile == null) return;
    const startDate = journeyForm.startDate.trim();
    if (startDate === "") {
      toast.warn("Please select a start date.");
      return;
    }
    const minStart = journeyStartDateMinIso(journeyModalProfile);
    if (startDate < minStart) {
      toast.warn("Start date cannot be before the employee was created or before today.");
      return;
    }
    const departmentId = journeyModalProfile.department_id;
    let departmentName = "";
    if (departmentId != null) {
      departmentName =
        mainAppDepartments.find((d: MainAppDepartment) => Number(d.id) === Number(departmentId))?.name ?? "";
    }
    const payload = {
      user_profile_id: journeyModalProfile.id,
      user_id: String(journeyModalProfile.user_id ?? ""),
      job_title: journeyModalProfile.job_title ?? "",
      department_name: departmentName,
      start_date: startDate,
      status: journeyForm.status,
 
    };
    setJourneySubmitting(true);
    try {
      await createJourney(payload);
      toast.success("Journey created successfully.");
      refreshAfterProfileSave();
      closeJourneyModal();
    } catch (err) {
      console.error("[Employees] createJourney error", err);
    } finally {
      setJourneySubmitting(false);
    }
  };

  /** Single list of user options for both Create and Edit modals; value is user id (stored as user_id in form) */
  /** Resolve display name from MainAppUser (by user_id), then profile fields */
  const getDisplayName = useCallback((p: UserProfile): string => {
    const userId = p.user_id ?? (p as UserProfile & { extension_number?: string }).extension_number ?? p.employee_code;
    if (userId != null && mainAppUsers.length > 0) {
      const uid = String(userId);
      const mainUser =
        mainAppUsers.find((u: MainAppUserLookup) => String(u.phone) === uid) ??
        mainAppUsers.find((u: MainAppUserLookup) => String(u.id) === uid);
      if (mainUser?.name) return mainUser.name;
    }
    return String((p as UserProfile & { name?: string }).name ?? p.user_id ?? p.employee_code ?? p.id ?? "—");
  }, [mainAppUsers]);


  const openEditModal = useCallback((profile: UserProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProfile(profile);
    setShowEditModal(true);
  }, []);

  const handleDeleteClick = useCallback((profile: UserProfile, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProfileToDelete(profile);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;
    setDeleting(true);
    try {
      await deleteUserProfile(profileToDelete.id);
      toast.success("Employee deleted");
      setShowDeleteModal(false);
      setProfileToDelete(null);
      loadProfiles(currentPage);
      if (selectedProfile?.id === profileToDelete.id) setSelectedProfile(null);
    } catch (err) {
      console.error("[Employees] deleteUserProfile error", err);
    } finally {
      setDeleting(false);
    }
  };
  /** API returns data for applied filters; no extra client-side filter */
  const filteredProfiles = profiles;

  const departments = mainAppDepartments ?? [];
  const managers = mainAppUsers ?? [];

  
  const toggleSelectedManagerId = useCallback((idStr: string, isSelected: boolean) => {
    setSelectedManagerIds((prev) => {
      if (isSelected) return prev.filter((id) => id !== idStr);
      return [...prev, idStr];
    });
  }, []);


  const handleApply = useCallback(() => {
      setAppliedSearch(searchTerm);
      setAppliedDepartment(selectedDepartment);
      setAppliedLocationId(selectedLocationId);
      setAppliedStatus(selectedStatus);
      setAppliedEmploymentType(selectedEmploymentType);
      setAppliedContract(selectedContract);
      setAppliedManagerIds(selectedManagerIds);
      setCurrentPage(1);
    }, [
      searchTerm,
      selectedDepartment,
      selectedLocationId,
      selectedStatus,
      selectedEmploymentType,
      selectedContract,
      selectedManagerIds,
    ]);

  const resetFilters = useCallback(() => {
      setSelectedDepartment("");
      setSelectedLocationId(null);
      setSelectedStatus("");
      setSelectedManagerIds([]);
      setSelectedEmploymentType("");
      setSelectedContract("");
      setSearchTerm("");
      setAppliedSearch("");
      setAppliedDepartment("");
      setAppliedLocationId(null);
      setAppliedStatus("");
      setAppliedEmploymentType("");
      setAppliedContract("");
      setAppliedManagerIds([]);
      setCurrentPage(1);
    }, []);

  const employeeTabs = useMemo<TabConfig[]>(
    () => [{ id: "employees", label: "Employees", count: pagination?.total ?? 0, removable: false }],
    [pagination?.total],
  );

  const managerNames = useMemo(() => {
    return appliedManagerIds
      .map((uid) => mainAppUsers.find((u: MainAppUserLookup) => userIdForProfilePayload(u) === uid)?.name ?? uid)
      .join(", ");
  }, [appliedManagerIds, mainAppUsers]);

  const renderUsersDropdown = useCallback(
    ({ closeMenu }: Readonly<{ closeMenu: () => void }>) => (
      <UsersPillDropdownContent
        closeMenu={closeMenu}
        managers={managers}
        selectedManagerIds={selectedManagerIds}
        onToggle={toggleSelectedManagerId}
      />
    ),
    [managers, selectedManagerIds, toggleSelectedManagerId],
  );

  const employeeFilterPills = useMemo<FilterPill[]>(() => {
    const deptFilterKey = selectedDepartment || appliedDepartment;
    const matchedDepartment = deptFilterKey
      ? departments.find((d: MainAppDepartment) => String((d as { id?: number }).id) === deptFilterKey)
      : undefined;
    let departmentActiveLabel = "";
    if (deptFilterKey) {
      if (matchedDepartment) {
        departmentActiveLabel = hierarchyLabel(matchedDepartment);
      } else {
        departmentActiveLabel = deptFilterKey;
      }
    }

    const departmentOptions = departments.map((dept: MainAppDepartment, idx: number) => {
      const label = hierarchyLabel(dept);
      const deptId = typeof dept === "object" && dept !== null && "id" in (dept as object) ? String((dept as { id?: number }).id ?? "") : "";
      return {
        label,
        value: deptId || `dept-${idx}`,
        onClick: () => setSelectedDepartment(deptId),
      };
    });

    return [
      {
        id: "department",
        label: "Department",
        showDropdown: true,
        searchable: true,
        active: Boolean(deptFilterKey),
        activeLabel: departmentActiveLabel,
        onClear: () => {
          setSelectedDepartment("");
          setAppliedDepartment("");
          setCurrentPage(1);
        },
        dropdownOptions: [
          {
            label: "All departments",
            value: "",
            onClick: () => setSelectedDepartment(""),
          },
          ...departmentOptions,
        ],
      },
      {
        id: "status",
        label: "Status",
        showDropdown: true,
        active: Boolean(selectedStatus || appliedStatus),
        activeLabel: selectedStatus || appliedStatus,
        onClear: () => {
          setSelectedStatus("");
          setAppliedStatus("");
          setCurrentPage(1);
        },
        dropdownOptions: [
          { label: "All Statuses", value: "", onClick: () => setSelectedStatus("") },
          ...EMPLOYEE_STATUS_OPTIONS.map((status) => ({
            label: status,
            value: status,
            onClick: () => setSelectedStatus(status),
          })),
        ],
      },
      {
        id: "users",
        label: "Users",
        showDropdown: true,
        active: selectedManagerIds.length > 0 || appliedManagerIds.length > 0,
        activeLabel: selectedManagerIds.length > 0 
          ? selectedManagerIds
              .map((uid) => mainAppUsers.find((u: MainAppUserLookup) => userIdForProfilePayload(u) === uid)?.name ?? uid)
              .join(", ")
          : managerNames,
        onClear: () => {
          setSelectedManagerIds([]);
          setAppliedManagerIds([]);
          setCurrentPage(1);
        },
        dropdownContent: renderUsersDropdown,
      },
      {
        id: "employment",
        label: "Employment",
        showDropdown: true,
        active: Boolean(selectedEmploymentType || appliedEmploymentType),
        activeLabel: selectedEmploymentType || appliedEmploymentType,
        onClear: () => {
          setSelectedEmploymentType("");
          setAppliedEmploymentType("");
          setCurrentPage(1);
        },
        dropdownOptions: [
          { label: "All employment types", value: "", onClick: () => setSelectedEmploymentType("") },
          ...EMPLOYMENT_TYPES.map((type) => ({
            label: type,
            value: type,
            onClick: () => setSelectedEmploymentType(type),
          })),
        ],
      },
      {
        id: "contract",
        label: "Contract",
        showDropdown: true,
        active: Boolean(selectedContract || appliedContract),
        activeLabel: selectedContract || appliedContract,
        onClear: () => {
          setSelectedContract("");
          setAppliedContract("");
          setCurrentPage(1);
        },
        dropdownOptions: [
          { label: "All contract types", value: "", onClick: () => setSelectedContract("") },
          ...CONTRACT_TYPES.map((type) => ({
            label: type,
            value: type,
            onClick: () => setSelectedContract(type),
          })),
        ],
      },
    ];
  }, [
    appliedContract,
    appliedDepartment,
    appliedEmploymentType,
    appliedManagerIds,
    appliedStatus,
    selectedDepartment,
    selectedStatus,
    selectedEmploymentType,
    selectedContract,
    selectedManagerIds,
    departments,
    managerNames,
    managers,
    renderUsersDropdown,
    toggleSelectedManagerId,
    mainAppUsers,
  ]);

  const employeeToolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchTerm,
      searchPlaceholder: "Search by identification number,phone, extension, or designation",
      onSearchChange: setSearchTerm,
      onSearch: handleApply,
      showTabs: true,
      tabs: employeeTabs,
      activeTab: "employees",
      onTabChange: () => {},
      showFiltersButton: true,
      showFilterPills: false,
      filterPills: employeeFilterPills,
      showMoreFiltersButton: false,
      customActions: (
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button type="button" className="btn btn-outline-dark btn-sm" onClick={resetFilters}>
            Reset
          </button>
          <button type="button" className="btn btn-dark btn-sm" onClick={handleApply}>
            Apply
          </button>
          {session?.user?.permissions?.includes("add-employee-staff-management") && (
            <button type="button" className="btn btn-dark btn-sm d-flex align-items-center gap-1" onClick={openCreateModal}>
              <Plus size={14} />
              Add Employee
            </button>
          )}
        </div>
      ),
    }),
    [employeeFilterPills, employeeTabs, handleApply, openCreateModal, resetFilters, searchTerm, session?.user?.permissions],
  );

  const employeeSidebarSections = useMemo<SidebarSection[]>(() => {
    if (!selectedProfile) return [];
    const departmentName = selectedProfile.department_id == null
      ? "—"
      : mainAppDepartments.find((d: MainAppDepartment) => Number(d.id) === Number(selectedProfile.department_id))?.name ?? String(selectedProfile.department_id);

    return [
      {
        id: "employee-overview",
        title: "Employee Overview",
        defaultExpanded: true,
        fields: [
          { label: "Name", value: getDisplayName(selectedProfile) },
          { label: "Extension", value: selectedProfile.user_id ?? "—" },
          { label: "Phone", value: formatPhoneForDisplay(selectedProfile.phone ?? "") || "—", type: "phone" },
          { label: "Status", value: selectedProfile.status ?? "—", type: "badge", badgeVariant: String(selectedProfile.status ?? "").toLowerCase() === "active" ? "success" : "danger" },
        ],
      },
      {
        id: "employee-job",
        title: "Employment Details",
        defaultExpanded: true,
        fields: [
          { label: "Department", value: departmentName },
          { label: "Designation", value: selectedProfile.designation ?? "—" },
          { label: "Employment Type", value: selectedProfile.employment_type ?? "—" },
          { label: "Contract Type", value: selectedProfile.contract_type ?? "—" },
          { label: "Last Updated", value: (selectedProfile as UserProfile & { updated_at?: string }).updated_at ? moment((selectedProfile as UserProfile & { updated_at?: string }).updated_at).format(GlobalDateTimeFormat) : "—" },
        ],
      },
    ];
  }, [getDisplayName, mainAppDepartments, selectedProfile]);

  const employeeColumns = useMemo<TableColumn<UserProfile>[]>(
    () => [
      {
        key: "name",
        label: "Employee",
        type: "custom",
        sortable: false,
        render: (profile: UserProfile) => {
          const statusText = String(profile.status ?? "Active");
          const isActive = statusText.toLowerCase() === "active";
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#e0e7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={20} color="#6366f1" />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                  {getDisplayName(profile)}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginTop: "2px",
                    textTransform: "capitalize",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: isActive ? "#10b981" : "#ef4444",
                      display: "inline-block",
                    }}
                  />
                  {statusText}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "user_id",
        label: "Extension",
        type: "text",
        sortable: false,
      },
      {
        key: "identification_number",
        label: "CNIC/ID",
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
        key: "employment_type",
        label: "Employment Type",
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
        key: "department_id",
        label: "Department",
        type: "custom",
        sortable: false,
        render: (profile: UserProfile) => (
          <span style={{ fontSize: "14px", color: "#1f2937" }}>
            {profile.department_id == null
              ? "—"
              : mainAppDepartments.find((d: MainAppDepartment) => Number(d.id) === Number(profile.department_id))?.name ?? String(profile.department_id)}
          </span>
        ),
      },
      {
        key: "phone",
        label: "Phone",
        type: "custom",
        sortable: false,
        render: (profile: UserProfile) => (
          <span style={{ fontSize: "14px", color: "#1f2937" }}>{formatPhoneForDisplay(profile.phone)}</span>
        ),
      },
      {
        key: "status",
        label: "Status",
        type: "custom",
        sortable: false,
        render: (profile: UserProfile) => {
          const statusText = String(profile.status ?? "");
          const isActive = statusText.toLowerCase() === "active";
          return (
            <span
              style={{
                padding: "4px 12px",
                backgroundColor: isActive ? "#d1fae5" : "#fee2e2",
                color: isActive ? "#065f46" : "#991b1b",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: "500",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                textTransform: "capitalize",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isActive ? "#10b981" : "#ef4444",
                }}
              />
              {statusText}
            </span>
          );
        },
      },
      {
        key: "updated_at",
        label: "Last Updated",
        type: "custom",
        sortable: false,
        render: (profile: UserProfile) => (
          <span style={{ fontSize: "14px", color: "#6b7280" }}>
            {(profile as UserProfile & { updated_at?: string }).updated_at
              ? moment((profile as UserProfile & { updated_at?: string }).updated_at).format(GlobalDateTimeFormat)
              : "—"}
          </span>
        ),
      },
    ],
    [getDisplayName, mainAppDepartments],
  );

  const employeeActions = useMemo<TableAction<UserProfile>[]>(
    () => [
      {
        label: "Edit",
        icon: <Pencil size={16} />,
        onClick: (profile: UserProfile) => openEditModal(profile),
        show: () => Boolean(session?.user?.permissions?.includes("update-employee-staff-management")),
        variant: "link",
      },
      {
        label: "Create Journey",
        icon: <Calendar size={16} />,
        onClick: (profile: UserProfile) => openJourneyModal(profile),
        show: () => Boolean(session?.user?.permissions?.includes("update-employee-staff-management")),
        disabled: (profile: UserProfile) => (profile as UserProfile & { journey?: { id?: number } }).journey?.id != null,
        disabledTitle: "Journey already started",
        variant: "link",
      },
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (profile: UserProfile) => handleDeleteClick(profile),
        show: () => Boolean(session?.user?.permissions?.includes("delete-employee-staff-management")),
        variant: "link",
      },
    ],
    [handleDeleteClick, openEditModal, openJourneyModal, session?.user?.permissions],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Employees" />
      <div>
        <div style={{ display: "flex", gap: "0", alignItems: "stretch" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Employee Table - Using GenericTable Component */}
            <GenericTable<UserProfile>
              data={filteredProfiles}
              columns={employeeColumns}
              actions={employeeActions}
              showActions={true}
              actionsLabel="Actions"
              loading={loading}
              loadingMessage="Loading employees..."
              emptyMessage="No employees found"
              hover={true}
              uniqueKey="id"
              pagination={{
                currentPage,
                rowsPerPage,
                totalRows: pagination?.total ?? 0,
                pageSizeOptions: [15, 25, 50, 100],
              }}
              onPaginationChange={handlePaginationChange}
              onPreviewClick={(profile: UserProfile) => {
                handleProfileClick(profile).catch((err) => console.error(err));
              }}
              showToolbar={true}
              showToolbarActions={false}
              toolbar={employeeToolbarConfig}
            />
          </div>

          {selectedProfile && (
            <GenericSidebar
              isOpen={Boolean(selectedProfile)}
              onClose={closeSidebar}
              title={getDisplayName(selectedProfile)}
              subtitle={selectedProfile.designation ?? ""}
              avatar={{
                initials: getDisplayName(selectedProfile).slice(0, 2).toUpperCase(),
                name: getDisplayName(selectedProfile),
                gradient: "#6366f1",
              }}
              sections={employeeSidebarSections}
            />
          )}
        </div>

        {/* Two Column Layout for Charts and Documents */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '24px',
          marginTop: '24px'
        }}>
          {/* Department Headcount Chart */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                Department Headcount
              </h2>
              {/* <button
                onClick={() => console.log('Export chart')}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <Download size={14} />
                Export
              </button> */}
            </div>

            {/* Legend */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              {departmentHeadcountData.map(dept => (
                <div key={dept.rowKey} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: dept.color
                  }}></div>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{dept.name}</span>
                </div>
              ))}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentHeadcountData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]}
                >
                  {departmentHeadcountData.map((entry) => (
                    <Cell key={entry.rowKey} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Additional Info */}
            {/* <div style={{ 
              marginTop: '20px', 
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                backgroundColor: '#6366f1',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                18
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>Engineering</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Money12K</div>
              </div>
            </div> */}
          </div>

          {/* Dashboard counters */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '20px' }}>
              Dashboard overview
            </h2>

            {dashboardCounters == null ? (
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Loading…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Employees */}
                {dashboardCounters.employees && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Employees</div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Total: <strong style={{ color: '#1f2937' }}>{dashboardCounters.employees.total ?? 0}</strong></span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Active: <strong style={{ color: '#059669' }}>{dashboardCounters.employees.active ?? 0}</strong></span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Inactive: <strong style={{ color: '#dc2626' }}>{dashboardCounters.employees.inactive ?? 0}</strong></span>
                    </div>
                  </div>
                )}

                {/* Approvals */}
                {dashboardCounters.approvals && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fffbeb' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Approvals</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Pending: <strong style={{ color: '#1f2937' }}>{dashboardCounters.approvals.pending ?? 0}</strong></span>
                      {dashboardCounters.approvals.aging && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          Aging: 0–3d: {dashboardCounters.approvals.aging["0_3_days"] ?? 0}, 4–7d: {dashboardCounters.approvals.aging["4_7_days"] ?? 0}, 8+d: {dashboardCounters.approvals.aging["8_plus_days"] ?? 0}
                        </span>
                      )}
                      {typeof dashboardCounters.approvals.avg_aging === 'number' && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Avg aging: <strong>{dashboardCounters.approvals.avg_aging.toFixed(1)}</strong> days</span>
                      )}
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Pending leave: {dashboardCounters.approvals.pending_leave ?? 0}, Pending other: {dashboardCounters.approvals.pending_other ?? 0}</span>
                    </div>
                  </div>
                )}

                {/* Leave */}
                {dashboardCounters.leave && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f0fdf4' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Leave</div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>On leave today: <strong style={{ color: '#1f2937' }}>{dashboardCounters.leave.on_leave_today ?? 0}</strong></span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Upcoming 7 days: <strong style={{ color: '#1f2937' }}>{dashboardCounters.leave.upcoming_7_days ?? 0}</strong></span>
                    </div>
                  </div>
                )}

                {/* Journey */}
                {dashboardCounters.journey && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#eff6ff' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Journey</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                      <span>Total: <strong style={{ color: '#1f2937' }}>{dashboardCounters.journey.total ?? 0}</strong></span>
                      <span>In progress: <strong style={{ color: '#2563eb' }}>{dashboardCounters.journey.in_progress ?? 0}</strong></span>
                      <span>On track: {dashboardCounters.journey.on_track ?? 0}</span>
                      <span>Overdue: <strong style={{ color: '#dc2626' }}>{dashboardCounters.journey.overdue ?? 0}</strong></span>
                      <span>Completed: {dashboardCounters.journey.completed ?? 0}</span>
                    </div>
                  </div>
                )}

                {/* Attendance */}
                {dashboardCounters.attendance?.today && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#faf5ff' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Attendance (today)</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                      <span>With record: {dashboardCounters.attendance.today.with_record ?? 0}</span>
                      <span>Checked in: {dashboardCounters.attendance.today.checked_in ?? 0}</span>
                      <span>Checked out: {dashboardCounters.attendance.today.checked_out ?? 0}</span>
                      <span>No record (est.): {dashboardCounters.attendance.today.no_record_estimate ?? 0}</span>
                    </div>
                  </div>
                )}

                {/* Compliance alerts */}
                {dashboardCounters.compliance_alerts && (
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fef2f2' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Compliance alerts</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#6b7280' }}>
                      <span>High: <strong style={{ color: '#dc2626' }}>{dashboardCounters.compliance_alerts.high ?? 0}</strong></span>
                      <span>Medium: <strong style={{ color: '#d97706' }}>{dashboardCounters.compliance_alerts.medium ?? 0}</strong></span>
                      <span>Low: <strong style={{ color: '#059669' }}>{dashboardCounters.compliance_alerts.low ?? 0}</strong></span>
                      <span>Total: <strong style={{ color: '#1f2937' }}>{dashboardCounters.compliance_alerts.total ?? 0}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddEmployeeModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={refreshAfterProfileSave}
        tenantId={companyIdentifier ?? undefined}
      />

      {/* Create Journey Modal */}
      <Modal show={showJourneyModal} onHide={closeJourneyModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create Journey</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {journeyModalProfile && (
            <>
              <Form.Group className="mb-3">
                {/* <Form.Label className="text-muted small">Employee</Form.Label> */}
                <div style={{ fontWeight: 600, color: "#1f2937", marginBottom: "2px" }}>
                  Create journey for: {getDisplayName(journeyModalProfile)}
                </div>
               
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  min={journeyStartDateMinIso(journeyModalProfile)}
                  value={journeyForm.startDate}
                  onChange={(e) => {
                    const next = e.target.value;
                    const minStart = journeyStartDateMinIso(journeyModalProfile);
                    if (next !== "" && next < minStart) {
                      toast.warn("Start date cannot be before the employee was created or before today.");
                      return;
                    }
                    setJourneyForm((f) => ({ ...f, startDate: next }));
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={journeyForm.status}
                  onChange={(e) => setJourneyForm((f) => ({ ...f, status: e.target.value }))}
                 
                >
                  <option value="in_progress">In Progress</option>
                  <option value="on_track">On Track</option>
                  <option value="overdue">Overdue</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeJourneyModal} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="button" onClick={handleCreateJourney} disabled={journeySubmitting}>
            {journeySubmitting ? "Creating…" : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>

      <EditEmployeeModal
        show={showEditModal}
        onHide={() => { setShowEditModal(false); setEditingProfile(null); }}
        profile={editingProfile}
        onSuccess={(id: number) => {
          refreshAfterProfileSave();
          if (selectedProfile?.id === id) setSelectedProfile(null);
        }}
      />

      {/* Delete confirmation */}
      <DeleteConfirmationModal
        show={showDeleteModal && !!profileToDelete}
        onHide={() => { setShowDeleteModal(false); setProfileToDelete(null); }}
        onConfirm={handleDeleteConfirm}
        itemName={profileToDelete ? getDisplayName(profileToDelete) : undefined}
        itemType="employee"
        loading={deleting}
      />
    </React.Fragment>
  );
};

Employees.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Employees;
