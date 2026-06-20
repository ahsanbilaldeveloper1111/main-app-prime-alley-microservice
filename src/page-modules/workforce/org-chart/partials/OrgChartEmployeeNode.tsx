import React from "react";
import { Calendar, User } from "lucide-react";
import {
  formatAttendanceLabel,
  type ApiOrgChartNode,
  type OrgChartEmployee,
} from "../orgChartDomain";

type OrgChartNodeIdentityProps = Readonly<{ employee: OrgChartEmployee }>;

function OrgChartNodeIdentity({ employee }: OrgChartNodeIdentityProps): React.ReactElement {
  const titleClass =
    employee.status === "On Leave"
      ? "org-chart-page__node-title org-chart-page__node-title--leave-gap"
      : "org-chart-page__node-title";

  return (
    <>
      <div className="org-chart-page__node-avatar">
        <User size={32} color="white" />
      </div>
      <h4 className="org-chart-page__node-name">{employee.name}</h4>
      <div className={titleClass}>{employee.title}</div>
    </>
  );
}

function OrgChartNodeStatusChips({ employee }: OrgChartNodeIdentityProps): React.ReactElement {
  return (
    <>
      {employee.status === "On Leave" && (
        <span className="org-chart-page__chip-row org-chart-page__chip-row--leave">
          <Calendar size={12} color="#92400e" />
          On Leave
        </span>
      )}
      {employee.status === "Inactive" && (
        <span className="org-chart-page__chip-row org-chart-page__chip-row--inactive">Inactive</span>
      )}
      {employee.status === "Active" && employee.id !== "1" && employee.id !== "root" && (
        <span className="org-chart-page__chip-row org-chart-page__chip-row--active">● Active</span>
      )}
    </>
  );
}

type OrgChartNodeAttendanceProps = Readonly<{
  employeeId: string;
  attendanceLabel: string;
  timeStr: string;
}>;

function OrgChartNodeAttendance({
  employeeId,
  attendanceLabel,
  timeStr,
}: OrgChartNodeAttendanceProps): React.ReactElement | null {
  if (employeeId === "root") return null;
  return (
    <div className="org-chart-page__node-attendance">
      {attendanceLabel}
      {timeStr ? ` · ${timeStr}` : ""}
    </div>
  );
}

export type OrgChartEmployeeNodeProps = Readonly<{
  employee: OrgChartEmployee;
  selectedUserIds: readonly string[];
  selectedUserSubtreeIds: Set<string>;
  activeChartUserId?: string | null;
  rawProfileById: Record<string, ApiOrgChartNode>;
  onNodeSelect: (emp: OrgChartEmployee) => void;
}>;

export function OrgChartEmployeeNode(props: OrgChartEmployeeNodeProps): React.ReactElement {
  const {
    employee,
    selectedUserIds,
    selectedUserSubtreeIds,
    activeChartUserId = null,
    rawProfileById,
    onNodeSelect,
  } = props;
  const isRoot = employee.id === "root";
  const uid = employee.userId?.trim() ?? "";
  const hasUserFilter = selectedUserIds.length > 0;
  const hasActiveSelection = Boolean(activeChartUserId);

  let isSelectedUser = false;
  let isChildHighlight = false;
  let shouldFade = false;

  if (hasActiveSelection) {
    isSelectedUser = Boolean(uid && activeChartUserId === uid);
    shouldFade = !isSelectedUser && employee.id !== "root";
  } else {
    isSelectedUser = Boolean(uid && selectedUserIds.includes(uid));
    const isInSelectedSubtree = Boolean(hasUserFilter && selectedUserSubtreeIds.has(employee.id));
    const highlightActive = hasUserFilter && selectedUserSubtreeIds.size > 0;
    shouldFade = Boolean(highlightActive && !isInSelectedSubtree && employee.id !== "root");
    isChildHighlight = isInSelectedSubtree && !isSelectedUser;
  }

  const openSidebar = () => {
    onNodeSelect(employee);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isRoot) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openSidebar();
    }
  };

  const rawNode = rawProfileById[employee.id];
  const attendance = rawNode?.attendance as
    | { status?: string; check_in_at?: string | null; check_out_at?: string | null }
    | undefined;
  const attStatus = attendance?.status;
  const attendanceLabel = formatAttendanceLabel(attStatus);
  const timeSource = attStatus === "checked_out" ? attendance?.check_out_at : attendance?.check_in_at;
  const timeStr = timeSource
    ? new Date(timeSource).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "";

  const interactionProps = isRoot
    ? {}
    : {
        role: "button" as const,
        tabIndex: 0 as const,
        onClick: openSidebar,
        onKeyDown: handleKeyDown,
      };

  let fadeClass = "";
  if (shouldFade) {
    fadeClass = hasActiveSelection ? "org-chart-page__node--muted" : "org-chart-page__node--fade";
  }

  const nodeClass = [
    "org-chart-page__node",
    isRoot ? "org-chart-page__node--root" : "",
    isSelectedUser ? "org-chart-page__node--selected" : "",
    isChildHighlight ? "org-chart-page__node--subtree" : "",
    fadeClass,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      {...(employee.userId ? { "data-org-chart-user-id": employee.userId } : {})}
      {...interactionProps}
      className={nodeClass}
    >
      <OrgChartNodeIdentity employee={employee} />
      <OrgChartNodeStatusChips employee={employee} />
      <OrgChartNodeAttendance employeeId={employee.id} attendanceLabel={attendanceLabel} timeStr={timeStr} />
    </div>
  );
}
