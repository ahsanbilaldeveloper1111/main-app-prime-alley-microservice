import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Layout from "@layout/index";
import GenericTable, { FilterPill, ToolbarConfig } from "@components/GenericTable";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import {
  deleteJourney,
  deleteJourneyStep,
  updateJourney,
} from "@utils/staffManagement";
import {
  useMainAppLookups,
  type MainAppDepartmentLookup,
  type MainAppUserLookup,
} from "@hooks/useMainAppLookups";
import GenericSidebar from "@components/GenericSidebarNew";
import { JOURNEY_STATUS_OPTIONS } from "@utils/workforce/journeyStatusOptions";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { getAvatarColor, getInitials } from "@utils/workforceUserAvatar";
import { WorkforceUserMultiSelectDropdown } from "@components/workforce/WorkforceUserMultiSelectDropdown";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { workforceKeys } from "@query/keys";

import { hierarchyLabel } from "@page-modules/workforce/employees/employeesDomain";
import { WorkforceListPageShell } from "@page-modules/workforce/shared/WorkforceListPageShell";
import { renderApplyFilterActions } from "@utils/communicationsStagedFilters";
import {
  CONTRACT_TYPES,
  EMPLOYMENT_TYPES,
  ITEMS_PER_PAGE,
  STATUS_DISPLAY,
  filterJourneyManagers,
  getDepartmentFilterLabel,
  getJourneySidebarQuickActions,
  getJourneyStatusLabel,
  hasAppliedJourneyFilters,
  isEmployeeJourneyDisplayCompleted,
  mapJourneyRecordsToEmployees,
  pickActiveLabel,
  reconcileSelectedEmployeeProgress,
  statusDisplayToApiValue,
  toggleSelectedJourneyUserIds,
  type JourneyListAppliedFilters,
  type JourneyStepRecord,
  type JourneysPagination,
  type OnboardingEmployee,
} from "@page-modules/workforce/journey/journeyDomain";
import { buildJourneySidebarSections } from "@page-modules/workforce/journey/buildJourneySidebarSections";
import { buildJourneyFilterPills } from "@page-modules/workforce/journey/journeyFilterPills";
import { buildOnboardingActions, buildOnboardingColumns } from "@page-modules/workforce/journey/journeyTableConfig";
import { useJourneysListQuery } from "@page-modules/workforce/journey/useJourneysListQuery";
import { useJourneyDetailQuery } from "@page-modules/workforce/journey/useJourneyDetailQuery";
import AddJourneyStepModal from "@page-modules/workforce/journey/partials/AddJourneyStepModal";
import EditJourneyStepModal from "@page-modules/workforce/journey/partials/EditJourneyStepModal";

import "@page-modules/workforce/shared/workforcePages.scss";
import "@page-modules/workforce/journey/journeyPage.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;

function deletingStepIdFromMutationState(
  isPending: boolean,
  variables: { sid: number } | undefined,
): number | null {
  if (!isPending || variables == null) return null;
  return variables.sid;
}

function nextRowsPerPageAfterPaginationChange(
  page: number,
  limit: number,
  prevLimit: number,
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>,
): number {
  if (prevLimit !== limit) {
    setCurrentPage(1);
    return limit;
  }
  setCurrentPage(page);
  return prevLimit;
}

function genericTablePaginationFromJourneys(
  journeysPagination: JourneysPagination | null,
  currentPage: number,
  rowsPerPage: number,
):
  | {
      currentPage: number;
      rowsPerPage: number;
      totalRows: number;
      pageSizeOptions: number[];
    }
  | undefined {
  if (journeysPagination == null) return undefined;
  return {
    currentPage: journeysPagination.page ?? currentPage,
    rowsPerPage: journeysPagination.limit ?? rowsPerPage,
    totalRows: journeysPagination.total ?? 0,
    pageSizeOptions: [15, 25, 50, 100],
  };
}

function employeeAfterStatusUpdate(
  prev: OnboardingEmployee | null,
  apiStatus: string,
): OnboardingEmployee | null {
  if (!prev) return prev;
  const displayStatus = STATUS_DISPLAY[apiStatus] ?? prev.status;
  return { ...prev, status: displayStatus };
}

