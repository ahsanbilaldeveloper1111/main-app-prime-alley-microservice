import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@components/planner/plannerStatuses/plannerStatuses.scss";
import { WorkPlannerStatusesView } from "@page-modules/planner/statuses/components/WorkPlannerStatusesView";
import { useWorkPlannerStatuses } from "@page-modules/planner/statuses/useWorkPlannerStatuses";

const WorkPlannerStatuses = () => {
  const {
    canCreateGlobalStatus,
    statuses,
    loading,
    columns,
    actions,
    showCreateModal,
    showEditModal,
    showDeleteModal,
    selectedStatus,
    formData,
    setFormData,
    processing,
    handleCreateStatus,
    handleEditStatus,
    handleDeleteStatus,
    openCreateModal,
    closeCreateModal,
    closeEditModal,
    closeDeleteModal,
  } = useWorkPlannerStatuses();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="" mainLink="" subTitle="Work Planner Statuses" />
      <WorkPlannerStatusesView
        canCreateGlobalStatus={canCreateGlobalStatus}
        statuses={statuses}
        loading={loading}
        columns={columns}
        actions={actions}
        showCreateModal={showCreateModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        selectedStatus={selectedStatus}
        formData={formData}
        setFormData={setFormData}
        processing={processing}
        handleCreateStatus={handleCreateStatus}
        handleEditStatus={handleEditStatus}
        handleDeleteStatus={handleDeleteStatus}
        openCreateModal={openCreateModal}
        closeCreateModal={closeCreateModal}
        closeEditModal={closeEditModal}
        closeDeleteModal={closeDeleteModal}
      />
    </React.Fragment>
  );
};

WorkPlannerStatuses.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default WorkPlannerStatuses;
