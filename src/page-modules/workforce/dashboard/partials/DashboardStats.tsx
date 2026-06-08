import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle, MessageSquare, Send, AlertTriangle, Circle } from "lucide-react";
import { workforceKeys } from "@query/keys";
import { getEmployeeDashboardCounters, type EmployeeDashboardParams } from "@utils/staffManagement";
import {
  WORKFORCE_DASHBOARD_STAT_ICON_COLORS,
  workforcePaletteSoftBg,
} from "@page-modules/workforce/shared/workforceChartColors";
import {
  serializeEmployeeDashboardParamsKey,
  type EmployeeDashboardCounters,
} from "../dashboardDomain";

const STAT_COLORS = WORKFORCE_DASHBOARD_STAT_ICON_COLORS;

export type { EmployeeDashboardCounters } from "../dashboardDomain";

interface DashboardStatsProps {
  onViewCalendar?: (e: React.MouseEvent) => void;
  params?: EmployeeDashboardParams;
}

async function fetchCounters(params?: EmployeeDashboardParams): Promise<EmployeeDashboardCounters | null> {
  try {
    const data = await getEmployeeDashboardCounters(params);
    return (data as EmployeeDashboardCounters) ?? null;
  } catch (e) {
    console.error("[DashboardStats] getEmployeeDashboardCounters error", e);
    return null;
  }
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ onViewCalendar, params }) => {
  const paramsKey = serializeEmployeeDashboardParamsKey(params);

  const { data: counters, isPending } = useQuery({
    queryKey: workforceKeys.dashboard.counters(paramsKey),
    queryFn: () => fetchCounters(params),
  });

  if (isPending) {
    return (
      <div className="employees-dashboard-stats">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="employees-dashboard-stats__card employees-dashboard-stats__card--loading">
            <span className="employees-dashboard-stats__loading-text">Loading…</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="employees-dashboard-stats">
      <div className="employees-dashboard-stats__card">
        <div className="employees-dashboard-stats__top-row">
          <div
            className="employees-dashboard-stats__icon-wrap"
            style={{ backgroundColor: workforcePaletteSoftBg(STAT_COLORS[0]) }}
          >
            <Users size={24} color={STAT_COLORS[0]} strokeWidth={2} />
          </div>
          <div className="employees-dashboard-stats__big-number" style={{ color: STAT_COLORS[0] }}>
            {counters?.employees?.total ?? 0}
          </div>
        </div>
        <div className="employees-dashboard-stats__label">Total Employees</div>
        <div className="employees-dashboard-stats__sub-row">
          <Circle size={8} fill={STAT_COLORS[0]} color={STAT_COLORS[0]} />
          <span>
            {counters?.employees?.active ?? 0} Active / {counters?.employees?.inactive ?? 0} Inactive
          </span>
        </div>
        <div className="employees-dashboard-stats__footnote">Total: {counters?.employees?.total ?? 0}</div>
      </div>

      <div className="employees-dashboard-stats__card">
        <div className="employees-dashboard-stats__top-row">
          <div
            className="employees-dashboard-stats__icon-wrap"
            style={{ backgroundColor: workforcePaletteSoftBg(STAT_COLORS[1]) }}
          >
            <CheckCircle size={24} color={STAT_COLORS[1]} strokeWidth={2} />
          </div>
          <div className="employees-dashboard-stats__big-number" style={{ color: STAT_COLORS[1] }}>
            {counters?.approvals?.pending ?? 0}
          </div>
        </div>
        <div className="employees-dashboard-stats__label">Pending Approvals</div>
        <span
          className="employees-dashboard-stats__badge-warn"
          style={{
            backgroundColor: workforcePaletteSoftBg(STAT_COLORS[1]),
            color: STAT_COLORS[1],
          }}
        >
          ⏰ {counters?.approvals?.aging?.["8_plus_days"] ?? 0} overdue
        </span>
        <div className="employees-dashboard-stats__sub-row employees-dashboard-stats__sub-row--spaced">
          <Circle size={8} fill={STAT_COLORS[1]} color={STAT_COLORS[1]} />
          <span>
            0–3d: {counters?.approvals?.aging?.["0_3_days"] ?? 0} · 4–7d:{" "}
            {counters?.approvals?.aging?.["4_7_days"] ?? 0} · 8+d:{" "}
            {counters?.approvals?.aging?.["8_plus_days"] ?? 0}
          </span>
        </div>
      </div>

      <div className="employees-dashboard-stats__card">
        <div className="employees-dashboard-stats__top-row">
          <div
            className="employees-dashboard-stats__icon-wrap"
            style={{ backgroundColor: workforcePaletteSoftBg(STAT_COLORS[2]) }}
          >
            <MessageSquare size={24} color={STAT_COLORS[2]} strokeWidth={2} />
          </div>
          <div className="employees-dashboard-stats__big-number" style={{ color: STAT_COLORS[2] }}>
            {counters?.leave?.on_leave_today ?? 0}
          </div>
        </div>
        <div className="employees-dashboard-stats__label">On Leave Today</div>
        <button
          type="button"
          className="employees-dashboard-stats__link"
          style={{ color: STAT_COLORS[2] }}
          onClick={onViewCalendar}
        >
          View calendar →
        </button>
      </div>

      <div className="employees-dashboard-stats__card">
        <div className="employees-dashboard-stats__top-row">
          <div
            className="employees-dashboard-stats__icon-wrap"
            style={{ backgroundColor: workforcePaletteSoftBg(STAT_COLORS[3]) }}
          >
            <Send size={24} color={STAT_COLORS[3]} strokeWidth={2} />
          </div>
          <div className="employees-dashboard-stats__big-number" style={{ color: STAT_COLORS[3] }}>
            {counters?.journey?.in_progress ?? 0}
          </div>
        </div>
        <div className="employees-dashboard-stats__label">Journey Overdue</div>
        <div className="employees-dashboard-stats__sub-row employees-dashboard-stats__sub-row--spaced">
          <Circle size={8} fill={STAT_COLORS[3]} color={STAT_COLORS[3]} />
          <span>{counters?.journey?.overdue ?? 0} Due Soon</span>
        </div>
      </div>

      <div className="employees-dashboard-stats__card">
        <div className="employees-dashboard-stats__top-row">
          <div
            className="employees-dashboard-stats__icon-wrap"
            style={{ backgroundColor: workforcePaletteSoftBg(STAT_COLORS[4]) }}
          >
            <AlertTriangle size={24} color={STAT_COLORS[4]} strokeWidth={2} />
          </div>
          <div className="employees-dashboard-stats__big-number" style={{ color: STAT_COLORS[4] }}>
            {counters?.compliance_alerts?.total ?? 0}
          </div>
        </div>
        <div className="employees-dashboard-stats__label">Compliance Alerts</div>
        <div className="employees-dashboard-stats__badge-stack">
          <span
            className="employees-dashboard-stats__severity"
            style={{
              backgroundColor: workforcePaletteSoftBg(STAT_COLORS[1]),
              color: STAT_COLORS[1],
            }}
          >
            High {counters?.compliance_alerts?.high ?? 0}
          </span>
          <span
            className="employees-dashboard-stats__severity"
            style={{
              backgroundColor: workforcePaletteSoftBg(STAT_COLORS[0]),
              color: STAT_COLORS[0],
            }}
          >
            Med {counters?.compliance_alerts?.medium ?? 0}
          </span>
          <span
            className="employees-dashboard-stats__severity"
            style={{
              backgroundColor: workforcePaletteSoftBg(STAT_COLORS[4]),
              color: STAT_COLORS[4],
            }}
          >
            Low {counters?.compliance_alerts?.low ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
