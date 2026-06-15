import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Layout from "@layout/index";
import GenericSidebar, { SidebarSection } from "@components/GenericSidebarNew";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import AddEmployeeModal from "@page-modules/workforce/AddEmployeeModal";
import EditEmployeeModal from "@page-modules/workforce/EditEmployeeModal";

import {
  createJourney,
  deleteUserProfile,
  getUserProfile,
  type UserProfile,
} from "@utils/staffManagement";
import { useMainAppLookups, type MainAppDepartmentLookup } from "@hooks/useMainAppLookups";
import { toast } from "react-toastify";
import GenericTable, { FilterPill, TabConfig, ToolbarConfig } from "@components/GenericTable";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import { Plus } from "lucide-react";
import moment from "moment";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { formatPhoneForDisplay } from "@utils/phoneDisplay";
import { HEADER_CONSTANTS } from "@constants/headerConstants";

import { workforceKeys } from "@query/keys";
import {
  EMPLOYEE_STATUS_OPTIONS,
  EMPLOYMENT_TYPES,
  CONTRACT_TYPES,
  EMPLOYEES_ITEMS_PER_PAGE,
  EMPLOYEE_JOURNEY_CREATE_PERMISSIONS,
  hierarchyLabel,
  userIdForProfilePayload,
  buildDepartmentHeadcountChartRows,
  journeyStartDateMinIso,
  type EmployeesListAppliedFilters,
} from "@page-modules/workforce/employees/employeesDomain";
import { useEmployeesListQuery } from "@page-modules/workforce/employees/useEmployeesListQuery";
import {
  useEmployeesDepartmentHeadcountQuery,
  useEmployeesDashboardCountersQuery,
} from "@page-modules/workforce/employees/useEmployeesAnalyticsQueries";
import { buildEmployeeTableColumns } from "@page-modules/workforce/employees/employeesTableConfig";
import UsersPillDropdownContent from "@page-modules/workforce/employees/partials/UsersPillDropdownContent";
import EmployeesDepartmentHeadcountPanel from "@page-modules/workforce/employees/partials/EmployeesDepartmentHeadcountPanel";
import EmployeesDashboardOverviewPanel from "@page-modules/workforce/employees/partials/EmployeesDashboardOverviewPanel";
import CreateJourneyModal from "@page-modules/workforce/employees/partials/CreateJourneyModal";
import { WorkforceListPageShell } from "@page-modules/workforce/shared/WorkforceListPageShell";
import {
  WorkforceFixedActionBar,
  WorkforceProspectsPrimaryButton,
} from "@page-modules/workforce/shared/WorkforceProspectsTheme";
import {
  EMPLOYEES_LIST_SCOPED_LAYOUT,
  WORKFORCE_TOOLBAR_LABELS,
  workforceModuleToolbarDropdown,
} from "@page-modules/workforce/shared/workforceListPageConfig";
import { renderApplyFilterActions } from "@utils/communicationsStagedFilters";

import { usePermissions } from "@utils/permissionUtils";

import "@page-modules/workforce/shared/workforcePages.scss";
import "@page-modules/workforce/employees/employeesPage.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;

