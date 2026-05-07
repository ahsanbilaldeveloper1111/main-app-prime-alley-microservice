import "@assets/scss/datatable-style.scss";
import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";

import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import dynamic from "next/dynamic";
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
import OrgEmployeeSidebar from "@page-modules/workforce/org-chart/sidebar";
import router from "next/router";
import {
  findMainAppUserByOrgChartUserId,
  mainAppUserRowKeyForSelection,
} from "@utils/workforce/orgChartMainAppUserMatch";

import {
  buildOrgChartDisplayTree,
  buildRawProfileByIdMap,
  collectOrgChartUserIds,
  collectSubtreeIdsForUser,
  filterMainAppUsersInOrgChart,
  flattenOrgChartTeam,
  type OrgChartEmployee,
} from "@page-modules/workforce/org-chart/orgChartDomain";
import { useOrgChartTreeQuery } from "@page-modules/workforce/org-chart/useOrgChartTreeQuery";
import { OrgChartEmployeeNode } from "@page-modules/workforce/org-chart/partials/OrgChartEmployeeNode";

import "@page-modules/workforce/org-chart/orgChartPage.scss";

const Tree = dynamic(() => import("react-organizational-chart").then((mod) => mod.Tree), {
  ssr: false,
});
const TreeNode = dynamic(() => import("react-organizational-chart").then((mod) => mod.TreeNode), {
  ssr: false,
});

const ALL_DEPARTMENT = "All Department";

type OrgChartTabId = "Org Chart" | "My Team";

