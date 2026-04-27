import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, {
  FilterPill,
  TableColumn,
  ToolbarConfig,
} from "@components/GenericTable";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import {
  getAttendance,
  getAttendanceStatus,
  attendanceCheckIn,
  attendanceCheckOut,
  deleteAttendance,
  type AttendanceRecord,
  type AttendanceStatusData,
} from "@utils/staffManagement";
import { toast } from "react-toastify";
import { Button } from "react-bootstrap";
import moment from "moment";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { useSession } from "next-auth/react";
import { Calendar, Clock, LogIn, LogOut } from "lucide-react";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import { usePermissions } from "@utils/permissionUtils";
import { getAvatarColor, getInitials } from "@utils/workforceUserAvatar";
import { getWorkforceTableDatePresetRange } from "@utils/workforceTableDatePresetRange";
import { WorkforceUserMultiSelectDropdown } from "@components/workforce/WorkforceUserMultiSelectDropdown";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/attendance-page.scss";

const ITEMS_PER_PAGE = 15;
const { PERMISSIONS } = HEADER_CONSTANTS;

const dateOptions = ["Today", "Last 7 days", "Last 30 days", "Last 3 months", "All time"];

type MainAppUser = {
  id: string | number;
  name?: string | null;
  phone?: string | null;
};

function formatAttendanceToolbarDateLine(
  status: AttendanceStatusData,
  isCheckedIn: boolean,
): string | null {
  if (status.work_date) {
    const day = moment(status.work_date).format("dddd, DD MMM YYYY");
    if (isCheckedIn && status.attendance?.check_in_at) {
      return `${day} · In at ${moment(status.attendance.check_in_at).format("hh:mm A")}`;
    }
    return day;
  }
  if (isCheckedIn && status.attendance?.check_in_at) {
    return `In at ${moment(status.attendance.check_in_at).format("dddd, DD MMM YYYY, hh:mm A")}`;
  }
  return null;
}

