import React from "react";
import { FolderOpen, AlertCircle, CalendarDays, Users, ExternalLink, Calendar } from "lucide-react";
import { ProgressBar } from "react-bootstrap";
import GenericSidebar from "@components/GenericSidebarNew";
import {
  getProjectStatusFromApiStatus,
  getProjectStatusVariant,
  formatProjectSidebarDate,
  formatProjectSidebarDateTime,
  type ApiProject,
  type Project,
} from "@planner/workPlannerProjectsDomain";
import "@components/planner/workPlannerProjects/workPlannerProjectsPage.scss";

export type ProjectDetailOffcanvasProps = {
  show: boolean;
  onHide: () => void;
  selectedProject: Project | null;
  selectedProjectDetails: ApiProject | null;
  loadingProjectDetails: boolean;
  loadingOverdueTasks: boolean;
  overdueTasks: unknown[];
  detailTab: string;
  setDetailTab: (tab: string) => void;
  loadingActivities: boolean;
  projectActivities: unknown[];
  getUserNameFromExtension: (extensionNumber: string) => string;
  getAvatarColor: (extensionNumber: string, index: number) => string;
  getInitials: (extensionNumber: string) => string;
  getActionColor: (action: string) => string;
  formatTimeAgo: (dateString: string) => string;
  formatDateTime: (dateString: string) => string;
};

export const ProjectDetailOffcanvas: React.FC<ProjectDetailOffcanvasProps> = ({
  show,
  onHide,
  selectedProject,
  selectedProjectDetails,
  loadingProjectDetails,
  loadingOverdueTasks,
  overdueTasks,
  detailTab: _detailTab,
  setDetailTab: _setDetailTab,
  loadingActivities: _loadingActivities,
  projectActivities: _projectActivities,
  getUserNameFromExtension,
  getAvatarColor: _getAvatarColor,
  getInitials: _getInitials,
  getActionColor: _getActionColor,
  formatTimeAgo: _formatTimeAgo,
  formatDateTime: _formatDateTime,
}) => {
  void _detailTab;
  void _setDetailTab;
  void _loadingActivities;
  void _projectActivities;
  void _getAvatarColor;
  void _getInitials;
  void _getActionColor;
  void _formatTimeAgo;
  void _formatDateTime;
  if (!show || !selectedProject) {
    return null;
  }

  const resolvedStatus = selectedProjectDetails
    ? getProjectStatusFromApiStatus(selectedProjectDetails.status)
    : selectedProject.status;

  const sidebarStartDate = formatProjectSidebarDate(
    selectedProjectDetails?.start_date ?? selectedProject.apiData?.start_date ?? undefined,
  );
  const sidebarEndDate = formatProjectSidebarDate(
    selectedProjectDetails?.end_date ?? selectedProject.apiData?.end_date ?? undefined,
  );
  const sidebarProjectColor =
    selectedProjectDetails?.color?.trim() || selectedProject.iconColor || "#3b82f6";
  const lastUpdatedIso = selectedProjectDetails?.updated_at ?? selectedProject.apiData?.updated_at;
  const fallbackLastUpdated = selectedProject.lastUpdate === "N/A" ? null : selectedProject.lastUpdate;
  const lastUpdatedDisplay =
    formatProjectSidebarDateTime(lastUpdatedIso) ?? fallbackLastUpdated;
  const projectMembers = selectedProjectDetails?.members || selectedProject.members;
  const progressPercent = Math.round((1 - selectedProject.open / (selectedProject.open + 50)) * 100);

  const descriptionHtml = selectedProjectDetails?.description?.trim();

  return (
    <GenericSidebar
      isOpen={show}
      onClose={onHide}
      width="470px"
      title={selectedProject.name}
      subtitle={resolvedStatus.toUpperCase()}
      avatar={{
        name: selectedProject.name,
        initials: selectedProject.name.slice(0, 1).toUpperCase(),
        gradient: selectedProject.iconColor,
      }}
      actionsDropdown={{
        label: "Actions",
        items: [
          {
            label: "Open Project",
            onClick: () => {
              globalThis.window?.open(`/planner/projects/${selectedProject.id}`, "_blank");
            },
          },
        ],
      }}
      sections={[
        {
          id: "project-overview",
          title: "Overview",
          icon: FolderOpen,
          collapsible: true,
          defaultExpanded: true,
          isLoading: loadingProjectDetails,
          fields: [
            { label: "Open Tasks", value: selectedProject.open },
            {
              label: "Overdue Tasks",
              value: loadingOverdueTasks ? "Loading..." : overdueTasks.length,
            },
            {
              label: "Owner / PM",
              value: selectedProjectDetails?.owner_extension_number
                ? getUserNameFromExtension(selectedProjectDetails.owner_extension_number)
                : selectedProject.owner,
            },
            {
              label: "Status",
              value: resolvedStatus.toUpperCase(),
              type: "badge",
              badgeVariant: getProjectStatusVariant(resolvedStatus),
            },
            {
              label: "Last Updated",
              value: lastUpdatedDisplay ?? "--",
              type: "datetime",
              icon: Calendar,
            },
          ],
        },
        {
          id: "project-progress",
          title: "Progress",
          icon: AlertCircle,
          collapsible: true,
          defaultExpanded: true,
          customContent: (
            <>
              <ProgressBar now={progressPercent} className="wp-sidebar-progress-bar" variant="primary" />
              <div className="wp-sidebar-progress-foot">{progressPercent}% Complete</div>
            </>
          ),
        },
        {
          id: "project-dates",
          title: "Dates & Color",
          icon: CalendarDays,
          collapsible: true,
          defaultExpanded: true,
          fields: [
            { label: "Start Date", value: sidebarStartDate, type: "date", icon: Calendar },
            { label: "End Date", value: sidebarEndDate, type: "date", icon: CalendarDays },
            {
              label: "Color",
              type: "color",
              value: sidebarProjectColor,
              copyable: true,
            },
          ],
        },
        {
          id: "project-members",
          title: `Team Members (${projectMembers.length})`,
          icon: Users,
          collapsible: true,
          defaultExpanded: true,
          customContent: (
            <div className="d-flex flex-column gap-2">
              {projectMembers.map((member: any) => {
                const ext = member.extension_number || member.name || "";
                const key = String(
                  member?.id ?? member?.extension_number ?? member?.name ?? `${ext}-${member?.role ?? ""}`,
                );
                return (
                  <div key={key} className="wp-sidebar-member-line">
                    {member.user?.name || getUserNameFromExtension(ext)}
                    {member.role ? ` (${member.role})` : ""}
                  </div>
                );
              })}
            </div>
          ),
        },
        {
          id: "project-description",
          title: "Description",
          icon: ExternalLink,
          collapsible: true,
          defaultExpanded: true,
          customContent: descriptionHtml ? (
            <div
              className="task-description-html wp-sidebar-description"
              dangerouslySetInnerHTML={{ __html: String(descriptionHtml) }}
            />
          ) : (
            <span className="wp-sidebar-no-description">No description</span>
          ),
        },
      ]}
    />
  );
};
