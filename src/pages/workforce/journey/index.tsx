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

import { getJourneys } from "@utils/staffManagement";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { ChevronRight } from "lucide-react";
import OnboardingDetailSidebar from "./sidebar";

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
    contract_type?: string;
    employment_type?: string;
    [key: string]: unknown;
  };
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

const EMPLOYMENT_TYPES = ["Full-Time", "Part-Time", "Contract", "Internship", "Freelance", "Temporary"];
const CONTRACT_TYPES = ["Permanent", "Temporary", "Freelance", "Fixed-term", "Probation"];

const ITEMS_PER_PAGE = 15;

const getInitials = (name: string): string => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (words.length === 0) return "NA";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const getAvatarColor = (name: string): string => {
  let hash = 0;
  for (const ch of name) {
    const code = ch.codePointAt(0) ?? 0;
    hash = code + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsla(${hue}, 55%, 45%, 0.6)`;
};

function journeyUsersPillLabel(selectedCount: number, appliedCount: number): string | undefined {
  if (selectedCount > 0) return `${selectedCount} selected`;
  if (appliedCount > 0) return `${appliedCount} selected`;
  return undefined;
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

const EmployeesOnboarding = () => {
  const { mainAppUsers, companyIdentifier } = useMainAppLookups();
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedContract, setSelectedContract] = useState("");
  const [appliedEmploymentType, setAppliedEmploymentType] = useState("");
  const [appliedContract, setAppliedContract] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [appliedUserIds, setAppliedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const [selectedEmployee, setSelectedEmployee] = useState<OnboardingEmployee | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const users = useMemo(() => (mainAppUsers ?? []) as LookupUser[], [mainAppUsers]);
  const managers = users;
  const [journeysData, setJourneysData] = useState<JourneyRecord[]>([]);
  const [journeysPagination, setJourneysPagination] = useState<JourneysPagination | null>(null);
  const [loadingJourneys, setLoadingJourneys] = useState(true);
  const [refreshJourneysKey, setRefreshJourneysKey] = useState(0);

  const toggleSelectedUserId = useCallback((idStr: string, isSelected: boolean) => {
    setSelectedUserIds((prev) => {
      if (isSelected) return prev.filter((id) => id !== idStr);
      return [...prev, idStr];
    });
  }, []);

  const filteredManagers = useMemo(() => {
    const needle = userSearchTerm.trim().toLowerCase();
    if (!needle) return managers;
    return managers.filter((mgr) => hierarchyLabel(mgr).toLowerCase().includes(needle));
  }, [managers, userSearchTerm]);

  useEffect(() => {
    if (!companyIdentifier) return;
    const fetchJourneys = async () => {
      setLoadingJourneys(true);
      try {
        const params: { page: number; limit: number; search?: string; employment_type?: string; contract_type?: string; user_ids?: string[] } = {
          page: currentPage,
          limit: rowsPerPage,
        };
        if (appliedSearch?.trim()) params.search = appliedSearch.trim();
        if (appliedEmploymentType?.trim()) params.employment_type = appliedEmploymentType.trim();
        if (appliedContract?.trim()) params.contract_type = appliedContract.trim();
        if (appliedUserIds.length > 0) params.user_ids = appliedUserIds;
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
    refreshJourneysKey,
    appliedSearch,
    appliedEmploymentType,
    appliedContract,
    appliedUserIds,
  ]);

  useEffect(() => {
    if (companyIdentifier) return;
    setLoadingJourneys(false);
  }, [companyIdentifier]);

  const employees: OnboardingEmployee[] = useMemo(() => {
    return journeysData.map((j) => {
      const userId = j.user_id == null ? "" : String(j.user_id).trim();
      const name =
        users.find((u) => String(u.phone ?? "").trim() === userId || String(u.id) === userId)?.name ??
        (userId || "—");
      const statusKey = (j.status ?? "in_progress").toLowerCase().replaceAll(/\s/g, "_");
      const status: OnboardingEmployee["status"] =
        STATUS_DISPLAY[statusKey] ?? "In Progress";
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
        total_steps_count: j.total_steps_count,
        completed_steps_count: j.completed_steps_count,
        contract_type:
          contractRaw != null && String(contractRaw).trim() !== "" ? String(contractRaw).trim() : undefined,
        employment_type:
          employmentRaw != null && String(employmentRaw).trim() !== "" ? String(employmentRaw).trim() : undefined,
      };
    });
  }, [journeysData, users]);

  const handleApply = () => {
    setAppliedSearch(searchTerm);
    setAppliedEmploymentType(selectedEmploymentType);
    setAppliedContract(selectedContract);
    setAppliedUserIds(selectedUserIds);
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
    setSelectedEmploymentType("");
    setAppliedEmploymentType("");
    setSelectedContract("");
    setAppliedContract("");
    setSelectedUserIds([]);
    setAppliedUserIds([]);
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
        label: "Stages",
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

  const usersDropdownContent = useMemo(
    () => (
      <div style={{ minWidth: "260px", maxHeight: "320px", overflow: "hidden" }}>
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
        <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "8px" }}>
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
    () => [
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
    ],
    [
      appliedEmploymentType,
      appliedContract,
      appliedUserIds,
      selectedEmploymentType,
      selectedContract,
      selectedUserIds,
      employmentFilterOptions,
      contractFilterOptions,
      usersDropdownContent,
    ],
  );

  const onboardingToolbar = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: searchTerm,
      searchPlaceholder: "Search employee (extension/designation/department)...",
      onSearchChange: setSearchTerm,
      onSearch: handleApply,
      showFilterPills: true,
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
    [searchTerm, filterPills],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Employees Journey" />
      <div>
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <h1 style={{
              fontSize: "28px",
              fontWeight: "600",
              color: "#111827",
              margin: 0
            }}>Employees Journey</h1>
          </div>

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
            showToolbar={true}
            toolbar={onboardingToolbar}
            showToolbarActions={false}
          />

          {(appliedSearch.trim() || appliedEmploymentType || appliedContract || appliedUserIds.length > 0) && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
              {appliedSearch.trim() ? `Search: ${appliedSearch} | ` : ""}
              {appliedEmploymentType ? `Employment: ${appliedEmploymentType} | ` : ""}
              {appliedContract ? `Contract: ${appliedContract} | ` : ""}
              {appliedUserIds.length > 0 ? `Users: ${appliedUserNames}` : ""}
            </div>
          )}
        </div>
  
        {/* Sidebar Overlay */}
        {isSidebarOpen && selectedEmployee && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <button
              type="button"
              aria-label="Close onboarding sidebar"
              onClick={() => {
                setIsSidebarOpen(false);
                setSelectedEmployee(null);
              }}
              style={{
                position: "absolute",
                inset: 0,
                border: "none",
                padding: 0,
                margin: 0,
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                cursor: "pointer",
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 1000,
              }}
            >
              <OnboardingDetailSidebar
                employee={selectedEmployee}
                onClose={() => {
                  setIsSidebarOpen(false);
                  setSelectedEmployee(null);
                }}
                onRefreshJourneys={() => setRefreshJourneysKey((k) => k + 1)}
              />
            </div>
          </div>
        )}
      </div>
     
    </React.Fragment>
  );
};

EmployeesOnboarding.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EmployeesOnboarding;