function deleteStepModalItemName(step: JourneyStepRecord | null): string {
  const trimmed = step?.title?.trim();
  if (trimmed) return `step "${trimmed}"`;
  return "this journey step";
}

function deleteJourneyModalItemName(employee: OnboardingEmployee | null): string {
  if (employee) return `onboarding journey for ${employee.name}`;
  return "this journey";
}

function confirmDeleteStepIfAllowed(args: {
  canDelete: boolean;
  stepId: number | null | undefined;
  journeyId: number;
  closeModal: () => void;
  mutate: (payload: { jid: number; sid: number }) => void;
}): void {
  const { canDelete, stepId, journeyId, closeModal, mutate } = args;
  if (!canDelete || stepId == null) {
    closeModal();
    return;
  }
  mutate({ jid: journeyId, sid: stepId });
}

type JourneyAppliedFiltersSummaryProps = {
  appliedSearch: string;
  appliedDepartment: string;
  appliedDepartmentLabel: string;
  appliedEmploymentType: string;
  appliedContract: string;
  appliedStatus: string;
  appliedStatusLabel: string;
  appliedUserIds: string[];
  appliedUserNames: string;
};

function JourneyAppliedFiltersSummary(props: Readonly<JourneyAppliedFiltersSummaryProps>) {
  const {
    appliedSearch,
    appliedDepartment,
    appliedDepartmentLabel,
    appliedEmploymentType,
    appliedContract,
    appliedStatus,
    appliedStatusLabel,
    appliedUserIds,
    appliedUserNames,
  } = props;
  return (
    <div className="journey-page__applied-summary">
      {appliedSearch.trim() ? `Search: ${appliedSearch} | ` : ""}
      {appliedDepartment ? `Department: ${appliedDepartmentLabel} | ` : ""}
      {appliedEmploymentType ? `Employment: ${appliedEmploymentType} | ` : ""}
      {appliedContract ? `Contract: ${appliedContract} | ` : ""}
      {appliedStatus ? `Status: ${appliedStatusLabel} | ` : ""}
      {appliedUserIds.length > 0 ? `Users: ${appliedUserNames}` : ""}
    </div>
  );
}

