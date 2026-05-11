import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useState, useEffect, useMemo, useCallback } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import dynamic from "next/dynamic";
import {
  getUserProfilesOrgChartTree,
  getAttendance,
  type AttendanceRecord,
} from "@utils/staffManagement";
import { getWorkforceTableDatePresetRange } from "@utils/workforceTableDatePresetRange";
import {
  ATTENDANCE_QUERY_MAX_USER_IDS,
  parseTeamUsersResponseForAttendanceScope,
} from "@utils/workforce/attendanceTeamScope";
import { canViewAllEmployeesAttendance } from "@utils/workforce/canViewAllEmployeesAttendance";
import { getTeamUsers } from "@utils/teams";
import { useSession } from "next-auth/react";
import { useMainAppLookups } from "@hooks/useMainAppLookups";
import { useUserProfilesMinified } from "@hooks/useUserProfilesMinified";
import {
  ChevronDown,
  Plus,
  Users,
  Calendar,
  ExternalLink,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  User,
} from "lucide-react";
import OrgEmployeeSidebar from "./sidebar";
import router from "next/router";
import {
  findMainAppUserByOrgChartUserId,
  mainAppUserRowKeyForSelection,
  normalizeOrgChartUserKey,
} from "@utils/workforce/orgChartMainAppUserMatch";

// Dynamically import react-organizational-chart to avoid SSR issues
const Tree = dynamic(
    () => import('react-organizational-chart').then((mod) => mod.Tree),
    { ssr: false }
  );
  const TreeNode = dynamic(
    () => import('react-organizational-chart').then((mod) => mod.TreeNode),
    { ssr: false }
  );

  /** API org-chart-tree node shape */
  interface ApiOrgChartNode {
    id?: number;
    user_id?: string;
    parent_id?: number | null;
    parent_profile_id?: number | null;
    department_id?: string;
    job_title?: string;
    status?: string;
    is_on_leave_today?: boolean;
    children?: ApiOrgChartNode[];
    [key: string]: unknown;
  }
  
  type EmployeeStatus = 'On Leave' | 'Active' | 'Inactive';

  interface Employee {
    id: string;
    userId?: string;
    name: string;
    title: string;
    department: string;
    avatar: string;
    status?: EmployeeStatus;
    children?: Employee[];
  }

function flattenOrgChartTeam(emp: Employee | null, out: Employee[] = []): Employee[] {
  if (!emp) return out;
  if (emp.id !== "root") out.push(emp);
  (emp.children ?? []).forEach((c) => flattenOrgChartTeam(c, out));
  return out;
}

function parseOrgChartTreeResponse(raw: unknown): ApiOrgChartNode[] {
  if (Array.isArray(raw)) return raw as ApiOrgChartNode[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: ApiOrgChartNode[] }).data;
  }
  return [];
}

function employeeStatusFromApiNode(node: ApiOrgChartNode): EmployeeStatus {
  if (node.is_on_leave_today) return "On Leave";
  const rawStatus = (node.status ?? "").toString().toLowerCase();
  if (rawStatus === "inactive") return "Inactive";
  return "Active";
}

function formatAttendanceLabel(attStatus: string | undefined): string {
  if (attStatus === undefined || attStatus === "" || attStatus === "none") {
    return "No Attendance";
  }
  if (attStatus === "checked_in") return "Checked in";
  if (attStatus === "checked_out") return "Checked out";
  return attStatus.replaceAll("_", " ");
}

const ORG_CHART_ATTENDANCE_PAGE_LIMIT = 200;
const ORG_CHART_ATTENDANCE_MAX_PAGES = 25;

type OrgChartNodeAttendanceShape = Readonly<{
  status: string;
  check_in_at: string | null;
  check_out_at: string | null;
}>;

function attendanceRankForMerge(status: string): number {
  if (status === "checked_out") return 2;
  if (status === "checked_in") return 1;
  return 0;
}

