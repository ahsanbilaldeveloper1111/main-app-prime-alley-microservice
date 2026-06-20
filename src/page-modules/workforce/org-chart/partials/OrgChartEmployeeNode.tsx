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

type OrgChartNodeHighlightState = Readonly<{
  isSelectedUser: boolean;
  isChildHighlight: boolean;
  fadeClass: string;
}>;

type OrgChartNodeHighlightInput = Readonly<{
  employeeId: string;
  uid: string;
  activeChartUserId: string | null;
  selectedUserIds: readonly string[];
  selectedUserSubtreeIds: Set<string>;
}>;

function resolveOrgChartNodeHighlightForActiveUser(input: OrgChartNodeHighlightInput): OrgChartNodeHighlightState {
  const { employeeId, uid, activeChartUserId } = input;
  const isRootNode = employeeId === "root";
  const isSelectedUser = Boolean(uid && activeChartUserId === uid);
  const shouldFade = !isSelectedUser && !isRootNode;

  return {
    isSelectedUser,
    isChildHighlight: false,
    fadeClass: shouldFade ? "org-chart-page__node--muted" : "",
  };
}

function resolveOrgChartNodeHighlightForFilter(input: OrgChartNodeHighlightInput): OrgChartNodeHighlightState {
  const { employeeId, uid, selectedUserIds, selectedUserSubtreeIds } = input;
  const isRootNode = employeeId === "root";
  const hasUserFilter = selectedUserIds.length > 0;
  const isSelectedUser = Boolean(uid && selectedUserIds.includes(uid));
  const isInSelectedSubtree = Boolean(hasUserFilter && selectedUserSubtreeIds.has(employeeId));
  const highlightActive = hasUserFilter && selectedUserSubtreeIds.size > 0;
  const shouldFade = Boolean(highlightActive && !isInSelectedSubtree && !isRootNode);

  return {
    isSelectedUser,
    isChildHighlight: isInSelectedSubtree && !isSelectedUser,
    fadeClass: shouldFade ? "org-chart-page__node--fade" : "",
  };
}

function resolveOrgChartNodeHighlightState(input: OrgChartNodeHighlightInput): OrgChartNodeHighlightState {
  if (input.activeChartUserId) {
    return resolveOrgChartNodeHighlightForActiveUser(input);
  }
  return resolveOrgChartNodeHighlightForFilter(input);
}

type OrgChartNodeAttendanceInfo = Readonly<{
  attendanceLabel: string;
  timeStr: string;
}>;

function resolveOrgChartNodeAttendance(rawNode: ApiOrgChartNode | undefined): OrgChartNodeAttendanceInfo {
  const attendance = rawNode?.attendance;
  const attStatus = attendance?.status;
  const attendanceLabel = formatAttendanceLabel(attStatus);
  const timeSource = attStatus === "checked_out" ? attendance?.check_out_at : attendance?.check_in_at;
  const timeStr = timeSource
    ? new Date(timeSource).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : "";
  return { attendanceLabel, timeStr };
}

function buildOrgChartNodeClass(
  isRoot: boolean,
  highlight: OrgChartNodeHighlightState,
): string {
  return [
    "org-chart-page__node",
    isRoot ? "org-chart-page__node--root" : "",
    highlight.isSelectedUser ? "org-chart-page__node--selected" : "",
    highlight.isChildHighlight ? "org-chart-page__node--subtree" : "",
    highlight.fadeClass,
  ]
    .filter(Boolean)
    .join(" ");
}

export type OrgChartEmployeeNodeProps = Readonly<{
  employee: OrgChartEmployee;
  selectedUserIds: readonly string[];
  selectedUserSubtreeIds: Set<string>;
  activeChartUserId?: string | null;
  rawProfileById: Record<string, ApiOrgChartNode>;
  onNodeSelect: (emp: OrgChartEmployee) => void;
}>;

function buildOrgChartNodeInteractionProps(
  isRoot: boolean,
  openSidebar: () => void,
): Record<string, unknown> {
  if (isRoot) {
    return {};
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openSidebar();
    }
  };

  return {
    role: "button" as const,
    tabIndex: 0 as const,
    onClick: openSidebar,
    onKeyDown: handleKeyDown,
  };
}

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
  const highlight = resolveOrgChartNodeHighlightState({
    employeeId: employee.id,
    uid,
    activeChartUserId,
    selectedUserIds,
    selectedUserSubtreeIds,
  });
  const { attendanceLabel, timeStr } = resolveOrgChartNodeAttendance(rawProfileById[employee.id]);

  const openSidebar = () => {
    onNodeSelect(employee);
  };

  const interactionProps = buildOrgChartNodeInteractionProps(isRoot, openSidebar);

  return (
    <div
      {...(employee.userId ? { "data-org-chart-user-id": employee.userId } : {})}
      {...interactionProps}
      className={buildOrgChartNodeClass(isRoot, highlight)}
    >
      <OrgChartNodeIdentity employee={employee} />
      <OrgChartNodeStatusChips employee={employee} />
      <OrgChartNodeAttendance employeeId={employee.id} attendanceLabel={attendanceLabel} timeStr={timeStr} />
    </div>
  );
}
