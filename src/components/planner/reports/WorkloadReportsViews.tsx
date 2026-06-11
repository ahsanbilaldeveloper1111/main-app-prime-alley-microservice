import React, { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Network,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import { Alert, Spinner } from "react-bootstrap";
import type { TaskReportsAssigneeRow } from "@utils/taskReports";
import {
  formatReportsMemberLabel,
} from "@page-modules/planner/reports/reportsDomain";
import {
  workloadMemberAvatarColor,
  workloadMemberInitials,
} from "@page-modules/planner/workload/workloadDomain";
import {
  ReportsModalAvatar,
  ReportsModalIndex,
  ReportsModalShell,
  ReportsSortToggle,
  ReportsViewAllFooter,
} from "./ReportsListModal";

const REPORTS_EMPTY_ICON_MAP: Record<string, LucideIcon> = {
  "ti-users": Users,
  "ti-loader": Loader2,
  "ti-circle-check": CheckCircle2,
  "ti-calendar-check": CalendarCheck,
  "ti-trending-up": TrendingUp,
  "ti-topology-star": Network,
  "ti-chart-donut": PieChartIcon,
  "ti-chart-bar": BarChart3,
};

export function ReportsEmptyState({
  icon,
  title,
  subtitle,
}: Readonly<{
  icon: string;
  title: string;
  subtitle: string;
}>) {
  const EmptyIcon = REPORTS_EMPTY_ICON_MAP[icon] ?? BarChart3;
  return (
    <div className="reports-empty-state">
      <div className="reports-empty-state__icon">
        <EmptyIcon size={32} aria-hidden />
      </div>
      <div className="reports-empty-state__title">{title}</div>
      <div className="reports-empty-state__subtitle">{subtitle}</div>
    </div>
  );
}

type KpiCardProps = Readonly<{
  label: string;
  value: string | number;
  sub: string;
  delta?: string | null;
  accent?: "default" | "completed" | "overdue" | "pending" | "in_progress";
}>;

function resolveKpiAccentClass(accent: KpiCardProps["accent"]): string {
  if (accent === "completed") return "reports-kpi-card--completed";
  if (accent === "overdue") return "reports-kpi-card--overdue";
  if (accent === "pending") return "reports-kpi-card--pending";
  if (accent === "in_progress") return "reports-kpi-card--in-progress";
  return "reports-kpi-card--shade-indigo";
}

function resolveKpiDeltaClass(delta: string | null | undefined): string {
  if (!delta) return "";
  if (delta.startsWith("↑") || delta.includes("up")) return "reports-kpi-card__delta--up";
  if (delta.startsWith("↓") || delta.includes("down")) return "reports-kpi-card__delta--down";
  return "";
}

export function ReportsKpiCard({ label, value, sub, delta, accent = "default" }: KpiCardProps) {
  const accentClass = resolveKpiAccentClass(accent);
  const deltaClass = resolveKpiDeltaClass(delta);
  return (
    <div className={`reports-kpi-card ${accentClass}`.trim()}>
      <div className="reports-kpi-card__label">
        <span className="reports-kpi-card__dot" aria-hidden="true" />
        {label}
      </div>
      <div className="reports-kpi-card__value">{value}</div>
      <div className="reports-kpi-card__sub">{sub}</div>
      {delta ? (
        <div className={`reports-kpi-card__delta ${deltaClass}`.trim()}>{delta}</div>
      ) : null}
    </div>
  );
}

function resolveMemberPerfBarColor(pct: number): string {
  if (pct === 0) return "#9ca3af";
  if (pct >= 75) return "#16a34a";
  if (pct >= 50) return "#f59e0b";
  return "#ef4444";
}

function resolveMemberPerfPct(row: TaskReportsAssigneeRow): number {
  const total = row.total_tasks ?? row.task_count ?? 0;
  const done = row.done_count ?? row.completed_tasks ?? 0;
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function sortMemberPerfRows(
  rows: TaskReportsAssigneeRow[],
  sortOrder: "worst" | "best",
): TaskReportsAssigneeRow[] {
  return [...rows].sort((a, b) => {
    const pctA = resolveMemberPerfPct(a);
    const pctB = resolveMemberPerfPct(b);
    return sortOrder === "worst" ? pctA - pctB : pctB - pctA;
  });
}

export function ReportsMemberPerformanceBars({
  rows,
  hierarchyExtensions,
}: Readonly<{
  rows: TaskReportsAssigneeRow[];
  hierarchyExtensions?: unknown[] | null;
}>) {
  const [sortOrder, setSortOrder] = useState<"worst" | "best">("worst");
  const [showAll, setShowAll] = useState(false);
  const [modalSortOrder, setModalSortOrder] = useState<"worst" | "best">("worst");
  const [searchQuery, setSearchQuery] = useState("");

  if (rows.length === 0) {
    return <p className="small text-muted mb-0">No member data for this period.</p>;
  }

  const sortedRows = sortMemberPerfRows(rows, sortOrder);
  const displayedRows = sortedRows.slice(0, 10);
  const modalRows = sortMemberPerfRows(rows, modalSortOrder).filter((row) => {
    const label = formatReportsMemberLabel(row, hierarchyExtensions);
    return label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      <div className="reports-sort-toggle-wrap">
        <ReportsSortToggle value={sortOrder} onChange={setSortOrder} />
      </div>
      <div className="reports-member-perf-list">
        {displayedRows.map((row) => {
          const ext = row.extension_number ?? "";
          const label = formatReportsMemberLabel(row, hierarchyExtensions);
          const done = row.done_count ?? row.completed_tasks ?? 0;
          const total = row.total_tasks ?? row.task_count ?? 1;
          const pct = resolveMemberPerfPct(row);
          const barColor = resolveMemberPerfBarColor(pct);
          return (
            <div key={ext || label} className="reports-member-perf-row">
              <span
                className="reports-assignee-row__avatar"
                style={{ backgroundColor: workloadMemberAvatarColor(ext) }}
                aria-hidden
              >
                {workloadMemberInitials(ext, hierarchyExtensions, row)}
              </span>
              <div className="reports-member-perf-row__meta">
                <div className="reports-member-perf-row__name">{label}</div>
                <div className="reports-member-perf-row__sub">{done}/{total} tasks complete</div>
                <div className="reports-member-perf-bar">
                  <div
                    className="reports-member-perf-bar__fill"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
              <span className="reports-member-perf-row__pct" style={{ color: barColor }}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
      <ReportsViewAllFooter
        count={sortedRows.length}
        label="members"
        onClick={() => setShowAll(true)}
      />
      {showAll ? (
        <ReportsModalShell
          ariaLabel="Member Performance"
          onClose={() => setShowAll(false)}
          dialogClassName="reports-modal-dialog--members"
          title="Member Performance"
          subtitle={`All ${sortedRows.length} members`}
          searchPlaceholder="Search member..."
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          headerActions={<ReportsSortToggle value={modalSortOrder} onChange={setModalSortOrder} />}
          bodyClassName="reports-modal-body reports-modal-body--list-padded"
        >
          {modalRows.map((row, idx) => {
            const ext = row.extension_number?.trim() ?? "";
            const label = formatReportsMemberLabel(row, hierarchyExtensions);
            const pct = resolveMemberPerfPct(row);
            const barColor = resolveMemberPerfBarColor(pct);
            return (
              <div key={ext || label} className="reports-modal-perf-row">
                <ReportsModalIndex index={idx} />
                <ReportsModalAvatar
                  backgroundColor={workloadMemberAvatarColor(ext)}
                  initials={workloadMemberInitials(ext, hierarchyExtensions, row)}
                />
                <div className="reports-modal-perf-row__meta">
                  <div className="reports-modal-perf-row__name">{label}</div>
                  <div className="reports-modal-perf-row__bar">
                    <div
                      className="reports-modal-perf-row__bar-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: barColor,
                        minWidth: pct > 0 ? "2px" : "0",
                      }}
                    />
                  </div>
                </div>
                <span className="reports-modal-perf-row__pct" style={{ color: barColor }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </ReportsModalShell>
      ) : null}
    </>
  );
}

export function ReportsLoadingBlock() {
  return (
    <div className="text-center py-5">
      <Spinner animation="border" />
      <p className="small text-muted mt-2 mb-0">Loading report data…</p>
    </div>
  );
}

export function ReportsErrorBlock({ message }: Readonly<{ message: string }>) {
  return <Alert variant="danger">{message}</Alert>;
}