function attendanceSummaryFromRecord(record: AttendanceRecord): OrgChartNodeAttendanceShape {
  if (record.check_out_at) {
    return {
      status: "checked_out",
      check_in_at: record.check_in_at,
      check_out_at: record.check_out_at,
    };
  }
  if (record.check_in_at) {
    return {
      status: "checked_in",
      check_in_at: record.check_in_at,
      check_out_at: record.check_out_at ?? null,
    };
  }
  return { status: "none", check_in_at: null, check_out_at: null };
}

function collectUniqueOrgChartUserIds(nodes: readonly ApiOrgChartNode[]): string[] {
  const seen = new Set<string>();
  const walk = (list: readonly ApiOrgChartNode[]) => {
    for (const n of list) {
      const raw = n.user_id;
      if (raw != null && String(raw).trim() !== "") {
        seen.add(String(raw).trim());
      }
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return Array.from(seen);
}

/** Non-privileged users: only fetch attendance chips for Control Hub team (or self while team loads). */
function filterOrgChartUserIdsForAttendanceFetch(input: {
  chartUserIds: readonly string[];
  canViewAllAttendance: boolean;
  attendanceTeamScopeLoading: boolean;
  attendanceTeamScopeIds: readonly string[];
  sessionUserId: string | number | undefined | null;
}): string[] {
  if (input.canViewAllAttendance) {
    return [...input.chartUserIds];
  }
  if (input.attendanceTeamScopeLoading) {
    return [];
  }
  const allow = new Set(
    input.attendanceTeamScopeIds.map((x) => String(x).trim()).filter((x) => x.length > 0),
  );
  if (allow.size > 0) {
    return input.chartUserIds.filter((id) => allow.has(String(id).trim()));
  }
  const self = String(input.sessionUserId ?? "").trim();
  if (self === "") {
    return [];
  }
  return input.chartUserIds.filter((id) => String(id).trim() === self);
}

function mergeAttendanceRowsIntoUserMap(
  map: Map<string, OrgChartNodeAttendanceShape>,
  rows: readonly AttendanceRecord[]
): void {
  for (const row of rows) {
    const uid = String(row.user_id ?? "").trim();
    if (uid === "") continue;
    const next = attendanceSummaryFromRecord(row);
    const prev = map.get(uid);
    if (
      !prev ||
      attendanceRankForMerge(next.status) >= attendanceRankForMerge(prev.status)
    ) {
      map.set(uid, next);
    }
  }
}

async function fetchAttendanceRecordsForOrgChartChunk(
  chunk: readonly string[],
  dateFrom: string,
  dateTo: string
): Promise<AttendanceRecord[]> {
  const all: AttendanceRecord[] = [];
  let page = 1;
  for (let guard = 0; guard < ORG_CHART_ATTENDANCE_MAX_PAGES; guard += 1) {
    const { data, pagination } = await getAttendance(
      {
        page,
        limit: ORG_CHART_ATTENDANCE_PAGE_LIMIT,
        user_ids: [...chunk],
        date_from: dateFrom,
        date_to: dateTo,
      },
      { silent: true }
    );
    const rows = data ?? [];
    all.push(...rows);
    const lastPage = pagination?.last_page ?? 1;
    if (!pagination || page >= lastPage || rows.length === 0) {
      break;
    }
    page += 1;
  }
  return all;
}

async function fetchTodayAttendanceForOrgChartUserIds(
  userIds: readonly string[]
): Promise<Map<string, OrgChartNodeAttendanceShape>> {
  const out = new Map<string, OrgChartNodeAttendanceShape>();
  const today = getWorkforceTableDatePresetRange("Today");
  if (!today || userIds.length === 0) {
    return out;
  }
  for (let start = 0; start < userIds.length; start += ATTENDANCE_QUERY_MAX_USER_IDS) {
    const chunk = userIds.slice(start, start + ATTENDANCE_QUERY_MAX_USER_IDS);
    const rows = await fetchAttendanceRecordsForOrgChartChunk(chunk, today.from, today.to);
    mergeAttendanceRowsIntoUserMap(out, rows);
  }
  return out;
}

function mergeAttendanceIntoOrgChartTree(
  nodes: ApiOrgChartNode[],
  byUserId: ReadonlyMap<string, OrgChartNodeAttendanceShape>
): ApiOrgChartNode[] {
  return nodes.map((node) => {
    const next: ApiOrgChartNode = { ...node };
    if (node.children && node.children.length > 0) {
      next.children = mergeAttendanceIntoOrgChartTree(node.children, byUserId);
    }
    const uid = node.user_id == null ? "" : String(node.user_id).trim();
    const fetched = uid === "" ? undefined : byUserId.get(uid);
    if (fetched) {
      next.attendance = fetched;
    }
    return next;
  });
}

function getOrgChartNodeChrome(
  isSelectedUser: boolean,
  isChildHighlight: boolean
): { boxShadow: string; border: string } {
  if (isSelectedUser) {
    return {
      boxShadow: "0 0 0 2px #6366f1, 0 4px 12px rgba(99,102,241,0.25)",
      border: "2px solid #6366f1",
    };
  }
  if (isChildHighlight) {
    return {
      boxShadow: "0 0 0 1px #6366f1, 0 2px 8px rgba(99,102,241,0.12)",
      border: "1px solid #6366f1",
    };
  }
  return {
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    border: "1px solid #e5e7eb",
  };
}

type OrgChartEmployeeNodeProps = {
  employee: Employee;
  selectedUserId: string;
  selectedUserSubtreeIds: Set<string>;
  rawProfileById: Record<string, ApiOrgChartNode>;
  onNodeSelect: (emp: Employee) => void;
};

type OrgChartNodeIdentityProps = Readonly<{ employee: Employee }>;

function OrgChartNodeIdentity({ employee }: OrgChartNodeIdentityProps): React.ReactElement {
  return (
    <>
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
        }}
      >
        <User size={32} color="white" />
      </div>
      <h4
        style={{
          fontSize: "15px",
          fontWeight: "600",
          color: "#1f2937",
          margin: "0 0 4px 0",
        }}
      >
        {employee.name}
      </h4>
      <div
        style={{
          fontSize: "13px",
          color: "#6b7280",
          marginBottom: employee.status === "On Leave" ? "8px" : "0",
        }}
      >
        {employee.title}
      </div>
    </>
  );
}

