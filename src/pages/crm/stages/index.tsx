import "@assets/scss/datatable-style.scss";
import "@assets/scss/stages-table.scss";
import "@assets/scss/stages-page.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement, useMemo } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import GenericTable, { type ToolbarConfig } from "@components/GenericTable";
import { Form } from "react-bootstrap";
import { BarChart3, Plus } from "lucide-react";
import FormModal from "@components/page-partials/FormModal";
import SuccessfulModal from "@components/page-partials/SuccessfulModal";
import DeleteConfirmationModal from "@components/page-partials/DeleteConfirmationModal";
import { reportApiErrorFromCatch } from "@utils/sentryLogger";
import { useStagesManagement } from "@hooks/crm/useStagesManagement";
import { HEADER_CONSTANTS } from "@constants/headerConstants";
import type { CrmPageDisplayProps } from "@page-modules/crm/crmPageDisplayProps";
import {
  DEFAULT_STAGES_SELECTED_COLUMNS,
  STAGES_TABLE_COLUMN_STORAGE_KEY,
  type StageRow,
} from "@page-modules/crm/stages/stagesPageModel";
import { StageCreateSidebar } from "@page-modules/crm/stages/StageCreateSidebar";
import { StageFormFields } from "@page-modules/crm/stages/StageFormFields";
import { StageRestoreModal } from "@page-modules/crm/stages/StageRestoreModal";
import { StageViewModal } from "@page-modules/crm/stages/StageViewModal";
import { StagesAnalyticsSection } from "@page-modules/crm/stages/StagesAnalyticsSection";
import { buildStagesTableColumns } from "@page-modules/crm/stages/stagesTableColumns";

const { PERMISSIONS } = HEADER_CONSTANTS;

function consumeHandledApiError(error: unknown, source: string): void {
  reportApiErrorFromCatch(error, source, { scope: "StagesManagement" });
}

function scaffoldFormEvent(): React.FormEvent {
  return { preventDefault() {} } as React.FormEvent;
}

