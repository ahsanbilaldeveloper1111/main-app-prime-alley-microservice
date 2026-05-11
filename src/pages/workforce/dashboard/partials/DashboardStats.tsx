import React, { useState, useEffect } from "react";
import { Users, CheckCircle, MessageSquare, Send, AlertTriangle, Circle } from "lucide-react";
import { getEmployeeDashboardCounters, type EmployeeDashboardParams } from "@utils/staffManagement";

export interface EmployeeDashboardCounters {
  employees?: { total?: number; active?: number; inactive?: number };
  approvals?: {
    pending?: number;
    aging?: { "0_3_days"?: number; "4_7_days"?: number; "8_plus_days"?: number };
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

interface DashboardStatsProps {
  onViewCalendar?: (e: React.MouseEvent) => void;
  params?: EmployeeDashboardParams;
  /** Increment to refetch counters without changing filters (mutations, tab focus, company context). */
  refreshToken?: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  onViewCalendar,
  params,
  refreshToken = 0,
}) => {
  const [counters, setCounters] = useState<EmployeeDashboardCounters | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounters = async () => {
      setLoading(true);
      try {
        const data = await getEmployeeDashboardCounters(params);
        setCounters((data as EmployeeDashboardCounters) ?? null);
      } catch (e) {
        console.error("[DashboardStats] getEmployeeDashboardCounters error", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCounters();
  }, [
    params?.days,
    params?.period_type,
    params?.date,
    params?.start_date,
    params?.end_date,
    refreshToken,
  ]);

  if (loading) {
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "16px",
      }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              padding: "20px",
              border: "1px solid #F3F4F6",
              minHeight: "140px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: "12px", color: "#6B7280" }}>Loading…</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginBottom: "16px",
    }}>
      {/* Total Employees */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid #F3F4F6",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Users size={24} color="#6366F1" strokeWidth={2} />
          </div>
          <div style={{ fontSize: "36px", fontWeight: "700", color: "#111827", lineHeight: "1" }}>
            {counters?.employees?.total ?? 0}
          </div>
        </div>
        <div style={{ fontSize: "14px", color: "#6B7280", fontWeight: "500", marginBottom: "12px" }}>
          Total Employees
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#374151" }}>
          <Circle size={8} fill="#6366F1" color="#6366F1" />
          <span>{counters?.employees?.active ?? 0} Active / {counters?.employees?.inactive ?? 0} Inactive</span>
        </div>
        <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "8px" }}>Total: {counters?.employees?.total ?? 0}</div>
      </div>

      {/* Pending Approvals */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid #F3F4F6",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "#D1FAE5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <CheckCircle size={24} color="#10B981" strokeWidth={2} />
          </div>
          <div style={{ fontSize: "36px", fontWeight: "700", color: "#111827", lineHeight: "1" }}>
            {counters?.approvals?.pending ?? 0}
          </div>
        </div>
        <div style={{ fontSize: "14px", color: "#6B7280", fontWeight: "500", marginBottom: "12px" }}>
          Pending Approvals
        </div>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 10px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          background: "#FEF3C7",
          color: "#92400E",
        }}>
          ⏰ {counters?.approvals?.aging?.["8_plus_days"] ?? 0} overdue
        </span>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          color: "#374151",
          marginTop: "8px",
        }}>
          <Circle size={8} fill="#F59E0B" color="#F59E0B" />
          <span>0–3d: {counters?.approvals?.aging?.["0_3_days"] ?? 0} · 4–7d: {counters?.approvals?.aging?.["4_7_days"] ?? 0} · 8+d: {counters?.approvals?.aging?.["8_plus_days"] ?? 0}</span>
        </div>
      </div>

      {/* On Leave Today */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid #F3F4F6",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <MessageSquare size={24} color="#F59E0B" strokeWidth={2} />
          </div>
          <div style={{ fontSize: "36px", fontWeight: "700", color: "#111827", lineHeight: "1" }}>
            {counters?.leave?.on_leave_today ?? 0}
          </div>
        </div>
        <div style={{ fontSize: "14px", color: "#6B7280", fontWeight: "500", marginBottom: "12px" }}>
          On Leave Today
        </div>
        <a
          href="#"
          onClick={onViewCalendar}
          style={{
            fontSize: "13px",
            color: "#6366F1",
            textDecoration: "none",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          View calendar →
        </a>
      </div>

      {/* Pending Acknowledgments */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid #F3F4F6",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "#EDE9FE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Send size={24} color="#8B5CF6" strokeWidth={2} />
          </div>
          <div style={{ fontSize: "36px", fontWeight: "700", color: "#111827", lineHeight: "1" }}>
            {counters?.journey?.in_progress ?? 0}
          </div>
        </div>
        <div style={{ fontSize: "14px", color: "#6B7280", fontWeight: "500", marginBottom: "12px" }}>
          Journey Overdue
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "13px",
          color: "#374151",
          marginTop: "8px",
        }}>
          <Circle size={8} fill="#F59E0B" color="#F59E0B" />
          <span>{counters?.journey?.overdue ?? 0} Due Soon</span>
        </div>
      </div>

      {/* Compliance Alerts */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        padding: "20px",
        border: "1px solid #F3F4F6",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "#FEE2E2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <AlertTriangle size={24} color="#EF4444" strokeWidth={2} />
          </div>
          <div style={{ fontSize: "36px", fontWeight: "700", color: "#111827", lineHeight: "1" }}>
            {counters?.compliance_alerts?.total ?? 0}
          </div>
        </div>
        <div style={{ fontSize: "14px", color: "#6B7280", fontWeight: "500", marginBottom: "12px" }}>
          Compliance Alerts
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <span style={{
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "600",
            background: "#FEE2E2",
            color: "#991B1B",
          }}>
            High {counters?.compliance_alerts?.high ?? 0}
          </span>
          <span style={{
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "600",
            background: "#FEF3C7",
            color: "#92400E",
          }}>
            Med {counters?.compliance_alerts?.medium ?? 0}
          </span>
          <span style={{
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "600",
            background: "#F3F4F6",
            color: "#374151",
          }}>
            Low {counters?.compliance_alerts?.low ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