function OrgChartNodeStatusChips({ employee }: OrgChartNodeIdentityProps): React.ReactElement {
  return (
    <>
      {employee.status === "On Leave" && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            backgroundColor: "#fef3c7",
            color: "#92400e",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "500",
            marginTop: "8px",
          }}
        >
          <Calendar size={12} color="#92400e" />
          On Leave
        </span>
      )}
      {employee.status === "Inactive" && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            backgroundColor: "#f3f4f6",
            color: "#6b7280",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "500",
            marginTop: "8px",
          }}
        >
          Inactive
        </span>
      )}
      {employee.status === "Active" && employee.id !== "1" && employee.id !== "root" && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            backgroundColor: "#d1fae5",
            color: "#065f46",
            borderRadius: "12px",
            fontSize: "11px",
            fontWeight: "500",
            marginTop: "8px",
          }}
        >
          ● Active
        </span>
      )}
    </>
  );
}

type OrgChartNodeAttendanceProps = Readonly<{
  employeeId: string;
  attendanceLabel: string;
  timeStr: string;
}>;

function OrgChartNodeAttendance({ employeeId, attendanceLabel, timeStr }: OrgChartNodeAttendanceProps): React.ReactElement | null {
  if (employeeId === "root") return null;
  return (
    <div style={{ marginTop: "8px", fontSize: "11px", color: "#6b7280" }}>
      {attendanceLabel}
      {timeStr ? ` · ${timeStr}` : ""}
    </div>
  );
}

function buildOrgChartNodeInteractionProps(
  isRoot: boolean,
  chrome: { boxShadow: string },
  openSidebar: () => void,
  handleKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void
): Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "role" | "tabIndex" | "onClick" | "onKeyDown" | "onMouseEnter" | "onMouseLeave"
> {
  if (isRoot) {
    return {};
  }
  return {
    role: "button",
    tabIndex: 0,
    onClick: openSidebar,
    onKeyDown: handleKeyDown,
    onMouseEnter: (e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    },
    onMouseLeave: (e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = chrome.boxShadow;
    },
  };
}