const OrganizationalChart = () => {
  const { data: session } = useSession();
  const { mainAppDepartments, mainAppUsers, companyIdentifier } = useMainAppLookups();
  const [activeTab, setActiveTab] = useState<OrgChartTabId>("Org Chart");
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(ALL_DEPARTMENT);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<OrgChartEmployee | null>(null);
  const [showEmployeeSidebar, setShowEmployeeSidebar] = useState(false);

  useEffect(() => {
    setShowEmployeeSidebar(false);
    setSelectedEmployee(null);
  }, [activeTab]);

  const { userProfilesMinified } = useUserProfilesMinified();

  const departmentIdForQuery = useMemo(() => {
    if (selectedDepartment === ALL_DEPARTMENT || !selectedDepartment) return undefined;
    const id = mainAppDepartments?.find((d) => d.name === selectedDepartment)?.id;
    return id == null ? undefined : String(id);
  }, [selectedDepartment, mainAppDepartments]);

  const userIdsForQuery = selectedUserId ? [selectedUserId] : undefined;

  const orgChartQuery = useOrgChartTreeQuery({
    companyIdentifier,
    departmentId: departmentIdForQuery,
    userIds: userIdsForQuery,
  });

  const orgChartTreeRaw = orgChartQuery.data ?? [];

  const companyName =
    (session?.user as { company_name?: string } | undefined)?.company_name ?? "Organization";

  const orgData = useMemo(() => {
    if (!orgChartTreeRaw.length) return null;
    return buildOrgChartDisplayTree({
      orgChartTreeRaw,
      users: mainAppUsers ?? [],
      departments: mainAppDepartments ?? [],
      companyName,
      selectedDepartmentLabel: selectedDepartment,
      selectedUserId,
    });
  }, [
    orgChartTreeRaw,
    mainAppUsers,
    mainAppDepartments,
    companyName,
    selectedDepartment,
    selectedUserId,
  ]);

  useEffect(() => {
    if (!selectedUserId) return;
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-org-chart-user-id="${selectedUserId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }, 100);
    return () => clearTimeout(timer);
  }, [selectedUserId]);

  const rawProfileById = useMemo(() => buildRawProfileByIdMap(orgChartTreeRaw), [orgChartTreeRaw]);

  const orgChartUserIds = useMemo(() => collectOrgChartUserIds(orgChartTreeRaw), [orgChartTreeRaw]);

  const chartLoading = Boolean(companyIdentifier) && orgChartQuery.isPending;

  useEffect(() => {
    if (!selectedUserId || chartLoading || !orgChartTreeRaw.length) return;
    if (!orgChartUserIds.has(selectedUserId)) {
      setSelectedUserId("");
    }
  }, [chartLoading, orgChartTreeRaw.length, orgChartUserIds, selectedUserId]);

  const usersInOrgChart = useMemo(
    () => filterMainAppUsersInOrgChart(mainAppUsers ?? [], orgChartUserIds),
    [mainAppUsers, orgChartUserIds],
  );

  const selectedUserSubtreeIds = useMemo(() => {
    if (!selectedUserId || !orgData) return new Set<string>();
    return collectSubtreeIdsForUser(orgData, selectedUserId);
  }, [selectedUserId, orgData]);

  const myTeamEmployees = useMemo(() => (orgData ? flattenOrgChartTeam(orgData) : []), [orgData]);

  const handleOrgChartNodeSelect = useCallback((employee: OrgChartEmployee) => {
    setSelectedEmployee(employee);
    setShowEmployeeSidebar(true);
  }, []);

  const renderNode = useCallback(
    (employee: OrgChartEmployee) => (
      <OrgChartEmployeeNode
        employee={employee}
        selectedUserId={selectedUserId}
        selectedUserSubtreeIds={selectedUserSubtreeIds}
        rawProfileById={rawProfileById}
        onNodeSelect={handleOrgChartNodeSelect}
      />
    ),
    [selectedUserId, selectedUserSubtreeIds, rawProfileById, handleOrgChartNodeSelect],
  );

  const renderTree = useCallback(
    (employee: OrgChartEmployee): React.ReactElement => (
      <TreeNode label={renderNode(employee)}>
        {employee.children?.map((child) => renderTree(child))}
      </TreeNode>
    ),
    [renderNode],
  );

  const departments = useMemo(
    () => [ALL_DEPARTMENT, ...(mainAppDepartments?.map((d) => d.name).filter(Boolean) as string[])],
    [mainAppDepartments],
  );

  const closeEmployeeSidebar = useCallback(() => {
    setShowEmployeeSidebar(false);
    setSelectedEmployee(null);
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 10, 150));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 10, 50));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(100);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const wrapper = document.getElementById("org-chart-fullscreen-wrapper");
    if (!document.fullscreenElement && wrapper) {
      wrapper.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const renderOrgChartPanel = () => {
    if (chartLoading) {
      return <div className="org-chart-page__empty-panel">Loading chart...</div>;
    }
    if (!orgData) {
      return <div className="org-chart-page__empty-panel">No organizational data available.</div>;
    }
    return (
      <div
        className="org-chart-page__zoom-scale"
        style={{
          transform: `scale(${zoomLevel / 100})`,
        }}
      >
        <Tree lineWidth="2px" lineColor="#d1d5db" lineBorderRadius="10px" label={renderNode(orgData)}>
          {orgData.children?.map((child) => renderTree(child))}
        </Tree>
      </div>
    );
  };

  const sidebarFallbackRoot: OrgChartEmployee = useMemo(
    () => ({
      id: "root",
      name: "",
      title: "",
      department: "",
      avatar: "",
      status: "Active",
      children: [],
    }),
    [],
  );

  return (
    <>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Organizational Chart" />

      <div className="org-chart-page">
        <div className="org-chart-page__title-row">
          <h1 className="org-chart-page__page-title">Organizational Chart</h1>
        </div>

        <div className="org-chart-page__toolbar">
          <div className="org-chart-page__toolbar-left">
            <div className="org-chart-page__dropdown-wrap">
              <button
                type="button"
                className="org-chart-page__dropdown-trigger"
                onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
              >
                {selectedDepartment}
                <ChevronDown size={16} />
              </button>
              {showDepartmentDropdown && (
                <div className="org-chart-page__dropdown-menu">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      className={`org-chart-page__dropdown-item${selectedDepartment === dept ? " org-chart-page__dropdown-item--active" : ""}`}
                      onClick={() => {
                        setSelectedDepartment(dept);
                        setShowDepartmentDropdown(false);
                      }}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="org-chart-page__dropdown-wrap">
              <button
                type="button"
                className="org-chart-page__dropdown-trigger"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                {selectedUserId
                  ? (findMainAppUserByOrgChartUserId(usersInOrgChart, selectedUserId)?.name ??
                    selectedUserId)
                  : "All Users"}
                <ChevronDown size={16} />
              </button>
              {showUserDropdown && (
                <div className="org-chart-page__dropdown-menu org-chart-page__dropdown-menu--scroll">
                  <button
                    type="button"
                    className={`org-chart-page__dropdown-item${selectedUserId === "" ? " org-chart-page__dropdown-item--active" : ""}`}
                    onClick={() => {
                      setSelectedUserId("");
                      setShowUserDropdown(false);
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
                        className={`org-chart-page__dropdown-item${isSelected ? " org-chart-page__dropdown-item--active" : ""}`}
                        onClick={() => {
                          setSelectedUserId(uid);
                          setShowUserDropdown(false);
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
              type="button"
              className={`org-chart-page__tab-btn ${activeTab === "Org Chart" ? "org-chart-page__tab-btn--active" : "org-chart-page__tab-btn--inactive"}`}
              onClick={() => setActiveTab("Org Chart")}
            >
              Organizational Chart
            </button>

            <button
              type="button"
              className={`org-chart-page__tab-btn ${activeTab === "My Team" ? "org-chart-page__tab-btn--active" : "org-chart-page__tab-btn--inactive"}`}
              onClick={() => setActiveTab("My Team")}
            >
              My Team
            </button>
          </div>

          <div style={{ position: "relative", minWidth: "300px" }} />
        </div>

        {activeTab === "Org Chart" && (
          <div className="org-chart-page__chart-shell" id="org-chart-fullscreen-wrapper">
            <div className="org-chart-page__chart-toolbar">
              <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1f2937", margin: 0 }}>{""}</h2>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div className="org-chart-page__zoom-cluster">
                  <button
                    type="button"
                    className="org-chart-page__icon-btn"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <div className="org-chart-page__zoom-readout">{zoomLevel}%</div>
                  <button
                    type="button"
                    className="org-chart-page__icon-btn"
                    onClick={handleZoomIn}
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <button type="button" className="org-chart-page__toolbar-action" onClick={handleResetZoom}>
                    Reset
                  </button>
                </div>

                <button
                  type="button"
                  className="org-chart-page__toolbar-action"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  {isFullscreen ? "Exit" : "Fullscreen"}
                </button>
                {!isFullscreen && (
                  <button
                    type="button"
                    className="org-chart-page__primary-action"
                    onClick={() => router.push("/workforce/employees")}
                    title="View Employee"
                  >
                    <Plus size={16} />
                    View Employee
                  </button>
                )}
              </div>
            </div>

            <div className="org-chart-page__chart-scroll">{renderOrgChartPanel()}</div>
          </div>
        )}

        {activeTab === "My Team" && (
          <>
            <div className="org-chart-page__team-header">
              <h2 className="org-chart-page__team-title">My Team</h2>
              <div className="org-chart-page__team-meta">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Users size={18} color="#6b7280" />
                  <span>{myTeamEmployees.length}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="org-chart-page__team-meta-strong">
                    {myTeamEmployees.filter((m) => m.status === "On Leave").length}
                  </span>
                  <span>On Leave Today</span>
                </div>
              </div>
            </div>

            <div className="org-chart-page__team-grid">
              {myTeamEmployees.map((employee) => {
                const onLeaveToday = rawProfileById[employee.id]?.is_on_leave_today === true;
                const leaveTodayLabel = onLeaveToday ? "On Leave" : undefined;
                return (
                  <button
                    key={employee.id}
                    type="button"
                    className="org-chart-page__team-card"
                    onClick={() => handleOrgChartNodeSelect(employee)}
                  >
                    <div className="org-chart-page__avatar-circle">
                      <User size={28} color="white" />
                    </div>
                    <div className="org-chart-page__team-card-body">
                      <div className="org-chart-page__team-card-title-row">
                        <h4 className="org-chart-page__team-card-name">{employee.name}</h4>
                        <ExternalLink size={14} color="#9ca3af" />
                      </div>
                      <div className="org-chart-page__team-card-subtitle">{employee.title}</div>
                      <div className="org-chart-page__team-card-chips">
                        <span className="org-chart-page__leave-chip-my-team">
                          <Calendar size={12} color="#92400e" />
                          {employee.status ?? "Active"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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

      {showEmployeeSidebar && selectedEmployee && (
        <div className="org-chart-page__sidebar-overlay-root">
          <button
            type="button"
            aria-label="Close employee details"
            className="org-chart-page__sidebar-overlay-backdrop"
            onClick={closeEmployeeSidebar}
          />
          <div className="org-chart-page__sidebar-overlay-panel">
            <OrgEmployeeSidebar
              employee={selectedEmployee}
              allEmployees={orgData ?? sidebarFallbackRoot}
              rawProfile={rawProfileById[selectedEmployee.id]}
              users={mainAppUsers}
              userProfilesMinified={userProfilesMinified}
              onClose={closeEmployeeSidebar}
            />
          </div>
        </div>
      )}
    </>
  );
};

OrganizationalChart.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default OrganizationalChart;