const EmployeesOnboarding = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { mainAppUsers, mainAppDepartments, companyIdentifier } = useMainAppLookups();

  const invalidateJourneyQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: workforceKeys.journey.all() });
  }, [queryClient]);

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
  const [showAddStepForm, setShowAddStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState<JourneyStepRecord | null>(null);
  const [showDeleteJourneyModal, setShowDeleteJourneyModal] = useState(false);
  const [showDeleteStepModal, setShowDeleteStepModal] = useState(false);
  const [stepPendingDelete, setStepPendingDelete] = useState<JourneyStepRecord | null>(null);

  const users = mainAppUsers;
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

  const listFilters = useMemo<JourneyListAppliedFilters>(
    () => ({
      appliedSearch,
      appliedDepartment,
      appliedEmploymentType,
      appliedContract,
      appliedUserIds,
      appliedStatus,
    }),
    [
      appliedSearch,
      appliedDepartment,
      appliedEmploymentType,
      appliedContract,
      appliedUserIds,
      appliedStatus,
    ],
  );

  const { data: journeysPayload, isFetching: journeysFetching } = useJourneysListQuery({
    enabled: Boolean(companyIdentifier),
    page: currentPage,
    limit: rowsPerPage,
    filters: listFilters,
  });

  const journeysData = journeysPayload?.data ?? [];
  const journeysPagination = journeysPayload?.pagination ?? null;

  const journeyDetailQuery = useJourneyDetailQuery(journeyId, journeyIdValid);
  const journeySteps = journeyDetailQuery.data?.steps ?? [];
  const stepsLoading = journeyIdValid && journeyDetailQuery.isPending;

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

  useEffect(() => {
    setStatusValue(statusDisplayToApiValue(selectedEmployee?.status ?? "In Progress"));
  }, [selectedEmployee?.id, selectedEmployee?.status]);

  const updateJourneyStatusMutation = useMutation({
    mutationFn: ({ jid, status }: { jid: number; status: string }) => updateJourney(jid, { status }),
    onSuccess: (_data, variables) => {
      setStatusValue(variables.status);
      setSelectedEmployee((prev) => employeeAfterStatusUpdate(prev, variables.status));
      toast.success("Status updated.");
      invalidateJourneyQueries();
    },
    onError: (error: unknown) => console.error("[WorkforceJourney] updateJourney failed", error),
  });

  const deleteJourneyMutation = useMutation({
    mutationFn: (jid: number) => deleteJourney(jid),
    onSuccess: () => {
      toast.success("Journey deleted.");
      setShowDeleteJourneyModal(false);
      setIsSidebarOpen(false);
      setSelectedEmployee(null);
      invalidateJourneyQueries();
    },
    onError: (error: unknown) => console.error("[WorkforceJourney] deleteJourney failed", error),
  });

  const deleteStepMutation = useMutation({
    mutationFn: ({ jid, sid }: { jid: number; sid: number }) => deleteJourneyStep(jid, sid),
    onSuccess: () => {
      toast.success("Step deleted.");
      closeDeleteStepModal();
      invalidateJourneyQueries();
    },
    onError: (error: unknown) => console.error("[WorkforceJourney] deleteJourneyStep failed", error),
  });

  const toggleSelectedUserId = useCallback((idStr: string, isSelected: boolean) => {
    setSelectedUserIds((prev) => toggleSelectedJourneyUserIds(prev, idStr, isSelected));
  }, []);

  const filteredManagers = useMemo(
    () => filterJourneyManagers(managers, userSearchTerm),
    [managers, userSearchTerm],
  );

  const handleStatusChange = useCallback(
    async (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!canUpdateJourneyRecord || isJourneyCompleted) return;
      updateJourneyStatusMutation.mutate({ jid: journeyId, status: e.target.value });
    },
    [canUpdateJourneyRecord, isJourneyCompleted, journeyId, updateJourneyStatusMutation],
  );

  const openDeleteStepModal = useCallback((step: JourneyStepRecord) => {
    if (step.id == null) return;
    setStepPendingDelete(step);
    setShowDeleteStepModal(true);
  }, []);

  const closeDeleteStepModal = useCallback(() => {
    setShowDeleteStepModal(false);
    setStepPendingDelete(null);
  }, []);

  const confirmDeleteStep = useCallback(() => {
    confirmDeleteStepIfAllowed({
      canDelete: canDeleteJourneyStepPerm,
      stepId: stepPendingDelete?.id,
      journeyId,
      closeModal: closeDeleteStepModal,
      mutate: deleteStepMutation.mutate,
    });
  }, [
    canDeleteJourneyStepPerm,
    closeDeleteStepModal,
    deleteStepMutation.mutate,
    journeyId,
    stepPendingDelete?.id,
  ]);

  const handleDeleteJourney = useCallback(() => {
    if (!canDeleteJourneyRecord) return;
    deleteJourneyMutation.mutate(journeyId);
  }, [canDeleteJourneyRecord, deleteJourneyMutation, journeyId]);

  const employees = useMemo<OnboardingEmployee[]>(
    () => mapJourneyRecordsToEmployees(journeysData, users),
    [journeysData, users],
  );

  const handleApply = useCallback(() => {
    setAppliedSearch(searchTerm);
    setAppliedDepartment(selectedDepartment);
    setAppliedEmploymentType(selectedEmploymentType);
    setAppliedContract(selectedContract);
    setAppliedUserIds(selectedUserIds);
    setAppliedStatus(selectedStatus);
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedDepartment,
    selectedEmploymentType,
    selectedContract,
    selectedUserIds,
    selectedStatus,
  ]);

  const handlePaginationChange = useCallback((page: number, limit: number) => {
    setRowsPerPage((prevLimit) =>
      nextRowsPerPageAfterPaginationChange(page, limit, prevLimit, setCurrentPage),
    );
  }, []);

  const resetFilters = useCallback(() => {
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
  }, []);

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

  const departmentPillActiveLabel = useMemo(
    () =>
      pickActiveLabel(
        selectedDepartment,
        appliedDepartment,
        selectedDepartmentLabel,
        appliedDepartmentLabel,
      ),
    [selectedDepartment, appliedDepartment, selectedDepartmentLabel, appliedDepartmentLabel],
  );

  const selectedStatusLabel = useMemo(() => getJourneyStatusLabel(selectedStatus), [selectedStatus]);

  const appliedStatusLabel = useMemo(() => getJourneyStatusLabel(appliedStatus), [appliedStatus]);

  const statusPillActiveLabel = useMemo(
    () =>
      pickActiveLabel(selectedStatus, appliedStatus, selectedStatusLabel, appliedStatusLabel),
    [selectedStatus, appliedStatus, selectedStatusLabel, appliedStatusLabel],
  );

  const onboardingColumns = useMemo(() => buildOnboardingColumns(), []);

  const onboardingActions = useMemo(
    () =>
      buildOnboardingActions({
        setSelectedEmployee,
        setIsSidebarOpen,
      }),
    [],
  );

  const deletingStepIdForUi = deletingStepIdFromMutationState(
    deleteStepMutation.isPending,
    deleteStepMutation.variables,
  );

  const journeySidebarSections = useMemo(
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
        deletingStepId: deletingStepIdForUi,
        statusValue,
        statusUpdating: updateJourneyStatusMutation.isPending,
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
      deletingStepIdForUi,
      statusValue,
      updateJourneyStatusMutation.isPending,
      isJourneyCompleted,
      handleStatusChange,
      openDeleteStepModal,
    ],
  );

  const employmentFilterOptions = useMemo(
    () => [
      {
        label: "All employment types",
        value: "__all__",
        selected: !selectedEmploymentType,
        onClick: () => setSelectedEmploymentType(""),
      },
      ...EMPLOYMENT_TYPES.map((type) => ({
        label: type,
        value: type,
        selected: selectedEmploymentType === type,
        onClick: () => setSelectedEmploymentType(type),
      })),
    ],
    [selectedEmploymentType],
  );

  const contractFilterOptions = useMemo(
    () => [
      {
        label: "All contract types",
        value: "__all__",
        selected: !selectedContract,
        onClick: () => setSelectedContract(""),
      },
      ...CONTRACT_TYPES.map((type) => ({
        label: type,
        value: type,
        selected: selectedContract === type,
        onClick: () => setSelectedContract(type),
      })),
    ],
    [selectedContract],
  );

  const departmentFilterOptions = useMemo(
    () => [
      {
        label: "All departments",
        value: "__all__",
        selected: !selectedDepartment,
        onClick: () => setSelectedDepartment(""),
      },
      ...departments.map((dept: MainAppDepartmentLookup) => {
        const idStr = String(dept.id);
        return {
          label: hierarchyLabel(dept),
          value: idStr,
          selected: selectedDepartment === idStr,
          onClick: () => setSelectedDepartment(idStr),
        };
      }),
    ],
    [departments, selectedDepartment],
  );

  const statusFilterOptions = useMemo(
    () => [
      {
        label: "All statuses",
        value: "__all__",
        selected: !selectedStatus,
        onClick: () => setSelectedStatus(""),
      },
      ...JOURNEY_STATUS_OPTIONS.map((opt: { value: string; label: string }) => ({
        label: opt.label,
        value: opt.value,
        selected: selectedStatus === opt.value,
        onClick: () => setSelectedStatus(opt.value),
      })),
    ],
    [selectedStatus],
  );

  const journeyUserDropdownRows = useMemo(
    () =>
      filteredManagers.map((mgr: MainAppUserLookup, idx: number) => {
        const phone = String(mgr.phone ?? "").trim();
        const selectionId = phone || String(mgr.id ?? idx);
        return {
          rowKey: `${String(mgr.id ?? "row")}-${idx}`,
          selectionId,
          label: hierarchyLabel(mgr),
        };
      }),
    [filteredManagers],
  );

  const usersDropdownContent = useMemo(
    () => (
      <WorkforceUserMultiSelectDropdown
        searchTerm={userSearchTerm}
        onSearchTermChange={setUserSearchTerm}
        rows={journeyUserDropdownRows}
        selectedIds={selectedUserIds}
        onToggle={toggleSelectedUserId}
        onApply={() => undefined}
        onClear={() => undefined}
      />
    ),
    [journeyUserDropdownRows, selectedUserIds, toggleSelectedUserId, userSearchTerm],
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

  const hasUnappliedFilterChanges = useMemo(
    () =>
      searchTerm !== appliedSearch ||
      selectedDepartment !== appliedDepartment ||
      selectedEmploymentType !== appliedEmploymentType ||
      selectedContract !== appliedContract ||
      JSON.stringify(selectedUserIds) !== JSON.stringify(appliedUserIds) ||
      selectedStatus !== appliedStatus,
    [
      searchTerm,
      appliedSearch,
      selectedDepartment,
      appliedDepartment,
      selectedEmploymentType,
      appliedEmploymentType,
      selectedContract,
      appliedContract,
      selectedUserIds,
      appliedUserIds,
      selectedStatus,
      appliedStatus,
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
      showFilterPills: true,
      filterPills,
      showMoreFiltersButton: false,
      clearAllFilters: hasAppliedFilters ? resetFilters : undefined,
      filterPillsRightActions: renderApplyFilterActions(
        hasUnappliedFilterChanges,
        handleApply,
        "journey",
      ),
    }),
    [
      searchTerm,
      filterPills,
      journeysPagination?.total,
      handleApply,
      resetFilters,
      hasAppliedFilters,
      hasUnappliedFilterChanges,
    ],
  );

  const sidebarQuickActions = useMemo(
    () =>
      getJourneySidebarQuickActions({
        canDeleteJourneyRecord,
        deletingJourney: deleteJourneyMutation.isPending,
        setShowDeleteJourneyModal,
      }),
    [canDeleteJourneyRecord, deleteJourneyMutation.isPending],
  );

  return (
    <React.Fragment>
      <WorkforceListPageShell breadcrumbSubTitle="Employees Journey" tableWrapperClass="workforce-journey-table-wrapper">
        <div className="journey-page__shell">
          <div className="journey-page__table-pane">
            <GenericTable<OnboardingEmployee>
            data={employees}
            columns={onboardingColumns}
            actions={onboardingActions}
            showActions={true}
            actionsLabel="View"
            loading={Boolean(companyIdentifier) && journeysFetching}
            loadingMessage="Loading onboarding data..."
            emptyMessage="No onboarding journeys found"
            hover={true}
            uniqueKey="id"
            pagination={genericTablePaginationFromJourneys(
              journeysPagination,
              currentPage,
              rowsPerPage,
            )}
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
            <JourneyAppliedFiltersSummary
              appliedSearch={appliedSearch}
              appliedDepartment={appliedDepartment}
              appliedDepartmentLabel={appliedDepartmentLabel}
              appliedEmploymentType={appliedEmploymentType}
              appliedContract={appliedContract}
              appliedStatus={appliedStatus}
              appliedStatusLabel={appliedStatusLabel}
              appliedUserIds={appliedUserIds}
              appliedUserNames={appliedUserNames}
            />
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
        </div>
      </WorkforceListPageShell>

      <AddJourneyStepModal
          show={showAddStepForm}
          journeyId={journeyId}
          stepCount={journeySteps.length}
          onHide={() => setShowAddStepForm(false)}
          onInvalidateJourneyQueries={invalidateJourneyQueries}
        />

        <EditJourneyStepModal
          step={editingStep}
          journeyId={journeyId}
          onHide={() => setEditingStep(null)}
          onInvalidateJourneyQueries={invalidateJourneyQueries}
        />

        <DeleteConfirmationModal
          show={showDeleteStepModal}
          onHide={closeDeleteStepModal}
          onConfirm={confirmDeleteStep}
          itemName={deleteStepModalItemName(stepPendingDelete)}
          itemType="step"
          loading={deleteStepMutation.isPending}
        />
        <DeleteConfirmationModal
          show={showDeleteJourneyModal}
          onHide={() => setShowDeleteJourneyModal(false)}
          onConfirm={handleDeleteJourney}
          itemName={deleteJourneyModalItemName(selectedEmployee)}
          itemType="journey"
          loading={deleteJourneyMutation.isPending}
        />
    </React.Fragment>
  );
};

EmployeesOnboarding.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default EmployeesOnboarding;
