import "@assets/scss/datatable-style.scss";
import React, { ReactElement, useCallback, useRef, useState } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import ProjectTabsContent, {
  type ProjectTabsContentRef,
} from "@page-modules/planner/projects/partials/ProjectTabsContent";
import { ModuleSlug } from "@utils/Helper";
import { useHierarchyData } from "@components/filters/useHierarchyData";
import { usePermissions } from "@utils/permissionUtils";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import {
  WORK_PLANNER_STAT_CARDS_GLOBAL_CSS,
  workPlannerDashboardLayoutStyles as layout,
} from "@planner/workPlannerDashboardLayoutStyles";
import { useWorkPlannerDashboardProjects } from "@planner/useWorkPlannerDashboardProjects";
import { WorkPlannerDashboardHeader } from "@planner/WorkPlannerDashboardHeader";
import type { DashboardProjectRow } from "@planner/workPlannerDashboardTypes";

const { PERMISSIONS } = HEADER_CONSTANTS;

const WorkPlannerProjectsDashboard = () => {
  const { hasPermission } = usePermissions();
  const canViewProjects = hasPermission(PERMISSIONS.VIEW_PROJECTS_WORK_PLANNER);
  const canViewTasks = hasPermission(PERMISSIONS.VIEW_TASKSLIST_WORK_PLANNER);
  const canCreateTask = hasPermission(PERMISSIONS.CREATE_TASKS_WORK_PLANNER);

  const { projects, selectedProject, loadingProjects, handleProjectSelect } =
    useWorkPlannerDashboardProjects(canViewProjects);

  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const projectTabsContentRef = useRef<ProjectTabsContentRef>(null);

  const { hierarchyDataExtensions, loading: hierarchyLoading } =
    useHierarchyData(ModuleSlug.WORK_PLANNER);

  const handleCreateTask = useCallback(async (formData: unknown) => {
    await Promise.resolve(formData);
  }, []);

  const toggleProjectDropdown = useCallback(() => {
    setShowProjectDropdown((open) => !open);
  }, []);

  const selectProjectAndCloseMenu = useCallback(
    (project: DashboardProjectRow) => {
      handleProjectSelect(project);
      setShowProjectDropdown(false);
    },
    [handleProjectSelect],
  );

  return (
    <React.Fragment>
      <BreadcrumbItem
        mainTitle=""
        mainLink=""
        subTitle="Work Planner Projects Dashboard"
      />

      <style>{WORK_PLANNER_STAT_CARDS_GLOBAL_CSS}</style>

      <div style={layout.container}>
        <WorkPlannerDashboardHeader
          canViewProjects={canViewProjects}
          canViewTasks={canViewTasks}
          canCreateTask={canCreateTask}
          projects={projects}
          selectedProject={selectedProject}
          loadingProjects={loadingProjects}
          showProjectDropdown={showProjectDropdown}
          onToggleProjectDropdown={toggleProjectDropdown}
          onProjectSelect={selectProjectAndCloseMenu}
          hierarchyLoading={hierarchyLoading}
          projectTabsContentRef={projectTabsContentRef}
        />

        {canViewProjects || canViewTasks ? (
          <ProjectTabsContent
            ref={projectTabsContentRef}
            selectedProject={selectedProject}
            hierarchyDataExtensions={hierarchyDataExtensions}
            hierarchyLoading={hierarchyLoading}
            onCreateTask={handleCreateTask}
          />
        ) : (
          <div
            style={{
              padding: "1.5rem",
              color: "#6B7280",
              fontSize: "0.95rem",
            }}
          >
            You have dashboard-only access. Project and task details are not
            available.
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

WorkPlannerProjectsDashboard.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default WorkPlannerProjectsDashboard;
