import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import PageHeader from "@components/PageHeader";
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
import { Button, Spinner } from "react-bootstrap";
import moment from "moment";
import { GlobalDateTimeFormat } from "@utils/Helper";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { useSession } from "next-auth/react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock, LogIn, LogOut, Trash2, User } from "lucide-react";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

const ITEMS_PER_PAGE = 15;

const Attendences = () => {
  const { data: session } = useSession();
  const { mainAppUsers } = useMainAppLookups();

  const getDisplayName = useCallback(
    (userId: string | number | null | undefined): string => {
      if (userId == null || userId === "") return "—";
      const idStr = String(userId);
      const u = mainAppUsers?.find((x) => String(x.id) === idStr);
      return u?.name ?? idStr;
    },
    [mainAppUsers]
  );

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
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
      const params: { page: number; limit: number; user_id?: string } = {
        page,
        limit: ITEMS_PER_PAGE,
      };
      if (selectedUserId != null && selectedUserId.trim()) params.user_id = selectedUserId.trim();
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
    } catch {
      setRecords([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const data = await getAttendanceStatus();
      setStatus(data);
    } catch {
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
  }, [selectedUserId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleCheckIn = async () => {
    setCheckInOutLoading(true);
    try {
      const payload = selectedUserId != null && selectedUserId.trim() ? { user_id: selectedUserId.trim() } : {};
      await attendanceCheckIn(payload);
      toast.success("Checked in successfully");
      await loadStatus();
      await loadAttendance(currentPage);
    } finally {
      setCheckInOutLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckInOutLoading(true);
    try {
      const payload = selectedUserId != null && selectedUserId.trim() ? { user_id: selectedUserId.trim() } : {};
      await attendanceCheckOut(payload);
      toast.success("Checked out successfully");
      await loadStatus();
      await loadAttendance(currentPage);
    } finally {
      setCheckInOutLoading(false);
    }
  };

  const openDeleteModal = (record: AttendanceRecord) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleting(true);
    try {
      await deleteAttendance(recordToDelete.id);
      toast.success("Attendance record deleted");
      setShowDeleteModal(false);
      setRecordToDelete(null);
      await loadAttendance(currentPage);
    } finally {
      setDeleting(false);
    }
  };

  const statusAccent = status?.is_checked_in ? "#059669" : "#d97706";
  const statusBg = status?.is_checked_in ? "#ecfdf5" : "#fffbeb";

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Attendences" />

      <PageHeader title="Attendences" showSearch={false} />

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
            {statusLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Clock size={20} style={{ color: "#9ca3af" }} />
                <span style={{ fontSize: "14px", color: "#6b7280" }}>Loading status…</span>
              </div>
            ) : status ? (
              <>
              {records.length > 0 && (
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
                    color: status.is_checked_in ? "#065f46" : "#92400e",
                  }}
                >
                  <Clock size={18} />
                  {status.is_checked_in ? "Checked in" : "Checked out"}
                </div>
                )}
                {status.work_date && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#6b7280" }}>
                    <Calendar size={16} />
                    {moment(status.work_date).format("dddd, DD MMM YYYY")}
                  </div>
                )}
                {status.is_checked_in && status.attendance?.check_in_at && (
                  <span style={{ fontSize: "13px", color: "#6b7280" }}>
                    Since {moment(status.attendance.check_in_at).format("hh:mm A")}
                  </span>
                )}
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#6b7280" }}>
                <Clock size={18} />
                Status unavailable
              </div>
            )}
          </div>
          {session?.user?.permissions?.includes('check-in-out-attendence-staff-management') && (
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              variant="success"
              size="sm"
              disabled={statusLoading || checkInOutLoading || (status?.is_checked_in === true)}
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
              disabled={statusLoading || checkInOutLoading || (status?.is_checked_in !== true)}
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

      {/* User filter dropdown */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <button
            type="button"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            style={{
              padding: "10px 16px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "14px",
              minWidth: "180px",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={16} />
              <span>
                {selectedUserId != null
                  ? (mainAppUsers?.find((u) => String(u.id) === selectedUserId)?.name ?? selectedUserId)
                  : "All Users"}
              </span>
            </div>
            <ChevronDown size={16} />
          </button>
          {showUserDropdown && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "4px",
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                zIndex: 10,
                minWidth: "220px",
                maxHeight: "280px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>
                <input
                  type="text"
                  placeholder="Search user..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "6px",
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                <div
                  onClick={() => {
                    setSelectedUserId(null);
                    setShowUserDropdown(false);
                    setUserSearchTerm("");
                  }}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#6366f1",
                    backgroundColor: selectedUserId === null ? "#f3f4f6" : "white",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = selectedUserId === null ? "#f3f4f6" : "white")}
                >
                  All Users
                </div>
                {(mainAppUsers ?? [])
                  .filter((u) => !userSearchTerm.trim() || (u.name?.toLowerCase().includes(userSearchTerm.trim().toLowerCase()) ?? false))
                  .map((u) => {
                    const uid = String(u.id);
                    const isSelected = selectedUserId != null && uid === selectedUserId;
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUserId(uid);
                          setShowUserDropdown(false);
                          setUserSearchTerm("");
                        }}
                        style={{
                          padding: "10px 16px",
                          cursor: "pointer",
                          fontSize: "14px",
                          backgroundColor: isSelected ? "#f3f4f6" : "white",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? "#f3f4f6" : "white")}
                      >
                        {u.name}
                      </div>
                    );
                  })}
              </div>
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

      {/* Table */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <User size={14} />
                    User Name
                  </span>
                </th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={14} />
                    Work Date
                  </span>
                </th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Check In
                </th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Check Out
                </th>
                <th style={{ padding: "14px 16px", textAlign: "center", fontSize: "12px", fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", width: 100 }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <Spinner animation="border" size="sm" style={{ color: "#6366f1" }} />
                      <span style={{ fontSize: "14px", color: "#6b7280" }}>Loading records…</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <div style={{ padding: "16px", backgroundColor: "#f3f4f6", borderRadius: "12px" }}>
                        <Calendar size={32} style={{ color: "#9ca3af" }} />
                      </div>
                      <span style={{ fontSize: "15px", fontWeight: "500", color: "#374151" }}>No attendance records</span>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>Check in to create your first record</span>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record, index) => (
                  <tr
                    key={record.id}
                    style={{
                      borderBottom: index < records.length - 1 ? "1px solid #f3f4f6" : "none",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    <td style={{ padding: "16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "500", color: "#1f2937" }}>
                        <User size={16} style={{ color: "#9ca3af", flexShrink: 0 }} />
                        {getDisplayName(record.user_id)}
                      </span>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                      {record.work_date ? moment(record.work_date).format("DD MMM YYYY") : "—"}
                    </td>
                    <td style={{ padding: "16px", fontSize: "13px", color: "#4b5563" }}>
                      {record.check_in_at
                        ? moment(record.check_in_at).format(GlobalDateTimeFormat)
                        : "—"}
                    </td>
                    <td style={{ padding: "16px", fontSize: "13px", color: "#4b5563" }}>
                      {record.check_out_at
                        ? moment(record.check_out_at).format(GlobalDateTimeFormat)
                        : "—"}
                    </td>
                    <td style={{ padding: "16px", textAlign: "center" }}>
                      {/* {session?.user?.permissions?.includes('delete-attendence-staff-management') && ( */}
                      <button
                        type="button"
                        onClick={() => openDeleteModal(record)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "8px",
                          color: "#6b7280",
                          borderRadius: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "background-color 0.15s ease, color 0.15s ease",
                        }}
                        title="Delete record"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#fef2f2";
                          e.currentTarget.style.color = "#dc2626";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#6b7280";
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                      {/* )} */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              padding: "14px 20px",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#fafafa",
            }}
          >
            <span style={{ fontSize: "13px", color: "#6b7280" }}>
              Showing page {pagination.page} of {pagination.last_page}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{ minWidth: 36 }}
              >
                <ChevronLeft size={16} />
              </Button>
              <span
                style={{
                  padding: "6px 14px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#374151",
                  minWidth: 72,
                  textAlign: "center",
                }}
              >
                {pagination.page} / {pagination.last_page}
              </span>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={pagination.page >= pagination.last_page || loading}
                onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
                style={{ minWidth: 36 }}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

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

Attendences.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default Attendences;