function OrgChartEmployeeNode(props: Readonly<OrgChartEmployeeNodeProps>): React.ReactElement {
  const { employee, selectedUserId, selectedUserSubtreeIds, rawProfileById, onNodeSelect } = props;
  const isRoot = employee.id === "root";
  const isSelectedUser = Boolean(selectedUserId && employee.userId === selectedUserId);
  const isInSelectedSubtree = Boolean(selectedUserId && selectedUserSubtreeIds.has(employee.id));
  const highlightActive =
    Boolean(selectedUserId) && selectedUserSubtreeIds.size > 0;
  const shouldFade = Boolean(
    highlightActive && !isInSelectedSubtree && employee.id !== "root"
  );
  const isChildHighlight = isInSelectedSubtree && !isSelectedUser;
  const chrome = getOrgChartNodeChrome(isSelectedUser, isChildHighlight);

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

  const interactionProps = buildOrgChartNodeInteractionProps(isRoot, chrome, openSidebar, handleKeyDown);

  return (
    <div
      {...(employee.userId ? { "data-org-chart-user-id": employee.userId } : {})}
      {...interactionProps}
      style={{
        padding: "20px",
        borderRadius: "12px",
        display: "inline-block",
        backgroundColor: "white",
        boxShadow: chrome.boxShadow,
        border: chrome.border,
        minWidth: "200px",
        textAlign: "center",
        transition: "all 0.3s ease",
        cursor: isRoot ? "default" : "pointer",
        opacity: shouldFade ? 0.35 : 1,
        pointerEvents: shouldFade ? "none" : "auto",
      }}
    >
      <OrgChartNodeIdentity employee={employee} />
      <OrgChartNodeStatusChips employee={employee} />
      <OrgChartNodeAttendance employeeId={employee.id} attendanceLabel={attendanceLabel} timeStr={timeStr} />
    </div>
  );
}

