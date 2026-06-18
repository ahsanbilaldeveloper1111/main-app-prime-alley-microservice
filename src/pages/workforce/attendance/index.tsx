import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@layout/index";
import GenericTable, {
  FilterPill,
  TableAction,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import {
  attendanceCheckIn,
  attendanceCheckOut,
  deleteAttendance,
  normalizeMyAttendanceData,
  type AttendanceCorrectionPayload,
  type AttendanceRecord,
} from "@utils/staffManagement";
import {
  readWorkforceTenantId,
  validateAttendanceSessionPayload,
} from "@utils/workforce/attendanceActionPayload";
import { toast } from "react-toastify";
import moment from "moment";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { useSession } from "next-auth/react";
import { Trash2, ClipboardEdit } from "lucide-react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import { getAvatarColor, getInitials } from "@utils/workforceUserAvatar";
import { WorkforceUserMultiSelectDropdown } from "@components/workforce/WorkforceUserMultiSelectDropdown";
import { canViewAllEmployeesAttendance } from "@utils/workforce/canViewAllEmployeesAttendance";
import { useAttendanceHierarchyScope } from "@page-modules/workforce/attendance/useAttendanceHierarchyScope";
import { workforceKeys } from "@query/keys";
import {
  ATTENDANCE_DATE_PRESETS,
  ATTENDANCE_ITEMS_PER_PAGE,
  consumeHandledAttendanceError,
} from "@page-modules/workforce/attendance/attendanceDomain";
import { useAttendanceLiveSessionElapsed } from "@page-modules/workforce/attendance/useAttendanceLiveSessionElapsed";
import { useAttendanceListQuery } from "@page-modules/workforce/attendance/useAttendanceQueries";
import { AttendanceStatusDisplay } from "@page-modules/workforce/attendance/partials/AttendanceStatusUI";
import {
  buildCheckInOutSessionPayload,
  buildCheckInPayload,
} from "@page-modules/workforce/check-in-out/buildCheckInOutActionPayload";
import {
  getMyAttendanceActionAvailability,
  readMyAttendanceCheckInAt,
  readMyAttendanceSessionActive,
  buildMyAttendanceStatusData,
} from "@page-modules/workforce/check-in-out/checkInOutDomain";
import { useMyAttendanceQuery } from "@page-modules/workforce/check-in-out/useMyAttendanceQuery";
import { AttendanceCorrectionModal } from "@page-modules/workforce/attendance-reports/AttendanceCorrectionModal";
import {
  buildAttendanceCorrectionTargetFromRecord,
  type AttendanceCorrectionTarget,
} from "@page-modules/workforce/attendance-reports/attendanceCorrectionDomain";
import { useCreateAttendanceCorrectionMutation } from "@page-modules/workforce/attendance-reports/useCreateAttendanceCorrectionMutation";
import { WorkforceListPageShell } from "@page-modules/workforce/shared/WorkforceListPageShell";
import {
  WORKFORCE_TOOLBAR_LABELS,
  workforceModuleToolbarDropdown,
} from "@page-modules/workforce/shared/workforceListPageConfig";
import { renderApplyFilterActions } from "@utils/communicationsStagedFilters";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@page-modules/workforce/shared/workforcePages.scss";
import "@assets/scss/attendance-page.scss";
import "@page-modules/workforce/attendance-reports/attendanceCorrectionModal.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;

type MainAppUser = {
  id: string | number;
  name?: string | null;
  phone?: string | null;
};

const AttendancePage = () => {
  const queryClient = useQueryClient();
  const { data: session, status: sessionStatus } = useSession();
  const { hasAnyPermission } = usePermissions();
  /** Backend may emit either slug variant; accept both so delete is not silently hidden. */
  const canDeleteAttendance = hasAnyPermission([
    PERMISSIONS.DELETE_ATTENDANCE_STAFF_MANAGEMENT,
    "delete-attendance-staff-management",
  ]);
  const { mainAppUsers, companyIdentifier } = useMainAppLookups();

  // True → list/dropdown use full company scope. False → hierarchy-visible users (+ self); see canViewAllEmployeesAttendance.
  const canViewAllEmployees = useMemo(
    () => canViewAllEmployeesAttendance(session?.user),
    [session?.user],
  );

  const { teamScopeUserIds, teamScopeLoading } = useAttendanceHierarchyScope(
    session,
    sessionStatus,
    canViewAllEmployees,
  );

  const users = useMemo(() => (mainAppUsers ?? []) as MainAppUser[], [mainAppUsers]);

  const getDisplayName = useCallback(
    (userId: string | number | null | undefined): string => {
      if (userId == null || userId === "") return "—";
      const idStr = String(userId).trim();
      const u = users.find(
        (x) => String(x.id) === idStr || String(x.phone ?? "").trim() === idStr,
      );
      return u?.name ?? idStr;
    },
    [users],
  );

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [appliedUserIds, setAppliedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [appliedDate, setAppliedDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ATTENDANCE_ITEMS_PER_PAGE);
  const rowsPerPageRef = useRef(rowsPerPage);
  rowsPerPageRef.current = rowsPerPage;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceCorrectionTarget | null>(null);

  const correctionMutation = useCreateAttendanceCorrectionMutation();

  const managers = useMemo(() => {
    if (canViewAllEmployees) {
      return users;
    }
    const selfOnly = (): MainAppUser[] => {
      const self = String(session?.user?.id ?? "").trim();
      if (self === "") return [];
      return users.filter(
        (u) =>
          String(u.id) === self ||
          (u.phone != null && String(u.phone).trim() === self),
      );
    };
    if (teamScopeLoading) {
      return selfOnly();
    }
    const allow = new Set(teamScopeUserIds);
    if (allow.size === 0) {
      return selfOnly();
    }
    return users.filter(
      (u) =>
        allow.has(String(u.id)) ||
        (u.phone != null && allow.has(String(u.phone).trim())),
    );
  }, [canViewAllEmployees, users, teamScopeUserIds, teamScopeLoading, session?.user?.id]);

  const toggleSelectedUserId = useCallback((idStr: string, isSelected: boolean) => {
    setSelectedUserIds((prev) => {
      if (isSelected) return prev.filter((id) => id !== idStr);
      return [...prev, idStr];
    });
  }, []);

  const filteredManagers = useMemo(() => {
    const needle = userSearchTerm.trim().toLowerCase();
    if (!needle) return managers;
    return managers.filter((mgr) => {
      const label = String(mgr.name ?? mgr.id).toLowerCase();
      const phone = String(mgr.phone ?? "").trim().toLowerCase();
      return label.includes(needle) || phone.includes(needle);
    });
  }, [managers, userSearchTerm]);

  useEffect(() => {
    if (canViewAllEmployees) return;
    const allow = new Set(teamScopeUserIds);
    if (allow.size === 0) return;
    setAppliedUserIds((prev) => prev.filter((id) => allow.has(String(id).trim())));
    setSelectedUserIds((prev) => prev.filter((id) => allow.has(String(id).trim())));
  }, [canViewAllEmployees, teamScopeUserIds]);

  const attendanceListQuery = useAttendanceListQuery(
    {
      page: currentPage,
      limit: rowsPerPage,
      appliedUserIds,
      selectedDatePreset: appliedDate,
      canViewAllEmployees,
      teamScopeLoading,
      teamScopeUserIds,
      sessionUserId: session?.user?.id,
      sessionStatus,
    },
    {
      enabled: sessionStatus === "authenticated" && (canViewAllEmployees || !teamScopeLoading),
    },
  );

  const teamDeleteAllowSet = useMemo(
    () =>
      new Set(
        teamScopeUserIds.map((x) => String(x).trim()).filter((x) => x.length > 0),
      ),
    [teamScopeUserIds],
  );

  const myAttendanceQuery = useMyAttendanceQuery();
  const myAttendance = myAttendanceQuery.data ?? null;

  const invalidateAttendanceReads = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: workforceKeys.attendance.all() });
  }, [queryClient]);

  const sessionUser = session?.user;

  const buildSessionPayload = useCallback(
    () =>
      buildCheckInOutSessionPayload({
        sessionUser,
        tenantId: companyIdentifier,
        myAttendance,
      }),
    [companyIdentifier, myAttendance, sessionUser],
  );

  const validateToolbarPayloadOrToast = useCallback(
    (payload: ReturnType<typeof buildCheckInOutSessionPayload>): boolean => {
      const error = validateAttendanceSessionPayload(payload);
      if (!error) {
        return true;
      }
      toast.error(error);
      return false;
    },
    [],
  );

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const payload = await buildCheckInPayload({
        sessionUser,
        tenantId: companyIdentifier,
        myAttendance,
      });
      if (!validateToolbarPayloadOrToast(payload)) {
        throw new Error("Invalid check-in payload");
      }
      return attendanceCheckIn(payload);
    },
    onSuccess: async (data) => {
      if (data != null && typeof data === "object") {
        queryClient.setQueryData(
          workforceKeys.attendance.my(),
          normalizeMyAttendanceData(data),
        );
      }
      toast.success("Checked in successfully");
      await invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "Invalid check-in payload") {
        return;
      }
      consumeHandledAttendanceError(err, "Attendance.checkIn");
      toast.error("Check-in failed");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () => {
      const payload = buildSessionPayload();
      if (!validateToolbarPayloadOrToast(payload)) {
        throw new Error("Invalid check-out payload");
      }
      return attendanceCheckOut(payload);
    },
    onSuccess: async (data) => {
      if (data != null && typeof data === "object") {
        queryClient.setQueryData(
          workforceKeys.attendance.my(),
          normalizeMyAttendanceData(data),
        );
      }
      toast.success("Checked out successfully");
      await invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === "Invalid check-out payload") {
        return;
      }
      consumeHandledAttendanceError(err, "Attendance.checkOut");
      toast.error("Check-out failed");
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: (id: number) => deleteAttendance(id),
    onSuccess: () => {
      toast.success("Attendance record deleted");
      setShowDeleteModal(false);
      setRecordToDelete(null);
      invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
      consumeHandledAttendanceError(err, "Attendance.deleteRecord");
      toast.error("Failed to delete attendance record");
    },
  });

  const handlePaginationChange = useCallback((page: number, limit: number) => {
    if (rowsPerPageRef.current !== limit) {
      setRowsPerPage(limit);
      setCurrentPage(1);
      return;
    }
    setCurrentPage(page);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedUserIds, appliedDate]);

  const handleApplyFilters = useCallback(() => {
    setAppliedUserIds(selectedUserIds);
    setAppliedDate(selectedDate);
    setCurrentPage(1);
  }, [selectedUserIds, selectedDate]);

  const resetFilters = useCallback(() => {
    setSelectedUserIds([]);
    setAppliedUserIds([]);
    setSelectedDate("");
    setAppliedDate("");
    setUserSearchTerm("");
    setCurrentPage(1);
  }, []);

  const hasUnappliedFilterChanges = useMemo(
    () =>
      JSON.stringify(selectedUserIds) !== JSON.stringify(appliedUserIds) ||
      selectedDate !== appliedDate,
    [selectedUserIds, appliedUserIds, selectedDate, appliedDate],
  );

  const hasActiveFilters = useMemo(
    () => appliedUserIds.length > 0 || Boolean(appliedDate),
    [appliedUserIds, appliedDate],
  );

  const handleCheckIn = useCallback(() => {
    checkInMutation.mutate();
  }, [checkInMutation]);

  const handleCheckOut = useCallback(() => {
    checkOutMutation.mutate();
  }, [checkOutMutation]);

  const canDeleteAttendanceRow = useCallback(
    (record: AttendanceRecord): boolean => {
      if (!canDeleteAttendance) return false;
      if (canViewAllEmployees) return true;
      const sid = String(session?.user?.id ?? "").trim();
      const rid = String(record.user_id ?? "").trim();
      if (sid !== "" && rid === sid) return true;
      return teamDeleteAllowSet.has(rid);
    },
    [canDeleteAttendance, canViewAllEmployees, session?.user?.id, teamDeleteAllowSet],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!canDeleteAttendance || !recordToDelete) return;
    if (!canDeleteAttendanceRow(recordToDelete)) {
      toast.error("You cannot delete this attendance record.");
      return;
    }
    deleteAttendanceMutation.mutate(recordToDelete.id);
  }, [canDeleteAttendance, canDeleteAttendanceRow, deleteAttendanceMutation, recordToDelete]);

  const handleDeleteAttendanceClick = useCallback(
    (record: AttendanceRecord) => {
      if (!canDeleteAttendanceRow(record)) {
        if (!canDeleteAttendance) return;
        toast.error("You cannot delete this attendance record.");
        return;
      }
      setRecordToDelete(record);
      setShowDeleteModal(true);
    },
    [canDeleteAttendance, canDeleteAttendanceRow],
  );

  const handleOpenCorrection = useCallback(
    (record: AttendanceRecord) => {
      const target = buildAttendanceCorrectionTargetFromRecord(
        record,
        getDisplayName(record.user_id),
      );
      if (!target) {
        toast.error("This attendance record cannot be corrected.");
        return;
      }
      setCorrectionTarget(target);
    },
    [getDisplayName],
  );

  const handleCloseCorrection = useCallback(() => {
    if (correctionMutation.isPending) {
      return;
    }
    setCorrectionTarget(null);
  }, [correctionMutation.isPending]);

  const handleSubmitCorrection = useCallback(
    (payload: AttendanceCorrectionPayload) => {
      correctionMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Attendance correction submitted.");
          setCorrectionTarget(null);
        },
        onError: (error: unknown) => {
          consumeHandledAttendanceError(error, "Attendance.attendanceCorrection");
          toast.error("Failed to submit attendance correction.");
        },
      });
    },
    [correctionMutation],
  );

  const resolvedCorrectionTenantId = readWorkforceTenantId(
    companyIdentifier,
    sessionUser?.company_identifier,
  );

  const attendanceUserDropdownRows = useMemo(
    () =>
      filteredManagers.map((mgr, idx) => ({
        rowKey: `${String(mgr.id ?? "row")}-${idx}`,
        selectionId: String(mgr.id),
        label: String(mgr.name ?? mgr.id),
      })),
    [filteredManagers],
  );

  const usersDropdownContent = useMemo(
    () => (
      <WorkforceUserMultiSelectDropdown
        searchTerm={userSearchTerm}
        onSearchTermChange={setUserSearchTerm}
        rows={attendanceUserDropdownRows}
        selectedIds={selectedUserIds}
        onToggle={toggleSelectedUserId}
        onApply={() => undefined}
        onClear={() => undefined}
        listMaxHeightPx={220}
      />
    ),
    [attendanceUserDropdownRows, selectedUserIds, toggleSelectedUserId, userSearchTerm],
  );

  const dateFilterOptions = useMemo(
    () => [
      {
        label: "All Dates",
        value: "__all__",
        onClick: () => setSelectedDate(""),
      },
      ...ATTENDANCE_DATE_PRESETS.map((option) => ({
        label: option,
        value: option,
        onClick: () => setSelectedDate(option),
      })),
    ],
    [],
  );

  const activeAttendanceUserId =
    selectedUserIds[0] || appliedUserIds[0] || "";
  const activeAttendanceUserLabel = activeAttendanceUserId
    ? getDisplayName(activeAttendanceUserId)
    : undefined;
  const dateFilterKey = selectedDate || appliedDate;

  const attendanceFilterPills = useMemo<FilterPill[]>(() => {
    const userPill: FilterPill = {
      id: "attendance-user-filter",
      label: "User",
      showDropdown: true,
      searchable: true,
      active: selectedUserIds.length > 0 || appliedUserIds.length > 0,
      activeLabel: activeAttendanceUserLabel,
      onClear:
        selectedUserIds.length > 0 || appliedUserIds.length > 0
          ? () => {
              setSelectedUserIds([]);
              setAppliedUserIds([]);
              setUserSearchTerm("");
              setCurrentPage(1);
            }
          : undefined,
      dropdownContent: usersDropdownContent,
    };
    const datePill: FilterPill = {
      id: "attendance-date-filter",
      label: "Date",
      showDropdown: true,
      searchable: true,
      active: Boolean(dateFilterKey),
      activeLabel: dateFilterKey || undefined,
      onClear: dateFilterKey
        ? () => {
            setSelectedDate("");
            setAppliedDate("");
            setCurrentPage(1);
          }
        : undefined,
      dropdownOptions: dateFilterOptions,
    };
    const showUserFilter =
      canViewAllEmployees || teamScopeUserIds.length > 1;
    return showUserFilter ? [userPill, datePill] : [datePill];
  }, [
    selectedUserIds,
    appliedUserIds,
    activeAttendanceUserLabel,
    usersDropdownContent,
    dateFilterKey,
    dateFilterOptions,
    canViewAllEmployees,
    teamScopeUserIds.length,
  ]);

  const attendanceColumns = useMemo<TableColumn<AttendanceRecord>[]>(
    () => [
      {
        key: "user_id",
        label: "User Name",
        type: "avatar",
        sortable: false,
        accessor: (row) => getDisplayName(row.user_id),
        avatar: {
          getInitials: (row) => getInitials(getDisplayName(row.user_id)),
          getColor: (row) => getAvatarColor(getDisplayName(row.user_id)),
        },
      },
      {
        key: "work_date",
        label: "Work Date",
        type: "text",
        sortable: false,
        accessor: (row) =>
          row.work_date ? moment(row.work_date).format("DD MMM YYYY") : "-",
      },
      {
        key: "check_in_at",
        label: "Check In",
        type: "text",
        sortable: false,
        accessor: (row) =>
          row.check_in_at ? moment(row.check_in_at).format(GlobalDateTimeFormat) : "-",
      },
      {
        key: "check_out_at",
        label: "Check Out",
        type: "text",
        sortable: false,
        accessor: (row) =>
          row.check_out_at ? moment(row.check_out_at).format(GlobalDateTimeFormat) : "-",
      },
    ],
    [getDisplayName],
  );

  const attendanceActions = useMemo<TableAction<AttendanceRecord>[]>(
    () => [
      {
        label: "Correct",
        icon: <ClipboardEdit size={16} />,
        onClick: (record: AttendanceRecord) => {
          handleOpenCorrection(record);
        },
        variant: "light",
        className: "btn-action-style-2 p-1",
      },
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (record: AttendanceRecord) => {
          handleDeleteAttendanceClick(record);
        },
        show: () => canDeleteAttendance,
        disabled: (record: AttendanceRecord) => !canDeleteAttendanceRow(record),
        disabledTitle: "You can only delete attendance for yourself or your team (with permission).",
        variant: "light",
        className: "btn-action-style-2 p-1 text-danger",
      },
    ],
    [canDeleteAttendance, canDeleteAttendanceRow, handleDeleteAttendanceClick, handleOpenCorrection],
  );

  const records = attendanceListQuery.data?.records ?? [];
  const pagination = attendanceListQuery.data?.pagination ?? null;

  const canCheckInOut = Boolean(
    session?.user?.permissions?.includes(PERMISSIONS.CHECK_IN_OUT_ATTENDENCE_STAFF_MANAGEMENT),
  );
  const actionAvailability = getMyAttendanceActionAvailability(myAttendance, canCheckInOut);
  const isCheckedIn = readMyAttendanceSessionActive(myAttendance, actionAvailability);
  const status = useMemo(
    () => buildMyAttendanceStatusData(myAttendance, isCheckedIn),
    [myAttendance, isCheckedIn],
  );

  const sessionCheckInAt = readMyAttendanceCheckInAt(myAttendance);
  const liveSessionElapsed = useAttendanceLiveSessionElapsed(sessionCheckInAt);

  const checkInOutLoading = checkInMutation.isPending || checkOutMutation.isPending;

  const attendanceToolbarRightActions = useMemo(
    () => (
      <div className="attendance-toolbar-right">
        <div className="attendance-status-content">
          <AttendanceStatusDisplay
            statusLoading={myAttendanceQuery.isFetching && !myAttendance}
            status={status}
            isCheckedIn={isCheckedIn}
            canCheckInOut={canCheckInOut}
            liveSessionElapsed={liveSessionElapsed}
            checkInOutLoading={checkInOutLoading}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />
        </div>
      </div>
    ),
    [
      myAttendanceQuery.isFetching,
      myAttendance,
      status,
      isCheckedIn,
      canCheckInOut,
      liveSessionElapsed,
      checkInOutLoading,
      handleCheckIn,
      handleCheckOut,
    ],
  );

  const attendanceToolbar = useMemo<ToolbarConfig>(
    () => ({
      showTabs: true,
      tabs: [
        {
          id: "attendance-records",
          label: "Attendance records",
          count: pagination?.total ?? 0,
        },
      ],
      activeTab: "attendance-records",
      ...workforceModuleToolbarDropdown(WORKFORCE_TOOLBAR_LABELS.attendance),
      rightActions: attendanceToolbarRightActions,
      showFiltersButton: true,
      showFilterPills: true,
      filterPills: attendanceFilterPills,
      showMoreFiltersButton: false,
      clearAllFilters: hasActiveFilters ? resetFilters : undefined,
      filterPillsRightActions: renderApplyFilterActions(
        hasUnappliedFilterChanges,
        handleApplyFilters,
        "attendance",
      ),
    }),
    [
      attendanceFilterPills,
      attendanceToolbarRightActions,
      pagination?.total,
      hasActiveFilters,
      hasUnappliedFilterChanges,
      handleApplyFilters,
      resetFilters,
    ],
  );

  return (
    <WorkforceListPageShell
      breadcrumbSubTitle="Attendance"
      tableWrapperClass="workforce-attendance-table-wrapper"
    >
      <div className="attendance-page-shell">
      <GenericTable<AttendanceRecord>
        data={records}
        columns={attendanceColumns}
        actions={attendanceActions}
        showActions={true}
        actionsLabel="Actions"
        loading={attendanceListQuery.isFetching}
        loadingMessage="Loading records..."
        emptyMessage="No attendance records"
        hover={true}
        uniqueKey="id"
        pagination={
          pagination
            ? {
                currentPage: pagination.page,
                rowsPerPage: pagination.limit ?? rowsPerPage,
                totalRows: pagination.total,
                pageSizeOptions: [15, 25, 50, 100],
              }
            : undefined
        }
        onPaginationChange={handlePaginationChange}
        showToolbar={true}
        toolbar={attendanceToolbar}
        showToolbarActions={false}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setRecordToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        itemName={
          recordToDelete
            ? `${getDisplayName(recordToDelete.user_id)} (attendance #${recordToDelete.id})`
            : undefined
        }
        itemType="attendance record"
        loading={deleteAttendanceMutation.isPending}
      />

      <AttendanceCorrectionModal
        show={correctionTarget != null}
        tenantId={resolvedCorrectionTenantId || null}
        target={correctionTarget}
        isSubmitting={correctionMutation.isPending}
        onClose={handleCloseCorrection}
        onSubmit={handleSubmitCorrection}
      />
      </div>
    </WorkforceListPageShell>
  );
};

AttendancePage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AttendancePage;