const StagesManagement = ({ hideBreadcrumb }: CrmPageDisplayProps = {}) => {
  const {
    session,
    showCreateModal,
    setShowCreateModal,
    showUpdateModal,
    showDeleteModal,
    setShowDeleteModal,
    showViewModal,
    setShowViewModal,
    showSuccessfulModal,
    submittingStageForm,
    deletingStage,
    successModalTitle,
    successModalDescription,
    stageToDelete,
    setStageToDelete,
    viewingStage,
    formData,
    stagesSearch,
    handleToolbarSearchChange,
    handleToolbarSearchSubmit,
    activeFilter,
    showStagesAnalytics,
    selectedStagesColumns,
    setSelectedStagesColumns,
    stagesPagination,
    handleStagesPaginationChange,
    handleStagesSort,
    loadingStages,
    showRestoreModal,
    setShowRestoreModal,
    stageToRestore,
    setStageToRestore,
    restoring,
    handleCloseSuccessfulModal,
    handleSubmit,
    handleCloseUpdateModal,
    handleUpdateStage,
    handleDeleteStage,
    handleConfirmRestore,
    openRestoreModal,
    openStageView,
    openStageEdit,
    openStageDelete,
    handleInputChange,
    filteredStages,
    paginatedStages,
    analyticsData,
    filterCounts,
    handleToolbarTabChange,
    toggleStagesAnalytics,
    openCreateStageModal,
  } = useStagesManagement();

  const permissions = session?.user?.permissions;
  const canViewStages = permissions?.includes(PERMISSIONS.VIEW_CRM_STAGES) ?? false;
  const canEditStages = permissions?.includes(PERMISSIONS.EDIT_CRM_STAGES) ?? false;
  const canDeleteStages =
    permissions?.includes(PERMISSIONS.DELETE_CRM_STAGES) ?? false;
  const canCreateStages =
    permissions?.includes(PERMISSIONS.CREATE_CRM_STAGES) ?? false;

  const stagesTableColumns = useMemo(
    () =>
      buildStagesTableColumns({
        selectedColumns: selectedStagesColumns,
        activeFilter,
        canEdit: canEditStages,
        canDelete: canDeleteStages,
        onView: openStageView,
        onEdit: openStageEdit,
        onDelete: openStageDelete,
        onRestore: openRestoreModal,
      }),
    [
      selectedStagesColumns,
      activeFilter,
      canEditStages,
      canDeleteStages,
      openStageView,
      openStageEdit,
      openStageDelete,
      openRestoreModal,
    ],
  );

  const toolbarConfig = useMemo<ToolbarConfig>(
    () => ({
      showSearch: true,
      searchValue: stagesSearch,
      searchPlaceholder: "Search stages...",
      onSearchChange: handleToolbarSearchChange,
      onSearch: handleToolbarSearchSubmit,
      showTabs: true,
      tabs: [
        { id: "all", label: "All Types", count: filterCounts.all, removable: false },
        { id: "lead", label: "Lead", count: filterCounts.lead, removable: false },
        { id: "deal", label: "Deal", count: filterCounts.deal, removable: false },
        { id: "order", label: "Order", count: filterCounts.order, removable: false },
        {
          id: "lost_reason",
          label: "Lost Reason",
          count: filterCounts.lost_reason,
          removable: false,
        },
        { id: "deleted", label: "Deleted", removable: false },
      ],
      activeTab: activeFilter,
      onTabChange: handleToolbarTabChange,
      rightActions: (
        <div className="d-flex gap-2">
          <button
            type="button"
            className={`stages-toolbar-btn stages-toolbar-btn--analytics${
              showStagesAnalytics ? " is-active" : ""
            }`}
            onClick={toggleStagesAnalytics}
          >
            <BarChart3 size={15} aria-hidden />
            Analytics
          </button>
          {canCreateStages && (
            <button
              type="button"
              className="stages-toolbar-btn stages-toolbar-btn--add"
              onClick={openCreateStageModal}
            >
              <Plus size={15} aria-hidden />
              Add Custom Stage
            </button>
          )}
        </div>
      ),
    }),
    [
      stagesSearch,
      activeFilter,
      filterCounts,
      showStagesAnalytics,
      canCreateStages,
      handleToolbarSearchChange,
      handleToolbarSearchSubmit,
      handleToolbarTabChange,
      toggleStagesAnalytics,
      openCreateStageModal,
    ],
  );

  if (!canViewStages) {
    return null;
  }

  return (
    <React.Fragment>
      {!hideBreadcrumb && (
        <BreadcrumbItem
          mainTitle="CRM"
          mainLink="/crm/dashboard"
          subTitle="Stages"
        />
      )}

      <div>
        {showStagesAnalytics && (
          <StagesAnalyticsSection analyticsData={analyticsData} />
        )}

        <div className="stages-table-wrapper mb-4">
          <GenericTable<StageRow>
            data={paginatedStages}
            columns={stagesTableColumns}
            actions={[]}
            showActions={false}
            sortable
            defaultSortBy={stagesPagination.sortBy}
            defaultSortOrder={stagesPagination.sortOrder}
            onSort={handleStagesSort}
            loading={loadingStages}
            emptyMessage="No stages found matching your criteria"
            pagination={{
              currentPage: stagesPagination.currentPage,
              rowsPerPage: stagesPagination.rowsPerPage,
              totalRows: filteredStages.length,
              pageSizeOptions: [10, 15, 25, 50, 100],
            }}
            onPaginationChange={handleStagesPaginationChange}
            customizableColumns
            selectedColumns={selectedStagesColumns}
            defaultSelectedColumns={DEFAULT_STAGES_SELECTED_COLUMNS}
            onColumnChange={setSelectedStagesColumns}
            columnStorageKey={STAGES_TABLE_COLUMN_STORAGE_KEY}
            showToolbar
            toolbar={toolbarConfig}
            showToolbarActions={false}
            uniqueKey="id"
            onPreviewClick={(stage) => openStageView(stage)}
          />
        </div>
      </div>

      {showCreateModal && (
        <StageCreateSidebar
          formData={formData}
          submitting={submittingStageForm}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleSubmit}
          onChange={handleInputChange}
        />
      )}

      <FormModal
        show={showUpdateModal}
        onHide={handleCloseUpdateModal}
        title="Update Stage"
        desc="Please update the details below for this stage."
        size="lg"
        formHtml={
          <Form onSubmit={handleUpdateStage}>
            <StageFormFields formData={formData} onChange={handleInputChange} />
          </Form>
        }
        submitButtonText={
          submittingStageForm ? "Updating Stage..." : "Update Stage"
        }
        cancelButtonText="Cancel"
        onSubmit={() => {
          handleUpdateStage(scaffoldFormEvent()).catch((error: unknown) => {
            consumeHandledApiError(error, "StagesManagement.updateStageSubmit");
          });
        }}
        onCancel={handleCloseUpdateModal}
        submitButtonVariant="primary"
        cancelButtonVariant="secondary"
        isSubmitting={submittingStageForm}
        isSubmitDisabled={submittingStageForm}
        useCrmDialogFooterStyle
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setStageToDelete(null);
        }}
        onConfirm={handleDeleteStage}
        itemName={stageToDelete?.name}
        itemType="stage"
        loading={deletingStage}
      />

      <StageRestoreModal
        show={showRestoreModal}
        restoring={restoring}
        stageToRestore={stageToRestore}
        onHide={() => {
          if (restoring) return;
          setShowRestoreModal(false);
          setStageToRestore(null);
        }}
        onConfirm={() => {
          handleConfirmRestore().catch((error: unknown) => {
            consumeHandledApiError(error, "StagesManagement.restoreStageSubmit");
          });
        }}
        onCancel={() => {
          setShowRestoreModal(false);
          setStageToRestore(null);
        }}
      />

      {viewingStage && (
        <StageViewModal
          show={showViewModal}
          stage={viewingStage}
          canEdit={canEditStages}
          onHide={() => setShowViewModal(false)}
          onEdit={() => {
            setShowViewModal(false);
            openStageEdit(viewingStage);
          }}
        />
      )}

      <SuccessfulModal
        show={showSuccessfulModal}
        onHide={handleCloseSuccessfulModal}
        title={successModalTitle}
        description={successModalDescription}
      />
    </React.Fragment>
  );
};

StagesManagement.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default StagesManagement;
