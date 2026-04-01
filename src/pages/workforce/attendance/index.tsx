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
  TableAction,
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
import { Calendar, Clock, LogIn, LogOut, Trash2 } from "lucide-react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

const ITEMS_PER_PAGE = 15;

const dateOptions = ["Today", "Last 7 days", "Last 30 days", "Last 3 months", "All time"];

type MainAppUser = {
  id: string | number;
  name?: string | null;
};

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

function getDateRangeForOption(option: string): { date_from: string; date_to: string } | null {
  if (!option?.trim()) return null;
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const toStr = to.toISOString().slice(0, 10);
  const from = new Date(now);
  switch (option.trim()) {
    case "Today":
      return { date_from: toStr, date_to: toStr };
    case "Last 7 days":
      from.setDate(from.getDate() - 7);
      break;
    case "Last 30 days":
      from.setDate(from.getDate() - 30);
      break;
    case "Last 3 months":
      from.setMonth(from.getMonth() - 3);
      break;
    case "All time":
    default:
      return null;
  }
  from.setHours(0, 0, 0, 0);
  const fromStr = from.toISOString().slice(0, 10);
  return { date_from: fromStr, date_to: toStr };
}

const AttendancePage = () => {
  const { data: session } = useSession();
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

  const [selectedUserId, setSelectedUserId] = useState<string>("");
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

  const loadAttendance = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; user_id?: string; date_from?: string; date_to?: string } = {
        page,
        limit: rowsPerPage,
      };
      if (selectedUserId.trim()) params.user_id = selectedUserId.trim();
      const dateRange = getDateRangeForOption(selectedDate ?? "");
      if (dateRange) {
        params.date_from = dateRange.date_from;
        params.date_to = dateRange.date_to;
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
  }, [selectedUserId, selectedDate, rowsPerPage]);

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
  }, [selectedUserId, selectedDate]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleCheckIn = async () => {
    setCheckInOutLoading(true);
    try {
      const sessionUserId = session?.user?.id;
      const payload = sessionUserId == null ? {} : { user_id: String(sessionUserId) };
      await attendanceCheckIn(payload);
      toast.success("Checked in successfully");
      await loadStatus();
      await loadAttendance(currentPage);
    } catch (err) {
      console.error("Check-in failed", err);
      toast.error("Check-in failed");
    } finally {
      setCheckInOutLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckInOutLoading(true);
    try {
      const sessionUserId = session?.user?.id;
      const payload = sessionUserId == null ? {} : { user_id: String(sessionUserId) };
      await attendanceCheckOut(payload);
      toast.success("Checked out successfully");
      await loadStatus();
      await loadAttendance(currentPage);
    } catch (err) {
      console.error("Check-out failed", err);
      toast.error("Check-out failed");
    } finally {
      setCheckInOutLoading(false);
    }
  };

  const openDeleteModal = useCallback((record: AttendanceRecord) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
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

  const statusAccent = status?.is_checked_in ? "#059669" : "#d97706";
  const statusBg = status?.is_checked_in ? "#ecfdf5" : "#fffbeb";

  const userFilterOptions = useMemo(
    () => [
      {
        label: "All Users",
        value: "__all__",
        onClick: () => setSelectedUserId(""),
      },
      ...users.map((user) => ({
        label: user.name ?? String(user.id),
        value: String(user.id),
        onClick: () => setSelectedUserId(String(user.id)),
      })),
    ],
    [users],
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

  const attendanceFilterPills = useMemo<FilterPill[]>(
    () => [
      {
        id: "attendance-user-filter",
        label: "User",
        showDropdown: true,
        searchable: true,
        active: Boolean(selectedUserId),
        activeLabel: selectedUserId ? getDisplayName(selectedUserId) : undefined,
        onClear: selectedUserId ? () => setSelectedUserId("") : undefined,
        dropdownOptions: userFilterOptions,
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
      selectedUserId,
      selectedDate,
      getDisplayName,
      userFilterOptions,
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

  const attendanceActions = useMemo<TableAction<AttendanceRecord>[]>(
    () => [
      {
        label: "Delete",
        icon: <Trash2 size={16} />,
        onClick: (row) => openDeleteModal(row),
        variant: "link",
        className: "text-danger",
      },
    ],
    [openDeleteModal],
  );

  const attendanceToolbar = useMemo<ToolbarConfig>(
    () => ({
      showFilterPills: true,
      filterPills: attendanceFilterPills,
      showMoreFiltersButton: false,
    }),
    [attendanceFilterPills],
  );

  const isCheckedIn = status?.is_checked_in === true;
  const statusContent = (() => {
    if (statusLoading) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Clock size={20} style={{ color: "#9ca3af" }} />
          <span style={{ fontSize: "14px", color: "#6b7280" }}>Loading status…</span>
        </div>
      );
    }

    if (!status) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6b7280" }}>
          <Clock size={18} />
          Status unavailable
        </div>
      );
    }

    const statusText = isCheckedIn ? "Checked in" : "Checked out";
    const statusColor = isCheckedIn ? "#065f46" : "#92400e";
    return (
      <>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "600",
            backgroundColor: statusBg,
            color: statusColor,
          }}
        >
          <Clock size={18} />
          {statusText}
        </div>
        {status.work_date && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#6b7280" }}>
            <Calendar size={16} />
            {moment(status.work_date).format("dddd, DD MMM YYYY")}
          </div>
        )}
        {isCheckedIn && status.attendance?.check_in_at && (
          <span style={{ fontSize: "13px", color: "#6b7280" }}>
            Since {moment(status.attendance.check_in_at).format("hh:mm A")}
          </span>
        )}
      </>
    );
  })();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Attendance" />

      {/* <PageHeader title="Attendance" showSearch={false} /> */}

      {/* Current status & Check In / Out */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          padding: "24px 28px",
          marginBottom: "24px",
          borderLeft: `4px solid ${status ? statusAccent : "#9ca3af"}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            {statusContent}
          </div>
          {session?.user?.permissions?.includes("check-in-out-attendence-staff-management") && (
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="success"
              size="sm"
              disabled={statusLoading || checkInOutLoading || isCheckedIn}
              onClick={handleCheckIn}
              style={{
                fontWeight: "600",
                padding: "8px 16px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <LogIn size={18} />
              {checkInOutLoading ? "…" : "Check In"}
            </Button>
            <Button
              variant="warning"
              size="sm"
              disabled={statusLoading || checkInOutLoading || !isCheckedIn}
              onClick={handleCheckOut}
              style={{
                fontWeight: "600",
                padding: "8px 16px",
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <LogOut size={18} />
              {checkInOutLoading ? "…" : "Check Out"}
            </Button>
          </div>
          )}

        </div>
      </div>

      {/* Table header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#1f2937", margin: 0 }}>
            Attendance records
          </h2>
          {pagination != null && (
            <span
              style={{
                padding: "4px 12px",
                backgroundColor: "#e5e7eb",
                borderRadius: "16px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              {pagination.total}
            </span>
          )}
        </div>
      </div>

        <GenericTable<AttendanceRecord>
          data={records}
          columns={attendanceColumns}
          actions={attendanceActions}
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
    </React.Fragment>
  );
};

AttendancePage.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AttendancePage;
