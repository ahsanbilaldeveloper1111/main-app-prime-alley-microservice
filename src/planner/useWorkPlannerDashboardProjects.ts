import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPlannerProjectFilterDirectory } from "../query/fetchPlannerProjectFilterDirectory";
import { plannerKeys } from "@query/keys";
import type { DashboardProjectRow } from "./workPlannerDashboardTypes";

export function useWorkPlannerDashboardProjects(canViewProjects: boolean) {
  const [selectedProject, setSelectedProject] =
    useState<DashboardProjectRow | null>(null);

  const { data: projects = [], isPending: loadingProjects } = useQuery({
    queryKey: plannerKeys.projects.filterDirectory(),
    queryFn: fetchPlannerProjectFilterDirectory,
    enabled: canViewProjects,
  });

  useEffect(() => {
    if (!canViewProjects) {
      setSelectedProject(null);
      return;
    }
    setSelectedProject((prev) => {
      if (prev == null) {
        return projects.length > 0 ? projects[0] : null;
      }
      const match = projects.find((p) => p.id === prev.id);
      return match ?? (projects.length > 0 ? projects[0] : null);
    });
  }, [canViewProjects, projects]);

  const handleProjectSelect = useCallback((project: DashboardProjectRow) => {
    setSelectedProject(project);
  }, []);

  return {
    projects,
    selectedProject,
    loadingProjects,
    handleProjectSelect,
  };
}