/** Elapsed time since check-in, updates every second while `checkInAtIso` is set (HH:MM:SS). */
function useLiveSessionElapsed(checkInAtIso: string | null | undefined): string {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!checkInAtIso) return;
    const id = globalThis.setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => globalThis.clearInterval(id);
  }, [checkInAtIso]);

  return useMemo(() => {
    if (!checkInAtIso) return "";
    const start = Date.parse(checkInAtIso);
    if (Number.isNaN(start)) return "";
    const totalSec = Math.max(0, Math.floor((Date.now() - start) / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const hPart = h < 100 ? String(h).padStart(2, "0") : String(h);
    return `${hPart}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [checkInAtIso, tick]);
}

type AttendanceSessionLiveBlockProps = {
  /** HH:MM:SS string from `useLiveSessionElapsed` */
  elapsed: string;
};

function AttendanceSessionLiveBlock({ elapsed }: Readonly<AttendanceSessionLiveBlockProps>) {
  if (!elapsed) return null;
  return (
    <div
      className="att-session-timer"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      title="Time since check-in; updates every second"
    >
      <div className="att-session-timer__header">
        <span className="att-session-timer__eyebrow">Active session</span>
        <span className="att-session-timer__live-pill">Live</span>
      </div>
      <div className="att-session-timer__face">
        <Clock className="att-session-timer__icon" size={20} strokeWidth={2} aria-hidden />
        <span className="att-session-timer__digits tabular-nums">{elapsed}</span>
      </div>
    </div>
  );
}

function AttendanceStatusLoading(): ReactElement {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <Clock size={20} style={{ color: "#9ca3af" }} />
      <span style={{ fontSize: "14px", color: "#6b7280" }}>Loading status…</span>
    </div>
  );
}

function AttendanceStatusUnavailable(): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "14px",
        color: "#6b7280",
      }}
    >
      <Clock size={18} />
      Status unavailable
    </div>
  );
}

type AttendanceStatusPillBodyProps = {
  isCheckedIn: boolean;
  hasCheckInAt: boolean;
  liveSessionElapsed: string;
};

function AttendanceStatusPillBody({
  isCheckedIn,
  hasCheckInAt,
  liveSessionElapsed,
}: Readonly<AttendanceStatusPillBodyProps>): ReactElement {
  const showLiveTimer = isCheckedIn && hasCheckInAt && liveSessionElapsed.length > 0;

  if (showLiveTimer) {
    return (
      <>
        <span
          className="att-status-pill__seg att-status-pill__seg--time"
          title="Session duration since check-in (updates every second)"
        >
          <span className="att-status-pill__live-dot" aria-hidden />
          <Clock className="att-status-pill__seg-ico" size={16} strokeWidth={2} aria-hidden />
          <span className="att-status-pill__run tabular-nums">{liveSessionElapsed}</span>
        </span>
        <span className="att-status-pill__seg att-status-pill__seg--label">Checked in</span>
      </>
    );
  }

  if (isCheckedIn) {
    return (
      <>
        <Clock
          className="att-status-pill__ico att-status-pill__ico--pulse"
          size={18}
          strokeWidth={2}
          aria-hidden
        />
        <span className="att-status-pill__text">Checked in</span>
      </>
    );
  }

  return (
    <>
      <Clock className="att-status-pill__ico" size={18} strokeWidth={2} aria-hidden />
      <span className="att-status-pill__text">Checked out</span>
    </>
  );
}

type AttendanceToolbarStatusStripProps = {
  status: AttendanceStatusData;
  isCheckedIn: boolean;
  liveSessionElapsed: string;
  dateLine: string | null;
  statusLoading: boolean;
  checkInOutLoading: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
};

function AttendanceToolbarStatusStrip({
  status,
  isCheckedIn,
  liveSessionElapsed,
  dateLine,
  statusLoading,
  checkInOutLoading,
  onCheckIn,
  onCheckOut,
}: Readonly<AttendanceToolbarStatusStripProps>): ReactElement {
  const hasCheckInAt = Boolean(status.attendance?.check_in_at);
  const showLivePill = isCheckedIn && hasCheckInAt && liveSessionElapsed.length > 0;

  const pillClassName = [
    "att-status-pill",
    isCheckedIn ? "att-status-pill--in" : "att-status-pill--out",
    showLivePill ? "att-status-pill--live" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const checkInOutDisabled = statusLoading || checkInOutLoading;
  const checkInOutButtonLabel = checkInOutLoading ? "…" : undefined;

  return (
    <div className="att-toolbar-strip">
      <div className={pillClassName} role="status" aria-live="polite">
        <AttendanceStatusPillBody
          isCheckedIn={isCheckedIn}
          hasCheckInAt={hasCheckInAt}
          liveSessionElapsed={liveSessionElapsed}
        />
      </div>
      {dateLine ? (
        <div className="att-toolbar-strip__date">
          <Calendar size={14} className="flex-shrink-0" />
          <span>{dateLine}</span>
        </div>
      ) : null}
      {isCheckedIn ? (
        <Button
          type="button"
          variant="warning"
          size="sm"
          className="att-action-btn att-action-btn--out"
          disabled={checkInOutDisabled}
          onClick={onCheckOut}
        >
          <LogOut size={18} />
          {checkInOutButtonLabel ?? "Check Out"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="success"
          size="sm"
          className="att-action-btn"
          disabled={checkInOutDisabled}
          onClick={onCheckIn}
        >
          <LogIn size={18} />
          {checkInOutButtonLabel ?? "Check In"}
        </Button>
      )}
    </div>
  );
}

type AttendanceReadonlyStatusPanelProps = {
  status: AttendanceStatusData;
  isCheckedIn: boolean;
  statusLabel: string;
  liveSessionElapsed: string;
};

function AttendanceReadonlyStatusPanel({
  status,
  isCheckedIn,
  statusLabel,
  liveSessionElapsed,
}: Readonly<AttendanceReadonlyStatusPanelProps>): ReactElement {
  return (
    <div className="att-status-panel">
      {status.work_date ? (
        <div className="att-status-panel__meta">
          <Calendar size={14} className="att-meta-icon flex-shrink-0" />
          <span>{moment(status.work_date).format("dddd, DD MMM YYYY")}</span>
        </div>
      ) : null}
      <div
        className={`att-status-chip ${isCheckedIn ? "att-status-chip--in" : "att-status-chip--out"}`}
      >
        <Clock size={16} />
        {statusLabel}
      </div>
      {isCheckedIn && status.attendance?.check_in_at ? (
        <AttendanceSessionLiveBlock elapsed={liveSessionElapsed} />
      ) : null}
    </div>
  );
}

type AttendanceStatusDisplayProps = {
  statusLoading: boolean;
  status: AttendanceStatusData | null;
  isCheckedIn: boolean;
  canCheckInOut: boolean;
  liveSessionElapsed: string;
  checkInOutLoading: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
};

function AttendanceStatusDisplay({
  statusLoading,
  status,
  isCheckedIn,
  canCheckInOut,
  liveSessionElapsed,
  checkInOutLoading,
  onCheckIn,
  onCheckOut,
}: Readonly<AttendanceStatusDisplayProps>): ReactElement {
  if (statusLoading) {
    return <AttendanceStatusLoading />;
  }

  if (!status) {
    return <AttendanceStatusUnavailable />;
  }

  const dateLine = formatAttendanceToolbarDateLine(status, isCheckedIn);
  const statusLabel = isCheckedIn ? "Checked in" : "Checked out";

  if (canCheckInOut) {
    return (
      <AttendanceToolbarStatusStrip
        status={status}
        isCheckedIn={isCheckedIn}
        liveSessionElapsed={liveSessionElapsed}
        dateLine={dateLine}
        statusLoading={statusLoading}
        checkInOutLoading={checkInOutLoading}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
      />
    );
  }

  return (
    <AttendanceReadonlyStatusPanel
      status={status}
      isCheckedIn={isCheckedIn}
      statusLabel={statusLabel}
      liveSessionElapsed={liveSessionElapsed}
    />
  );
}

const AttendancePage = () => {
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
    [users]
  );

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [appliedUserIds, setAppliedUserIds] = useState<string[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(ITEMS_PER_PAGE);
  const rowsPerPageRef = useRef(rowsPerPage);
  rowsPerPageRef.current = rowsPerPage;
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    last_page: number;
  } | null>(null);

  const [status, setStatus] = useState<AttendanceStatusData | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [checkInOutLoading, setCheckInOutLoading] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const loadAttendance = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: {
        page: number;
        limit: number;
        user_id?: string;
        user_ids?: string[];
        date_from?: string;
        date_to?: string;
      } = {
        page,
        limit: rowsPerPage,
      };
      const normalizedUserIds = appliedUserIds
        .map((id) => String(id).trim())
        .filter(Boolean);
      if (normalizedUserIds.length > 0) {
        // Journey-compatible filter payload
        params.user_ids = normalizedUserIds;
        // Backward-compatible single user filter
      }
      const dateRange = getWorkforceTableDatePresetRange(selectedDate ?? "");
      if (dateRange) {
        params.date_from = dateRange.from;
        params.date_to = dateRange.to;
      }
      const { data, pagination: p } = await getAttendance(params);
      setRecords(data ?? []);
      if (p) {
        setPagination({
          page: p.page,
          limit: p.limit,
          total: p.total,
          last_page: p.last_page,
        });
      } else {
        setPagination(null);
      }
    } catch (err) {
      // Avoid failing silently; keep UI usable and emit diagnostics.
      console.error("Failed to load attendance records", err);
      setRecords([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [appliedUserIds, selectedDate, rowsPerPage]);

  const handlePaginationChange = useCallback((page: number, limit: number) => {
    if (rowsPerPageRef.current !== limit) {
      setRowsPerPage(limit);
      setCurrentPage(1);
      return;
    }
    setCurrentPage(page);
  }, []);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const data = await getAttendanceStatus();
      setStatus(data);
    } catch (err) {
      console.error("Failed to load attendance status", err);
      setStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAttendance(currentPage);
  }, [currentPage, loadAttendance]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedUserIds, selectedDate]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const runCheckInOutMutation = useCallback(
    async (
      mutate: () => Promise<unknown>,
      successMessage: string,
      errorMessage: string,
      logLabel: string,
    ) => {
      setCheckInOutLoading(true);
      try {
        await mutate();
        toast.success(successMessage);
        await loadStatus();
        await loadAttendance(currentPage);
      } catch (err) {
        console.error(logLabel, err);
        toast.error(errorMessage);
      } finally {
        setCheckInOutLoading(false);
      }
    },
    [currentPage, loadAttendance, loadStatus],
  );

  const handleCheckIn = useCallback(() => {
    const sessionUserId = session?.user?.id;
    const payload = sessionUserId == null ? {} : { user_id: String(sessionUserId) };
    runCheckInOutMutation(
      () => attendanceCheckIn(payload),
      "Checked in successfully",
      "Check-in failed",
      "Check-in failed",
    );
  }, [runCheckInOutMutation, session?.user?.id]);

  const handleCheckOut = useCallback(() => {
    const sessionUserId = session?.user?.id;
    const payload = sessionUserId == null ? {} : { user_id: String(sessionUserId) };
    runCheckInOutMutation(
      () => attendanceCheckOut(payload),
      "Checked out successfully",
      "Check-out failed",
      "Check-out failed",
    );
  }, [runCheckInOutMutation, session?.user?.id]);

  const handleConfirmDelete = async () => {
    if (!canDeleteAttendance || !recordToDelete) return;
    setDeleting(true);
    try {
      await deleteAttendance(recordToDelete.id);
      toast.success("Attendance record deleted");
      setShowDeleteModal(false);
      setRecordToDelete(null);
      await loadAttendance(currentPage);
    } catch (err) {
      console.error("Delete attendance record failed", err);
      toast.error("Failed to delete attendance record");
    } finally {
      setDeleting(false);
    }
  };

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
    [
      attendanceUserDropdownRows,
      selectedUserIds,
      toggleSelectedUserId,
      userSearchTerm,
    ],
  );

  const dateFilterOptions = useMemo(
    () => [
      {
        label: "All Dates",
        value: "__all__",
        onClick: () => setSelectedDate(""),
      },
      ...dateOptions.map((option) => ({
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
          row.check_in_at
            ? moment(row.check_in_at).format(GlobalDateTimeFormat)
            : "-",
      },
      {
        key: "check_out_at",
        label: "Check Out",
        type: "text",
        sortable: false,
        accessor: (row) =>
          row.check_out_at
            ? moment(row.check_out_at).format(GlobalDateTimeFormat)
            : "-",
      },
    ],
    [getDisplayName],
  );

  const isCheckedIn = status?.is_checked_in === true;
  const canCheckInOut = Boolean(
    session?.user?.permissions?.includes(PERMISSIONS.CHECK_IN_OUT_ATTENDENCE_STAFF_MANAGEMENT),
  );

  const sessionCheckInAt =
    status?.is_checked_in === true && status?.attendance?.check_in_at
      ? String(status.attendance.check_in_at)
      : null;
  const liveSessionElapsed = useLiveSessionElapsed(sessionCheckInAt);

  const statusContent = (
    <AttendanceStatusDisplay
      statusLoading={statusLoading}
      status={status}
      isCheckedIn={isCheckedIn}
      canCheckInOut={canCheckInOut}
      liveSessionElapsed={liveSessionElapsed}
      checkInOutLoading={checkInOutLoading}
      onCheckIn={handleCheckIn}
      onCheckOut={handleCheckOut}
    />
  );

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
        <div
          className="attendance-toolbar-right"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "60px",
            flexWrap: "wrap",
          }}
        >
          <div
            className="attendance-status-content"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            {statusContent}
          </div>
        </div>
      ),
    }),
    [
      attendanceFilterPills,
      pagination?.total,
      statusContent,
      session?.user?.permissions,
      isCheckedIn,
      statusLoading,
      checkInOutLoading,
    ],
  );

  return (
    <div className="attendance-page-shell">
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Attendance" />

      {/* <PageHeader title="Attendance" showSearch={false} /> */}

        <GenericTable<AttendanceRecord>
          data={records}
          columns={attendanceColumns}
          showActions={true}
          actionsLabel="Actions"
          loading={loading}
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
        itemName={recordToDelete ? `${getDisplayName(recordToDelete.user_id)} (attendance #${recordToDelete.id})` : undefined}
        itemType="attendance record"
        loading={deleting}
      />

    </div>
  );
};

AttendancePage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AttendancePage;
