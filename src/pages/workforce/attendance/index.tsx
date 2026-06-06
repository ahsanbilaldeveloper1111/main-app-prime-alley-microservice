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
  type AttendanceRecord,
} from "@utils/staffManagement";
import { toast } from "react-toastify";
import moment from "moment";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { useSession } from "next-auth/react";
import { Trash2 } from "lucide-react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import { getAvatarColor, getInitials } from "@utils/workforceUserAvatar";
import { WorkforceUserMultiSelectDropdown } from "@components/workforce/WorkforceUserMultiSelectDropdown";
import { canViewAllEmployeesAttendance } from "@utils/workforce/canViewAllEmployeesAttendance";
import { parseTeamUsersResponseForAttendanceScope } from "@utils/workforce/attendanceTeamScope";
import { getTeamUsers } from "@utils/teams";
import { workforceKeys } from "@query/keys";
import {
  ATTENDANCE_DATE_PRESETS,
  ATTENDANCE_ITEMS_PER_PAGE,
  consumeHandledAttendanceError,
} from "@page-modules/workforce/attendance/attendanceDomain";
import { useAttendanceLiveSessionElapsed } from "@page-modules/workforce/attendance/useAttendanceLiveSessionElapsed";
import { useAttendanceListQuery, useAttendanceStatusQuery } from "@page-modules/workforce/attendance/useAttendanceQueries";
import { AttendanceStatusDisplay } from "@page-modules/workforce/attendance/partials/AttendanceStatusUI";
import { WorkforceListPageShell } from "@page-modules/workforce/shared/WorkforceListPageShell";
import { renderApplyFilterActions } from "@utils/communicationsStagedFilters";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@page-modules/workforce/shared/workforcePages.scss";
import "@assets/scss/attendance-page.scss";

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
  const { mainAppUsers } = useMainAppLookups();

  // True → list/dropdown use full company scope. False → only Control Hub team (+ self); see canViewAllEmployeesAttendance (admin/root/permission).
  const canViewAllEmployees = useMemo(
    () => canViewAllEmployeesAttendance(session?.user),
    [session?.user],
  );

  const [teamScopeUserIds, setTeamScopeUserIds] = useState<string[]>([]);
  const [teamScopeLoading, setTeamScopeLoading] = useState(false);

  useEffect(() => {
    // Privileged users skip team fetch entirely so attendance API is not limited to getTeamUsers.
    if (canViewAllEmployees || sessionStatus !== "authenticated") {
      setTeamScopeUserIds([]);
      setTeamScopeLoading(false);
      return;
    }
    const selfRaw = session?.user?.id;
    const selfStr = selfRaw == null ? "" : String(selfRaw).trim();
    if (selfStr === "") {
      setTeamScopeUserIds([]);
      setTeamScopeLoading(false);
      return;
    }
    let cancelled = false;
    setTeamScopeLoading(true);
    void (async () => {
      try {
        const numericId = Number(selfStr);
        const raw = await getTeamUsers(
          undefined,
          Number.isFinite(numericId) ? numericId : undefined,
        );
        if (cancelled) return;
        const ids = parseTeamUsersResponseForAttendanceScope(raw, selfStr);
        setTeamScopeUserIds(ids);
      } catch (e) {
        console.error("[AttendancePage] getTeamUsers failed", e);
        if (!cancelled) {
          setTeamScopeUserIds([selfStr]);
        }
      } finally {
        if (!cancelled) {
          setTeamScopeLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canViewAllEmployees, sessionStatus, session?.user?.id]);

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

  const attendanceStatusQuery = useAttendanceStatusQuery();

  const invalidateAttendanceReads = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: workforceKeys.attendance.all() }).catch((err: unknown) => {
      consumeHandledAttendanceError(err, "Attendance.invalidateReads");
    });
  }, [queryClient]);

  const sessionUserId = session?.user?.id;

  const checkInMutation = useMutation({
    mutationFn: () =>
      attendanceCheckIn(sessionUserId == null ? {} : { user_id: String(sessionUserId) }),
    onSuccess: () => {
      toast.success("Checked in successfully");
      invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
      consumeHandledAttendanceError(err, "Attendance.checkIn");
      toast.error("Check-in failed");
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: () =>
      attendanceCheckOut(sessionUserId == null ? {} : { user_id: String(sessionUserId) }),
    onSuccess: () => {
      toast.success("Checked out successfully");
      invalidateAttendanceReads();
    },
    onError: (err: unknown) => {
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
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (record: AttendanceRecord) => {
          handleDeleteAttendanceClick(record);
        },
        show: () => canDeleteAttendance,
        disabled: (record: AttendanceRecord) => !canDeleteAttendanceRow(record),
        disabledTitle: "You can only delete attendance for yourself or your team (with permission).",
        variant: "link",
      },
    ],
    [canDeleteAttendance, canDeleteAttendanceRow, handleDeleteAttendanceClick],
  );

  const records = attendanceListQuery.data?.records ?? [];
  const pagination = attendanceListQuery.data?.pagination ?? null;
  const status = attendanceStatusQuery.data ?? null;

  const isCheckedIn = status?.is_checked_in === true;
  const canCheckInOut = Boolean(
    session?.user?.permissions?.includes(PERMISSIONS.CHECK_IN_OUT_ATTENDENCE_STAFF_MANAGEMENT),
  );

  const sessionCheckInAt =
    status?.is_checked_in === true && status?.attendance?.check_in_at
      ? String(status.attendance.check_in_at)
      : null;
  const liveSessionElapsed = useAttendanceLiveSessionElapsed(sessionCheckInAt);

  const checkInOutLoading = checkInMutation.isPending || checkOutMutation.isPending;

  const attendanceToolbar = useMemo<ToolbarConfig>(
    () => ({
      showTabs: true,
      tabs: [
        {
          id: "attendance-records",
          label: "Attendance records",
          count: pagination?.total,
        },
      ],
      activeTab: "attendance-records",
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
      rightActions: (
        <div className="attendance-toolbar-right">
          <div className="attendance-status-content">
            <AttendanceStatusDisplay
              statusLoading={attendanceStatusQuery.isFetching}
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
    }),
    [
      attendanceFilterPills,
      pagination?.total,
      attendanceStatusQuery.isFetching,
      status,
      isCheckedIn,
      canCheckInOut,
      liveSessionElapsed,
      checkInOutLoading,
      handleCheckIn,
      handleCheckOut,
      hasActiveFilters,
      hasUnappliedFilterChanges,
      handleApplyFilters,
      resetFilters,
    ],
  );

  return (
    <WorkforceListPageShell breadcrumbSubTitle="Attendance" tableWrapperClass="workforce-attendance-table-wrapper">
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
      </div>
    </WorkforceListPageShell>
  );
};

AttendancePage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AttendancePage;
