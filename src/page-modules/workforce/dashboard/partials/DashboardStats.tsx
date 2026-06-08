import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle, MessageSquare, Send, AlertTriangle, Circle } from "lucide-react";
import { workforceKeys } from "@query/keys";
import { getEmployeeDashboardCounters, type EmployeeDashboardParams } from "@utils/staffManagement";
import {
  serializeEmployeeDashboardParamsKey,
  type EmployeeDashboardCounters,
} from "../dashboardDomain";

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
          <div className="employees-dashboard-stats__icon-wrap employees-dashboard-stats__icon-wrap--indigo">
            <Users size={24} color="#0066CC" strokeWidth={2} />
          </div>
          <div className="employees-dashboard-stats__big-number">{counters?.employees?.total ?? 0}</div>
        </div>
        <div className="employees-dashboard-stats__label">Total Employees</div>
        <div className="employees-dashboard-stats__sub-row">
          <Circle size={8} fill="#0066CC" color="#0066CC" />
          <span>
            {counters?.employees?.active ?? 0} Active / {counters?.employees?.inactive ?? 0} Inactive
          </span>
        </div>
        <div className="employees-dashboard-stats__footnote">Total: {counters?.employees?.total ?? 0}</div>
      </div>

      <div className="employees-dashboard-stats__card">
        <div className="employees-dashboard-stats__top-row">
          <div className="employees-dashboard-stats__icon-wrap employees-dashboard-stats__icon-wrap--green">
            <CheckCircle size={24} color="#0052A3" strokeWidth={2} />
          </div>
          <div className="employees-dashboard-stats__big-number">{counters?.approvals?.pending ?? 0}</div>
        </div>
        <div className="employees-dashboard-stats__label">Pending Approvals</div>
        <span className="employees-dashboard-stats__badge-warn">
          ⏰ {counters?.approvals?.aging?.["8_plus_days"] ?? 0} overdue
        </span>
        <div className="employees-dashboard-stats__sub-row employees-dashboard-stats__sub-row--spaced">
          <Circle size={8} fill="#0066CC" color="#0066CC" />
          <span>
            0–3d: {counters?.approvals?.aging?.["0_3_days"] ?? 0} · 4–7d:{" "}
            {counters?.approvals?.aging?.["4_7_days"] ?? 0} · 8+d:{" "}
            {counters?.approvals?.aging?.["8_plus_days"] ?? 0}
          </span>
        </div>
      </div>

      <div className="employees-dashboard-stats__card">
        <div className="employees-dashboard-stats__top-row">
          <div className="employees-dashboard-stats__icon-wrap employees-dashboard-stats__icon-wrap--amber">
            <MessageSquare size={24} color="#0066CC" strokeWidth={2} />
          </div>
          <div className="employees-dashboard-stats__big-number">{counters?.leave?.on_leave_today ?? 0}</div>
        </div>
        <div className="employees-dashboard-stats__label">On Leave Today</div>
        <button
          type="button"
          className="employees-dashboard-stats__link"
          onClick={onViewCalendar}
        >
          View calendar →
        </button>
      </div>

      <div className="employees-dashboard-stats__card">
        <div className="employees-dashboard-stats__top-row">
          <div className="employees-dashboard-stats__icon-wrap employees-dashboard-stats__icon-wrap--violet">
            <Send size={24} color="#0066CC" strokeWidth={2} />
          </div>
          <div className="employees-dashboard-stats__big-number">{counters?.journey?.in_progress ?? 0}</div>
        </div>
        <div className="employees-dashboard-stats__label">Journey Overdue</div>
        <div className="employees-dashboard-stats__sub-row employees-dashboard-stats__sub-row--spaced">
          <Circle size={8} fill="#0052A3" color="#0052A3" />
          <span>{counters?.journey?.overdue ?? 0} Due Soon</span>
        </div>
      </div>

      <div className="employees-dashboard-stats__card">
        <div className="employees-dashboard-stats__top-row">
          <div className="employees-dashboard-stats__icon-wrap employees-dashboard-stats__icon-wrap--alert">
            <AlertTriangle size={24} color="#0052A3" strokeWidth={2} />
          </div>
          <div className="employees-dashboard-stats__big-number">{counters?.compliance_alerts?.total ?? 0}</div>
        </div>
        <div className="employees-dashboard-stats__label">Compliance Alerts</div>
        <div className="employees-dashboard-stats__badge-stack">
          <span className="employees-dashboard-stats__severity employees-dashboard-stats__severity--high">
            High {counters?.compliance_alerts?.high ?? 0}
          </span>
          <span className="employees-dashboard-stats__severity employees-dashboard-stats__severity--med">
            Med {counters?.compliance_alerts?.medium ?? 0}
          </span>
          <span className="employees-dashboard-stats__severity employees-dashboard-stats__severity--low">
            Low {counters?.compliance_alerts?.low ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
