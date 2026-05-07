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
  selectedUserId: string;
  selectedUserSubtreeIds: Set<string>;
  rawProfileById: Record<string, ApiOrgChartNode>;
  onNodeSelect: (emp: OrgChartEmployee) => void;
}>;

export function OrgChartEmployeeNode(props: OrgChartEmployeeNodeProps): React.ReactElement {
  const { employee, selectedUserId, selectedUserSubtreeIds, rawProfileById, onNodeSelect } = props;
  const isRoot = employee.id === "root";
  const isSelectedUser = Boolean(selectedUserId && employee.userId === selectedUserId);
  const isInSelectedSubtree = Boolean(selectedUserId && selectedUserSubtreeIds.has(employee.id));
  const highlightActive = Boolean(selectedUserId) && selectedUserSubtreeIds.size > 0;
  const shouldFade = Boolean(highlightActive && !isInSelectedSubtree && employee.id !== "root");
  const isChildHighlight = isInSelectedSubtree && !isSelectedUser;

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

  const nodeClass = [
    "org-chart-page__node",
    isRoot ? "org-chart-page__node--root" : "",
    isSelectedUser ? "org-chart-page__node--selected" : "",
    isChildHighlight ? "org-chart-page__node--subtree" : "",
    shouldFade ? "org-chart-page__node--fade" : "",
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