const Employees = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission, hasAnyPermission, isAdmin } = usePermissions();
  const { mainAppDepartments, mainAppUsers, companyIdentifier, loadingUsers } = useMainAppLookups();

  const canViewAllCompanyEmployees = useMemo(
    () => hasPermission(PERMISSIONS.VIEW_ALL_COMPANY_EMPLOYEES_STAFF_MANAGEMENT),
    [hasPermission],
  );

  const mainAppUserPhones = useMemo(
    () =>
      (mainAppUsers ?? [])
        .map((u) => String(u.phone ?? "").trim())
        .filter((p) => p.length > 0),
    [mainAppUsers],
  );

  const employeesListScope = useMemo(
    () => ({
      canViewAllCompanyEmployees,
      mainAppUserPhones,
      mainAppUsers: mainAppUsers ?? [],
      loadingUsers,
    }),
    [canViewAllCompanyEmployees, mainAppUserPhones, mainAppUsers, loadingUsers],
  );

  const refreshWorkforceQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: workforceKeys.employees.all() });
    queryClient.invalidateQueries({ queryKey: workforceKeys.dashboard.all() });
  }, [queryClient]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedManagerIds, setSelectedManagerIds] = useState<string[]>([]);
  const [selectedEmploymentType, setSelectedEmploymentType] = useState("");
  const [selectedContract, setSelectedContract] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedDepartment, setAppliedDepartment] = useState("");
  const [appliedLocationId, setAppliedLocationId] = useState<number | null>(null);
  const [appliedStatus, setAppliedStatus] = useState("");
  const [appliedEmploymentType, setAppliedEmploymentType] = useState("");
  const [appliedContract, setAppliedContract] = useState("");
  const [appliedManagerIds, setAppliedManagerIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(EMPLOYEES_ITEMS_PER_PAGE);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<UserProfile | null>(null);

  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [journeyModalProfile, setJourneyModalProfile] = useState<UserProfile | null>(null);
  const [journeyForm, setJourneyForm] = useState<{ startDate: string; status: string }>({
    startDate: "",
    status: "in_progress",
  });

  const listFilters = useMemo<EmployeesListAppliedFilters>(
    () => ({
      appliedSearch,
      appliedDepartment,
      appliedLocationId,
      appliedStatus,
      appliedEmploymentType,
      appliedContract,
      appliedManagerIds,
    }),
    [
      appliedSearch,
      appliedDepartment,
      appliedLocationId,
      appliedStatus,
      appliedEmploymentType,
      appliedContract,
      appliedManagerIds,
    ],
  );

  const { data: listResult, isFetching: listFetching } = useEmployeesListQuery({
    page: currentPage,
    limit: rowsPerPage,
    filters: listFilters,
    scope: employeesListScope,
  });

  const profiles = listResult?.data ?? [];
  const pagination = listResult?.pagination ?? null;

  const { data: departmentHeadcountRaw = [] } = useEmployeesDepartmentHeadcountQuery();
  const { data: dashboardCounters, isPending: countersPending } = useEmployeesDashboardCountersQuery();

  const departmentHeadcountData = useMemo(
    () => buildDepartmentHeadcountChartRows(departmentHeadcountRaw, mainAppDepartments ?? []),
    [departmentHeadcountRaw, mainAppDepartments],
  );

  const openIdNum = useMemo(() => {
    if (!router.isReady) return null;
    const raw = router.query.openId;
    let s: string | undefined;
    if (typeof raw === "string") {
      s = raw;
    } else if (Array.isArray(raw)) {
      s = raw[0];
    }
    if (!s || Number.isNaN(Number(s))) return null;
    return Number(s);
  }, [router.isReady, router.query.openId]);

  const { data: profileFromOpenId } = useQuery({
    queryKey: workforceKeys.employees.profileDetail(openIdNum ?? 0),
    queryFn: () => {
      if (openIdNum == null) {
        return Promise.reject(new Error("Employees openId query ran without openIdNum"));
      }
      return getUserProfile(openIdNum);
    },
    enabled: router.isReady && openIdNum != null,
  });

  useEffect(() => {
    if (!router.isReady || openIdNum == null || profileFromOpenId == null) return;
    setSelectedProfile(profileFromOpenId);
    const { openId: _o, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
  }, [router, router.isReady, openIdNum, profileFromOpenId]);

  const closeJourneyModal = useCallback(() => {
    setShowJourneyModal(false);
    setJourneyModalProfile(null);
    setJourneyForm({ startDate: "", status: "in_progress" });
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUserProfile(id),
    onSuccess: (_, deletedId) => {
      toast.success("Employee deleted");
      setShowDeleteModal(false);
      setProfileToDelete(null);
      if (selectedProfile?.id === deletedId) setSelectedProfile(null);
      refreshWorkforceQueries();
    },
    onError: (err) => console.error("[Employees] deleteUserProfile error", err),
  });

  const createJourneyMutation = useMutation({
    mutationFn: createJourney,
    onSuccess: () => {
      toast.success("Journey created successfully.");
      refreshWorkforceQueries();
      closeJourneyModal();
    },
    onError: (err) => console.error("[Employees] createJourney error", err),
  });

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

  const handleProfileClick = useCallback(
    async (profile: UserProfile) => {
      try {
        const fullProfile = await queryClient.fetchQuery({
          queryKey: workforceKeys.employees.profileDetail(profile.id),
          queryFn: () => getUserProfile(profile.id),
        });
        setSelectedProfile(fullProfile);
      } catch (err) {
        console.error("[Employees] getUserProfile error", err);
        setSelectedProfile(profile);
      }
    },
    [queryClient],
  );

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

  const handleCreateJourney = useCallback(() => {
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
        (mainAppDepartments ?? []).find((d: MainAppDepartmentLookup) => Number(d.id) === Number(departmentId))
          ?.name ?? "";
    }
    const payload = {
      user_profile_id: journeyModalProfile.id,
      user_id: String(journeyModalProfile.user_id ?? ""),
      job_title: journeyModalProfile.job_title ?? "",
      department_name: departmentName,
      start_date: startDate,
      status: journeyForm.status,
    };
    createJourneyMutation.mutate(payload);
  }, [createJourneyMutation, journeyForm, journeyModalProfile, mainAppDepartments]);

  const getDisplayName = useCallback(
    (p: UserProfile): string => {
      const userId = p.user_id ?? (p as UserProfile & { extension_number?: string }).extension_number ?? p.employee_code;
      if (userId != null && (mainAppUsers?.length ?? 0) > 0) {
        const uid = String(userId);
        const mainUser =
          mainAppUsers?.find((u) => String(u.phone) === uid) ?? mainAppUsers?.find((u) => String(u.id) === uid);
        if (mainUser?.name) return mainUser.name;
      }
      return String((p as UserProfile & { name?: string }).name ?? p.user_id ?? p.employee_code ?? p.id ?? "—");
    },
    [mainAppUsers],
  );

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

  const handleDeleteConfirm = useCallback(() => {
    if (!profileToDelete) return;
    deleteMutation.mutate(profileToDelete.id);
  }, [deleteMutation, profileToDelete]);

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

  const hasUnappliedFilterChanges = useMemo(
    () =>
      searchTerm !== appliedSearch ||
      selectedDepartment !== appliedDepartment ||
      selectedLocationId !== appliedLocationId ||
      selectedStatus !== appliedStatus ||
      selectedEmploymentType !== appliedEmploymentType ||
      selectedContract !== appliedContract ||
      JSON.stringify(selectedManagerIds) !== JSON.stringify(appliedManagerIds),
    [
      searchTerm,
      appliedSearch,
      selectedDepartment,
      appliedDepartment,
      selectedLocationId,
      appliedLocationId,
      selectedStatus,
      appliedStatus,
      selectedEmploymentType,
      appliedEmploymentType,
      selectedContract,
      appliedContract,
      selectedManagerIds,
      appliedManagerIds,
    ],
  );

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        appliedSearch ||
          appliedDepartment ||
          appliedLocationId != null ||
          appliedStatus ||
          appliedEmploymentType ||
          appliedContract ||
          appliedManagerIds.length > 0,
      ),
    [
      appliedSearch,
      appliedDepartment,
      appliedLocationId,
      appliedStatus,
      appliedEmploymentType,
      appliedContract,
      appliedManagerIds,
    ],
  );

  const employeeTabs = useMemo<TabConfig[]>(
    () => [{ id: "employees", label: "Employees", count: pagination?.total ?? 0, removable: false }],
    [pagination?.total],
  );

  const managerNames = useMemo(() => {
    return appliedManagerIds
      .map((uid) => mainAppUsers?.find((u) => userIdForProfilePayload(u) === uid)?.name ?? uid)
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
      ? departments.find((d) => String(d.id) === deptFilterKey)
      : undefined;
    let departmentActiveLabel = "";
    if (deptFilterKey) {
      departmentActiveLabel = matchedDepartment ? hierarchyLabel(matchedDepartment) : deptFilterKey;
    }

    const departmentOptions = departments.map((dept, idx: number) => {
      const label = hierarchyLabel(dept);
      const deptId = String(dept.id ?? "");
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
        activeLabel:
          selectedManagerIds.length > 0
            ? selectedManagerIds
                .map((uid) => mainAppUsers?.find((u) => userIdForProfilePayload(u) === uid)?.name ?? uid)
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
    renderUsersDropdown,
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
      ...workforceModuleToolbarDropdown(WORKFORCE_TOOLBAR_LABELS.employees),
      showFiltersButton: true,
      showFilterPills: true,
      filterPills: employeeFilterPills,
      showMoreFiltersButton: false,
      clearAllFilters: hasActiveFilters ? resetFilters : undefined,
      filterPillsRightActions: renderApplyFilterActions(
        hasUnappliedFilterChanges,
        handleApply,
        "employees",
      ),
    }),
    [
      employeeFilterPills,
      employeeTabs,
      handleApply,
      hasActiveFilters,
      hasUnappliedFilterChanges,
      resetFilters,
      searchTerm,
    ],
  );

  const isWorkforceAdmin = isAdmin();
  const canAddEmployee =
    isWorkforceAdmin || hasPermission(PERMISSIONS.ADD_EMPLOYEE_STAFF_MANAGEMENT);
  const canEditEmployee =
    isWorkforceAdmin || hasPermission(PERMISSIONS.UPDATE_EMPLOYEE_STAFF_MANAGEMENT);
  const canCreateEmployeeJourney =
    isWorkforceAdmin ||
    hasAnyPermission([...EMPLOYEE_JOURNEY_CREATE_PERMISSIONS]);
  const canDeleteEmployee =
    isWorkforceAdmin || hasPermission(PERMISSIONS.DELETE_EMPLOYEE_STAFF_MANAGEMENT);

  const employeeTableActions = useMemo(
    () => ({
      canEdit: canEditEmployee,
      canCreateJourney: canCreateEmployeeJourney,
      canDelete: canDeleteEmployee,
      openEditModal,
      openJourneyModal,
      handleDeleteClick,
    }),
    [
      canCreateEmployeeJourney,
      canDeleteEmployee,
      canEditEmployee,
      handleDeleteClick,
      openEditModal,
      openJourneyModal,
    ],
  );

  const employeeSidebarSections = useMemo<SidebarSection[]>(() => {
    if (!selectedProfile) return [];
    const departmentName =
      selectedProfile.department_id == null
        ? "—"
        : departments.find((d) => Number(d.id) === Number(selectedProfile.department_id))?.name ??
          String(selectedProfile.department_id);

    return [
      {
        id: "employee-overview",
        title: "Employee Overview",
        defaultExpanded: true,
        fields: [
          { label: "Name", value: getDisplayName(selectedProfile) },
          { label: "Extension", value: selectedProfile.user_id ?? "—" },
          { label: "Phone", value: formatPhoneForDisplay(selectedProfile.phone ?? "") || "—", type: "phone" },
          {
            label: "Status",
            value: selectedProfile.status ?? "—",
            type: "badge",
            badgeVariant: String(selectedProfile.status ?? "").toLowerCase() === "active" ? "success" : "danger",
          },
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
          {
            label: "Last Updated",
            value: (selectedProfile as UserProfile & { updated_at?: string }).updated_at
              ? moment((selectedProfile as UserProfile & { updated_at?: string }).updated_at).format(GlobalDateTimeFormat)
              : "—",
          },
        ],
      },
    ];
  }, [getDisplayName, departments, selectedProfile]);

  const employeeColumns = useMemo(
    () =>
      buildEmployeeTableColumns({
        getDisplayName,
        departments,
        tableActions: employeeTableActions,
      }),
    [departments, employeeTableActions, getDisplayName],
  );

  return (
    <React.Fragment>
      <WorkforceListPageShell
        breadcrumbSubTitle="Employees"
        tableWrapperClass="workforce-employees-table-wrapper"
        scopedLayout={EMPLOYEES_LIST_SCOPED_LAYOUT}
        fixedActions={
          canAddEmployee ? (
            <WorkforceFixedActionBar>
              <WorkforceProspectsPrimaryButton onClick={openCreateModal}>
                <Plus size={16} />
                Add Employee
              </WorkforceProspectsPrimaryButton>
            </WorkforceFixedActionBar>
          ) : undefined
        }
        footer={
          <div className="employees-page__charts-grid">
            <EmployeesDepartmentHeadcountPanel chartRows={departmentHeadcountData} />
            <EmployeesDashboardOverviewPanel counters={dashboardCounters} loading={countersPending} />
          </div>
        }
      >
        <div className="employees-page__layout-row">
          <div className="employees-page__main">
            <GenericTable<UserProfile>
              data={profiles}
              columns={employeeColumns}
              showActions={false}
              loading={listFetching}
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
                gradient: "#0066CC",
              }}
              sections={employeeSidebarSections}
            />
          )}
        </div>
      </WorkforceListPageShell>

      <AddEmployeeModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={refreshWorkforceQueries}
        tenantId={companyIdentifier ?? undefined}
      />

      <CreateJourneyModal
        show={showJourneyModal}
        onHide={closeJourneyModal}
        profile={journeyModalProfile}
        journeyForm={journeyForm}
        setJourneyForm={setJourneyForm}
        submitting={createJourneyMutation.isPending}
        onSubmit={handleCreateJourney}
        getDisplayName={getDisplayName}
      />

      <EditEmployeeModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setEditingProfile(null);
        }}
        profile={editingProfile}
        onSuccess={(id: number) => {
          refreshWorkforceQueries();
          if (selectedProfile?.id === id) setSelectedProfile(null);
        }}
      />

      <DeleteConfirmationModal
        show={showDeleteModal && !!profileToDelete}
        onHide={() => {
          setShowDeleteModal(false);
          setProfileToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        itemName={profileToDelete ? getDisplayName(profileToDelete) : undefined}
        itemType="employee"
        loading={deleteMutation.isPending}
      />
    </React.Fragment>
  );
};

Employees.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Employees;
