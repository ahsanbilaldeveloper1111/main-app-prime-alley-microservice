import React, { useCallback, type RefObject } from "react";
import { ChevronDown, Folder, LayoutGrid, Plus } from "lucide-react";
import { Spinner } from "react-bootstrap";
import type { ProjectTabsContentRef } from "@page-modules/planner/projects/partials/ProjectTabsContent";
import {
  workPlannerDashboardLayoutStyles as styles,
} from "./workPlannerDashboardLayoutStyles";
import type { DashboardProjectRow } from "./workPlannerDashboardTypes";

const LEXEND = '"Lexend Deca", Helvetica, Arial, sans-serif';
const PLANNER_PRIMARY = "#0066CC";
const PLANNER_PRIMARY_HOVER = "#0052A3";

const projectDropdownButtonBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 14px",
  fontFamily: LEXEND,
  fontSize: "14px",
  fontWeight: 300,
  color: "#141414",
  background: "#fff",
  border: "1px solid #d0d0d0",
  borderRadius: "4px",
  transition: "border-color 0.15s",
  whiteSpace: "nowrap",
  letterSpacing: "0px",
  lineHeight: "20px",
};

const headerActionButtonBase: React.CSSProperties = {
  transition: "150ms ease-out",
  display: "inline-flex",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textDecoration: "none",
  borderRadius: "4px",
  borderWidth: "1px",
  borderStyle: "solid",
  verticalAlign: "middle",
  paddingBlock: "8px",
  paddingInline: "16px",
  maxWidth: "100%",
  fontFamily: LEXEND,
  fontSize: "12px",
  fontWeight: 300,
  letterSpacing: "0px",
  lineHeight: "14px",
  WebkitFontSmoothing: "antialiased",
  textUnderlineOffset: "24%",
  alignItems: "center",
  gap: "0.5rem",
};

export type WorkPlannerDashboardHeaderProps = {
  canViewProjects: boolean;
  canViewTasks: boolean;
  canCreateTask: boolean;
  projects: DashboardProjectRow[];
  selectedProject: DashboardProjectRow | null;
  loadingProjects: boolean;
  showProjectDropdown: boolean;
  onToggleProjectDropdown: () => void;
  onProjectSelect: (project: DashboardProjectRow) => void;
  hierarchyLoading: boolean;
  projectTabsContentRef: RefObject<ProjectTabsContentRef | null>;
};

export function WorkPlannerDashboardHeader({
  canViewProjects,
  canViewTasks,
  canCreateTask,
  projects,
  selectedProject,
  loadingProjects,
  showProjectDropdown,
  onToggleProjectDropdown,
  onProjectSelect,
  hierarchyLoading,
  projectTabsContentRef,
}: Readonly<WorkPlannerDashboardHeaderProps>) {
  const openCreateTask = useCallback(() => {
    if (selectedProject) {
      projectTabsContentRef.current?.openCreateTaskModal();
    } else {
      globalThis.alert("Please select a project first");
    }
  }, [projectTabsContentRef, selectedProject]);

  const switchToBoard = useCallback(() => {
    projectTabsContentRef.current?.switchToBoardView();
  }, [projectTabsContentRef]);

  return (
    <div style={styles.header}>
      <div style={styles.headerInner}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Folder size={22} style={{ color: "#141414", flexShrink: 0 }} />
              <h2
                style={{
                  margin: 0,
                  fontFamily: LEXEND,
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#141414",
                  letterSpacing: "0px",
                  lineHeight: "24px",
                }}
              >
                Projects
              </h2>
            </div>

            <div style={styles.dropdown}>
              <button
                type="button"
                style={{
                  ...projectDropdownButtonBase,
                  cursor: loadingProjects ? "not-allowed" : "pointer",
                }}
                onClick={onToggleProjectDropdown}
                onMouseEnter={(e) => {
                  if (!loadingProjects) e.currentTarget.style.borderColor = "#141414";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#d0d0d0";
                }}
                disabled={loadingProjects}
              >
                {loadingProjects ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  <>
                    <span>{selectedProject?.name || "Select Project"}</span>
                    <ChevronDown size={14} style={{ color: "#555", flexShrink: 0 }} />
                  </>
                )}
              </button>

              {showProjectDropdown && !loadingProjects && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    background: "#fff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                    minWidth: "200px",
                    zIndex: 1000,
                    overflow: "hidden",
                  }}
                >
                  {projects.length === 0 ? (
                    <div
                      style={{
                        padding: "10px 14px",
                        fontFamily: LEXEND,
                        fontSize: "14px",
                        fontWeight: 300,
                        color: "#888",
                      }}
                    >
                      No projects available
                    </div>
                  ) : (
                    projects.map((project, index) => (
                      <button
                        key={project.id}
                        type="button"
                        onClick={() => {
                          onProjectSelect(project);
                        }}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 14px",
                          fontFamily: LEXEND,
                          fontSize: "14px",
                          fontWeight: selectedProject?.id === project.id ? 500 : 300,
                          color:
                            selectedProject?.id === project.id ? "#141414" : "#4B5563",
                          border: "none",
                          borderBottom:
                            index === projects.length - 1 ? "none" : "1px solid #F3F4F6",
                          cursor: "pointer",
                          transition: "background 0.12s",
                          background:
                            selectedProject?.id === project.id ? "#f5f5f5" : "#fff",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => {
                          if (selectedProject?.id !== project.id) {
                            e.currentTarget.style.background = "#f9f9f9";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            selectedProject?.id === project.id ? "#f5f5f5" : "#fff";
                        }}
                      >
                        {project.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={styles.headerRight}>
            {canCreateTask && (
              <button
                type="button"
                style={{
                  ...headerActionButtonBase,
                  cursor:
                    selectedProject && !hierarchyLoading ? "pointer" : "not-allowed",
                  backgroundColor: PLANNER_PRIMARY,
                  borderColor: PLANNER_PRIMARY,
                  color: "#ffffff",
                  fontWeight: 500,
                }}
                onClick={openCreateTask}
                disabled={!selectedProject || hierarchyLoading || !canViewProjects}
                onMouseEnter={(e) => {
                  if (!selectedProject || hierarchyLoading || !canViewProjects) return;
                  e.currentTarget.style.backgroundColor = PLANNER_PRIMARY_HOVER;
                  e.currentTarget.style.borderColor = PLANNER_PRIMARY_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = PLANNER_PRIMARY;
                  e.currentTarget.style.borderColor = PLANNER_PRIMARY;
                }}
              >
                <Plus size={18} />
                <span>Create Task</span>
              </button>
            )}

            {canViewTasks && (
              <button
                type="button"
                style={{
                  ...headerActionButtonBase,
                  cursor: selectedProject ? "pointer" : "not-allowed",
                  backgroundColor: "rgb(255, 255, 255)",
                  borderColor: "rgb(20, 20, 20)",
                  color: "rgb(20, 20, 20)",
                }}
                disabled={!selectedProject}
                onClick={switchToBoard}
              >
                <LayoutGrid size={18} />
                <span>Board View</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