const OrganizationalChart = () => {
    const { data: session, status: sessionStatus } = useSession();
    const { mainAppDepartments, mainAppUsers } = useMainAppLookups();
    const canViewAllAttendance = useMemo(
      () => canViewAllEmployeesAttendance(session?.user),
      [session?.user],
    );
    const [attendanceTeamScopeIds, setAttendanceTeamScopeIds] = useState<string[]>([]);
    const [attendanceTeamScopeLoading, setAttendanceTeamScopeLoading] = useState(false);

    useEffect(() => {
      if (canViewAllAttendance || sessionStatus !== "authenticated") {
        setAttendanceTeamScopeIds([]);
        setAttendanceTeamScopeLoading(false);
        return;
      }
      const selfRaw = session?.user?.id;
      const selfStr = selfRaw == null ? "" : String(selfRaw).trim();
      if (selfStr === "") {
        setAttendanceTeamScopeIds([]);
        setAttendanceTeamScopeLoading(false);
        return;
      }
      let cancelled = false;
      setAttendanceTeamScopeLoading(true);
      void (async () => {
        try {
          const numericId = Number(selfStr);
          const raw = await getTeamUsers(
            undefined,
            Number.isFinite(numericId) ? numericId : undefined,
          );
          if (cancelled) return;
          const ids = parseTeamUsersResponseForAttendanceScope(raw, selfStr);
          setAttendanceTeamScopeIds(ids);
        } catch (e) {
          console.error("[OrganizationalChart] getTeamUsers failed", e);
          if (!cancelled) {
            setAttendanceTeamScopeIds([selfStr]);
          }
        } finally {
          if (!cancelled) {
            setAttendanceTeamScopeLoading(false);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [canViewAllAttendance, sessionStatus, session?.user?.id]);
    const [activeTab, setActiveTab] = useState<'All Department' | 'Org Chart' | 'My Team'>('Org Chart');
    const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState('All Department');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [showEmployeeSidebar, setShowEmployeeSidebar] = useState(false);
    const [orgChartTreeRaw, setOrgChartTreeRaw] = useState<ApiOrgChartNode[] | null>(null);
    const [loadingOrgChart, setLoadingOrgChart] = useState(true);

    useEffect(() => {
      setShowEmployeeSidebar(false);
      setSelectedEmployee(null);
    }, [activeTab]);

    const { userProfilesMinified } = useUserProfilesMinified();

    const refetchOrgChart = useCallback(
      async (departmentId?: string, userIds?: string[]) => {
        setLoadingOrgChart(true);
        try {
          const params: { department_id?: string; user_ids?: string[] } = {};
          if (departmentId != null && departmentId !== "") params.department_id = departmentId;
          if (userIds != null && userIds.length > 0) params.user_ids = userIds;
          const raw = await getUserProfilesOrgChartTree(
            Object.keys(params).length ? params : undefined
          );
          const parsed = parseOrgChartTreeResponse(raw);
          const chartUserIds = collectUniqueOrgChartUserIds(parsed);
          const idsForAttendance = filterOrgChartUserIdsForAttendanceFetch({
            chartUserIds,
            canViewAllAttendance,
            attendanceTeamScopeLoading,
            attendanceTeamScopeIds,
            sessionUserId: session?.user?.id,
          });
          const attendanceByUser =
            idsForAttendance.length > 0
              ? await fetchTodayAttendanceForOrgChartUserIds(idsForAttendance)
              : new Map<string, OrgChartNodeAttendanceShape>();
          setOrgChartTreeRaw(mergeAttendanceIntoOrgChartTree(parsed, attendanceByUser));
        } catch (e) {
          console.error("[OrganizationalChart] fetch org chart error:", e);
          setOrgChartTreeRaw([]);
        } finally {
          setLoadingOrgChart(false);
        }
      },
      [
        canViewAllAttendance,
        attendanceTeamScopeIds,
        attendanceTeamScopeLoading,
        session?.user?.id,
      ]
    );

    const handleDepartmentChange = useCallback(
      (dept: string, selectedUserId?: string) => {
        const departmentId =
          dept === 'All Department' || !dept
            ? undefined
            : mainAppDepartments?.find((d) => d.name === dept)?.id;
        const userIds = selectedUserId ? [selectedUserId] : undefined;
        refetchOrgChart(departmentId == null ? undefined : String(departmentId), userIds);
      },
      [mainAppDepartments, refetchOrgChart]
    );

    useEffect(() => {
      refetchOrgChart();
    }, [refetchOrgChart]);

    const departments = ['All Department', ...(mainAppDepartments?.map((d) => d.name).filter(Boolean) as string[])];

    const [orgData, setOrgData] = useState<Employee | null>(null);
    useEffect(() => {
      if (!orgChartTreeRaw || orgChartTreeRaw.length === 0) {
        setOrgData(null);
        return;
      }
      const getName = (userId: string | undefined) => {
        if (!userId) return "—";
        const u = findMainAppUserByOrgChartUserId(mainAppUsers, userId);
        return u?.name ?? userId;
      };
      const getDeptName = (departmentId: string | undefined) => {
        if (!departmentId) return '—';
        const d = mainAppDepartments?.find((x) => String(x.id) === String(departmentId));
        return d?.name ?? departmentId;
      };
      const apiNodeToEmployee = (node: ApiOrgChartNode): Employee => {
        const status = employeeStatusFromApiNode(node);
        const uid = node.user_id;
        return {
          id: String(node.id ?? ''),
          userId: uid === undefined || uid === null ? undefined : String(uid),
          name: getName(node.user_id),
          title: (node.designation as string | undefined)?.trim() === '' ? '—' : (node.designation as string | undefined)?.trim() ?? '—',
          department: getDeptName(node.department_id),
          avatar: '',
          status,
          children: (node.children && node.children.length > 0)
            ? node.children.map(apiNodeToEmployee)
            : undefined,
        };
      };
      const roots = orgChartTreeRaw.map(apiNodeToEmployee);
      const companyName = (session?.user as { company_name?: string } | undefined)?.company_name ?? 'Organization';
      const isChartFiltered =
        selectedDepartment !== 'All Department' || selectedUserId !== '';
      const syntheticRoot: Employee = {
        id: 'root',
        name: companyName,
        title: '',
        department: '',
        avatar: '',
        status: 'Active',
        children: roots,
      };
      const built: Employee =
        roots.length === 1 && !isChartFiltered ? roots[0] : syntheticRoot;
      setOrgData(built);
    }, [
      orgChartTreeRaw,
      mainAppUsers,
      mainAppDepartments,
      session?.user,
      selectedDepartment,
      selectedUserId,
    ]);

    useEffect(() => {
      if (!selectedUserId) return;
      const timer = setTimeout(() => {
        const el = document.querySelector(`[data-org-chart-user-id="${selectedUserId}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }, [selectedUserId]);

    const rawProfileById = useMemo(() => {
      const map: Record<string, ApiOrgChartNode> = {};
      const walk = (nodes: ApiOrgChartNode[]) => {
        nodes.forEach((n) => {
          if (n.id != null) map[String(n.id)] = n;
          if (n.children?.length) walk(n.children);
        });
      };
      if (orgChartTreeRaw?.length) walk(orgChartTreeRaw);
      return map;
    }, [orgChartTreeRaw]);

    const orgChartUserIds = useMemo(() => {
      const set = new Set<string>();
      const walk = (nodes: ApiOrgChartNode[]) => {
        nodes.forEach((n) => {
          if (n.user_id != null) set.add(String(n.user_id));
          if (n.children?.length) walk(n.children);
        });
      };
      if (orgChartTreeRaw?.length) walk(orgChartTreeRaw);
      return set;
    }, [orgChartTreeRaw]);

    useEffect(() => {
      if (!selectedUserId || loadingOrgChart || !orgChartTreeRaw?.length) return;
      if (!orgChartUserIds.has(selectedUserId)) {
        setSelectedUserId("");
      }
    }, [loadingOrgChart, orgChartTreeRaw, orgChartUserIds, selectedUserId]);

    const usersInOrgChart = useMemo(
      () =>
        (mainAppUsers ?? []).filter((u) => {
          const phoneKey = normalizeOrgChartUserKey(u.phone);
          return (
            (phoneKey !== "" && orgChartUserIds.has(phoneKey)) ||
            orgChartUserIds.has(String(u.id))
          );
        }),
      [mainAppUsers, orgChartUserIds],
    );

    const selectedUserSubtreeIds = useMemo(() => {
      const set = new Set<string>();
      if (!selectedUserId || !orgData) return set;
      const collectSubtree = (emp: Employee): void => {
        set.add(emp.id);
        (emp.children ?? []).forEach(collectSubtree);
      };
      const findAndCollect = (emp: Employee): boolean => {
        if (emp.userId === selectedUserId) {
          collectSubtree(emp);
          return true;
        }
        for (const c of emp.children ?? []) {
          if (findAndCollect(c)) return true;
        }
        return false;
      };
      if (orgData.id === 'root' && orgData.children) {
        orgData.children.forEach((c) => findAndCollect(c));
      } else {
        findAndCollect(orgData);
      }
      return set;
    }, [selectedUserId, orgData]);

    const myTeamEmployees = useMemo(
      () => (orgData ? flattenOrgChartTeam(orgData) : []),
      [orgData]
    );

    const handleOrgChartNodeSelect = (employee: Employee) => {
      setSelectedEmployee(employee);
      setShowEmployeeSidebar(true);
    };

    const renderNode = (employee: Employee) => (
      <OrgChartEmployeeNode
        employee={employee}
        selectedUserId={selectedUserId}
        selectedUserSubtreeIds={selectedUserSubtreeIds}
        rawProfileById={rawProfileById}
        onNodeSelect={handleOrgChartNodeSelect}
      />
    );
  
    // Recursive function to render tree using react-organizational-chart
    const renderTree = (employee: Employee): React.ReactElement => {
      return (
        <TreeNode label={renderNode(employee)}>
          {employee.children?.map((child) => renderTree(child))}
        </TreeNode>
      );
    };
  
    const handleZoomIn = () => {
      setZoomLevel(prev => Math.min(prev + 10, 150));
    };
  
    const handleZoomOut = () => {
      setZoomLevel(prev => Math.max(prev - 10, 50));
    };
  
    const handleResetZoom = () => {
      setZoomLevel(100);
    };
  
    const toggleFullscreen = () => {
      const wrapper = document.getElementById('org-chart-fullscreen-wrapper');
      if (!document.fullscreenElement && wrapper) {
        wrapper.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err);
        });
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    };

    useEffect(() => {
      const onFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', onFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const renderOrgChartPanel = () => {
      if (loadingOrgChart) {
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#6b7280" }}>
            Loading chart...
          </div>
        );
      }
      if (!orgData) {
        return (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#6b7280" }}>
            No organizational data available.
          </div>
        );
      }
      return (
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.3s ease",
            paddingBottom: "40px",
          }}
        >
          <Tree lineWidth="2px" lineColor="#d1d5db" lineBorderRadius="10px" label={renderNode(orgData)}>
            {orgData.children?.map((child) => renderTree(child))}
          </Tree>
        </div>
      );
    };

    const closeEmployeeSidebar = () => {
      setShowEmployeeSidebar(false);
      setSelectedEmployee(null);
    };

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Organizational Chart" />

      <div >
      <div>
         <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>Organizational Chart</h1>
        
        </div>
        {/* Header Tabs and Search */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                {selectedDepartment}
                <ChevronDown size={16} />
              </button>
              {showDepartmentDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  minWidth: '200px'
                }}>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => {
                        setSelectedDepartment(dept);
                        setShowDepartmentDropdown(false);
                        handleDepartmentChange(dept, selectedUserId || undefined);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: "14px",
                        border: "none",
                        backgroundColor: selectedDepartment === dept ? "#f3f4f6" : "white",
                        textAlign: "left",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f3f4f6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = selectedDepartment === dept ? "#f3f4f6" : "white";
                      }}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {selectedUserId
                  ? (findMainAppUserByOrgChartUserId(usersInOrgChart, selectedUserId)?.name ??
                    selectedUserId)
                  : "All Users"}
                <ChevronDown size={16} />
              </button>
              {showUserDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    minWidth: '200px',
                    maxHeight: '280px',
                    overflowY: 'auto',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserId("");
                      setShowUserDropdown(false);
                      handleDepartmentChange(selectedDepartment);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: "14px",
                      border: "none",
                      backgroundColor: selectedUserId ? "white" : "#f3f4f6",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selectedUserId ? "white" : "#f3f4f6";
                    }}
                  >
                    All Users
                  </button>
                  {usersInOrgChart.map((u) => {
                    const uid = mainAppUserRowKeyForSelection(u);
                    const isSelected = selectedUserId === uid;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(uid);
                          setShowUserDropdown(false);
                          handleDepartmentChange(selectedDepartment, uid);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 16px",
                          cursor: "pointer",
                          fontSize: "14px",
                          border: "none",
                          backgroundColor: isSelected ? "#f3f4f6" : "white",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f3f4f6";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isSelected ? "#f3f4f6" : "white";
                        }}
                      >
                        {u.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('Org Chart')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === 'Org Chart' ? '#6366f1' : 'white',
                color: activeTab === 'Org Chart' ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Organizational Chart
            </button>

            <button
              onClick={() => setActiveTab('My Team')}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: activeTab === 'My Team' ? '#6366f1' : 'white',
                color: activeTab === 'My Team' ? 'white' : '#6b7280',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              My Team
            </button>
          </div>

          <div style={{ position: "relative", minWidth: "300px" }} />
        </div>

        {/* Alert Banner */}
        {/* <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          backgroundColor: '#fef3c7',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #fde68a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#fbbf24',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertCircle size={24} color="white" />
            </div>
            <div>
              <div style={{ 
                fontSize: '15px', 
                fontWeight: '600', 
                color: '#92400e',
                marginBottom: '2px'
              }}>
                Coverage Risk: Too many key roles will be on leave next week
              </div>
              <div style={{ fontSize: '13px', color: '#92400e' }}>
                3 key employees (2 in critical roles) are scheduled to be on leave from Apr 30 to May 3.
              </div>
            </div>
          </div>
          <button
            style={{
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #fbbf24',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
          >
            View Details
            <ChevronRight size={14} />
          </button>
        </div> */}

        {activeTab === 'Org Chart' && (
          <div
            id="org-chart-fullscreen-wrapper"
            style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '24px' }}
          >
            {/* Org Chart Header with Controls */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Zoom Controls */}
                <div style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
                  <button
                    onClick={handleZoomOut}
                    style={{
                      padding: '8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <div style={{
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    fontSize: '13px',
                    fontWeight: '500',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {zoomLevel}%
                  </div>
                  <button
                    onClick={handleZoomIn}
                    style={{
                      padding: '8px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Reset
                  </button>
                </div>

                <button
                  onClick={toggleFullscreen}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </button>
                {!isFullscreen && (
                <button
                  onClick={() => router.push('/workforce/employees')}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
                  title="Add New Employee"
                >
                  <Plus size={16} />
                  View Employee
                </button>
                )}
              </div>
            </div>

            {/* Org Chart Container */}
            <div 
              id="org-chart-container"
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '40px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                minHeight: '600px',
                overflow: 'auto',
                position: 'relative'
              }}>
              {renderOrgChartPanel()}
            </div>
          </div>
        )}

        {activeTab === 'My Team' && (
          <>
            {/* My Team Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '24px',
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                My Team
              </h2>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={18} color="#6b7280" />
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>{myTeamEmployees.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>{myTeamEmployees.filter((m) => m.status === 'On Leave').length}</span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>On Leave Today</span>
                </div>
                {/* <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>0</span>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>Pending Approvals</span>
                </div> */}
              </div>
            </div>

            {/* Team Members Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {myTeamEmployees.map((employee) => {
                const onLeaveToday =
                  rawProfileById[employee.id]?.is_on_leave_today === true;
                const leaveTodayLabel = onLeaveToday ? "On Leave" : undefined;
                return (
                <button
                  key={employee.id}
                  type="button"
                  onClick={() => handleOrgChartNodeSelect(employee)}
                  style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    border: "1px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    width: "100%",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                  }}
                >
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={28} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ 
                        fontSize: '15px', 
                        fontWeight: '600', 
                        color: '#1f2937',
                        margin: 0
                      }}>
                        {employee.name}
                      </h4>
                      <ExternalLink size={14} color="#9ca3af" style={{ cursor: 'pointer' }} />
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                      {employee.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}>
                        <Calendar size={12} color="#92400e" />
                        {employee.status ?? "Active"}
                      </span>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        <Calendar size={12} />
                        {leaveTodayLabel}
                      </div>
                    </div>
                  </div>
                </button>
              );
              })}
            </div>
          </>
        )}
      </div>

      {/* Employee Detail Sidebar */}
      {showEmployeeSidebar && selectedEmployee && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            aria-label="Close employee details"
            onClick={closeEmployeeSidebar}
            style={{
              position: "absolute",
              inset: 0,
              border: "none",
              margin: 0,
              padding: 0,
              cursor: "pointer",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              maxHeight: "100%",
            }}
          >
            <OrgEmployeeSidebar
              employee={selectedEmployee}
              allEmployees={orgData ?? { id: "root", name: "", title: "", department: "", avatar: "", status: "Active", children: [] }}
              rawProfile={selectedEmployee ? rawProfileById[selectedEmployee.id] : undefined}
              users={mainAppUsers}
              onRefresh={refetchOrgChart}
              userProfilesMinified={userProfilesMinified}
              onClose={closeEmployeeSidebar}
            />
          </div>
        </div>
      )}
    </div>

    </React.Fragment>
  );
};

OrganizationalChart.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default OrganizationalChart;
