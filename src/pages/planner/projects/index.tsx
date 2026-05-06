import React, { type ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/datatable-style.scss";
import DeleteConfirmationModal from "@pages/partial/DeleteConfirmationModal";
import GenericFilterSidebar from "@components/GenericFilterSidebar";
import { Container } from "react-bootstrap";
import { ExpandableProjectTable } from "@components/planner/workPlannerProjects/ExpandableProjectTable";
import { ProjectDetailOffcanvas } from "@components/planner/workPlannerProjects/ProjectDetailOffcanvas";
import { ProjectFormSidebar } from "@components/planner/workPlannerProjects/ProjectFormSidebar";
import { useWorkPlannerProjectsPage } from "@components/planner/workPlannerProjects/useWorkPlannerProjectsPage";
import type { ProjectPaginationState } from "@components/planner/workPlannerProjects/workPlannerProjectsPageApi";
import "@components/planner/workPlannerProjects/workPlannerProjectsPage.scss";

const WorkPlannerProjects = () => {
  const p = useWorkPlannerProjectsPage();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Projects" />

      <div className="wp-planner-projects">
        <div className="project-dashboard">
          <Container fluid>
            <GenericFilterSidebar
              isOpen={p.showFilterSidebar}
              onClose={p.handleCloseFilterSidebar}
              title="Filters"
              subtitle="Filter and refine projects"
              filters={p.filterFields}
              onApply={p.handleApplyFiltersAndClose}
              onReset={p.clearFilters}
              width="400px"
              showApplyButton
              showResetButton
            />

            <div className="wp-planner-projects__layout">
              <div className="wp-planner-projects__main">
                <ExpandableProjectTable
                  projects={p.filteredProjects}
                  loading={p.loading}
                  extensions={(p.hierarchyDataExtensions as any[]) || []}
                  sessionPlannerProjectCrud={p.sessionPlannerProjectCrud}
                  sessionUserPhoneOrExtension={p.sessionUserPhoneOrExtension}
                  onProjectClick={p.handleProjectClick}
                  onEditProject={p.handleEditProject}
                  onDeleteProject={p.handleDeleteProject}
                  pagination={p.pagination}
                  onPaginationChange={(page, rowsPerPage) =>
                    p.setPagination((prev: ProjectPaginationState) => ({ ...prev, page, limit: rowsPerPage }))
                  }
                  toolbarConfig={p.toolbarConfig}
                  statsCards={p.statsCardsData}
                  columns={p.projectTableColumns}
                  actions={p.projectTableActions}
                />
              </div>

              <ProjectDetailOffcanvas
                show={p.showProjectDetail}
                onHide={() => p.setShowProjectDetail(false)}
                selectedProject={p.selectedProject}
                selectedProjectDetails={p.selectedProjectDetails}
                loadingProjectDetails={p.loadingProjectDetails}
                loadingOverdueTasks={p.loadingOverdueTasks}
                overdueTasks={p.overdueTasks}
                detailTab={p.detailTab}
                setDetailTab={p.setDetailTab}
                loadingActivities={p.loadingActivities}
                projectActivities={p.projectActivities}
                getUserNameFromExtension={p.getUserNameFromExtension}
                getAvatarColor={p.getAvatarColor}
                getInitials={p.getInitials}
                getActionColor={p.getActionColor}
                formatTimeAgo={p.formatTimeAgo}
                formatDateTime={p.formatDateTime}
              />
            </div>
          </Container>
        </div>

        <ProjectFormSidebar
          show={p.showProjectModal}
          editingProject={p.editingProject}
          projectFormData={p.projectFormData}
          setProjectFormData={p.setProjectFormData}
          submitting={p.submitting}
          submitButtonText={p.submitButtonText}
          submittingButtonText={p.submittingButtonText}
          onClose={p.resetProjectModalState}
          onSubmit={p.handleSubmitProject}
        />

        <DeleteConfirmationModal
          show={p.showDeleteModal}
          onHide={() => {
            p.setShowDeleteModal(false);
            p.setProjectToDelete(null);
          }}
          onConfirm={p.confirmDelete}
          itemName={p.projectToDelete?.name}
          itemType="project"
          loading={p.deleting}
        />
      </div>
    </React.Fragment>
  );
};

WorkPlannerProjects.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default WorkPlannerProjects;
