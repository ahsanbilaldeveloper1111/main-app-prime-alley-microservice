import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { FilterPill, TableColumn, ToolbarConfig } from "@components/GenericTable";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
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
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import { getAvatarColor, getInitials } from "@utils/workforceUserAvatar";
import { WorkforceUserMultiSelectDropdown } from "@components/workforce/WorkforceUserMultiSelectDropdown";
import { workforceKeys } from "../../../query/keys";
import {
  ATTENDANCE_DATE_PRESETS,
  ATTENDANCE_ITEMS_PER_PAGE,
  consumeHandledAttendanceError,
} from "./attendanceDomain";
import { useAttendanceLiveSessionElapsed } from "./useAttendanceLiveSessionElapsed";
import { useAttendanceListQuery, useAttendanceStatusQuery } from "./useAttendanceQueries";
import { AttendanceStatusDisplay } from "./partials/AttendanceStatusUI";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/attendance-page.scss";

const { PERMISSIONS } = HEADER_CONSTANTS;

type MainAppUser = {
  id: string | number;
  name?: string | null;
  phone?: string | null;
};

const AttendancePage = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();
  const canDeleteAttendance = hasPermission(PERMISSIONS.DELETE_ATTENDANCE_STAFF_MANAGEMENT);
  const { mainAppUsers } = useMainAppLookups();

  const users = useMemo(() => (mainAppUsers ?? []) as MainAppUser[], [mainAppUsers]);

  const getDisplayName = useCallback(
    (userId: string | number | null | undefined): string => {
      if (userId == null || userId === "") return "—";
      const idStr = String(userId);
      const u = users.find((x) => String(x.id) === idStr);
      return u?.name ?? idStr;
    },
    [users],
  );

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [appliedUserIds, setAppliedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ATTENDANCE_ITEMS_PER_PAGE);
  const rowsPerPageRef = useRef(rowsPerPage);
  rowsPerPageRef.current = rowsPerPage;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  const managers = users;

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

  const attendanceListQuery = useAttendanceListQuery({
    page: currentPage,
    limit: rowsPerPage,
    appliedUserIds,
    selectedDatePreset: selectedDate,
  });

  const attendanceStatusQuery = useAttendanceStatusQuery();

  const invalidateAttendanceReads = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: workforceKeys.attendance.all() });
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
  }, [appliedUserIds, selectedDate]);

  const handleCheckIn = useCallback(() => {
    checkInMutation.mutate();
  }, [checkInMutation]);

  const handleCheckOut = useCallback(() => {
    checkOutMutation.mutate();
  }, [checkOutMutation]);

  const handleConfirmDelete = useCallback(() => {
    if (!canDeleteAttendance || !recordToDelete) return;
    deleteAttendanceMutation.mutate(recordToDelete.id);
  }, [canDeleteAttendance, deleteAttendanceMutation, recordToDelete]);

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
        onApply={() => {
          setAppliedUserIds(selectedUserIds);
          setCurrentPage(1);
        }}
        onClear={() => {
          setSelectedUserIds([]);
          setAppliedUserIds([]);
          setUserSearchTerm("");
          setCurrentPage(1);
        }}
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

  const activeAttendanceUserId = selectedUserIds[0] || appliedUserIds[0] || "";
  const activeAttendanceUserLabel = activeAttendanceUserId
    ? getDisplayName(activeAttendanceUserId)
    : undefined;

  const attendanceFilterPills = useMemo<FilterPill[]>(
    () => [
      {
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
      },
      {
        id: "attendance-date-filter",
        label: "Date",
        showDropdown: true,
        searchable: true,
        active: Boolean(selectedDate),
        activeLabel: selectedDate || undefined,
        onClear: selectedDate ? () => setSelectedDate("") : undefined,
        dropdownOptions: dateFilterOptions,
      },
    ],
    [
      selectedUserIds,
      appliedUserIds,
      activeAttendanceUserLabel,
      usersDropdownContent,
      selectedDate,
      dateFilterOptions,
    ],
  );

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
      showFilterPills: false,
      filterPills: attendanceFilterPills,
      showMoreFiltersButton: false,
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
    ],
  );

  return (
    <div className="attendance-page-shell">
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Attendance" />

      <GenericTable<AttendanceRecord>
        data={records}
        columns={attendanceColumns}
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
  );
};

AttendancePage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AttendancePage;
