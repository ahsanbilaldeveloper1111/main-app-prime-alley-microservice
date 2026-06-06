import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { TicketStatusesPageView } from "@page-modules/tickets/statuses/components/TicketStatusesPageView";
import { useTicketStatusesPage } from "@page-modules/tickets/statuses/useTicketStatusesPage";
import { useTicketsPanelChrome } from "@page-modules/tickets/shared/useTicketsPanelChrome";

const TicketStatusesPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink, embeddedInMainSettings } =
    useTicketsPanelChrome("statuses");
  const {
    data,
    loading,
    columns,
    currentPage,
    rowsPerPage,
    totalRows,
    searchValue,
    handleSearchChange,
    handlePaginationChange,
    canViewList,
    canCreate,
    showCreateStatusSidebar,
    newStatusName,
    newStatusColor,
    handleNewStatusNameChange,
    handleNewStatusColorChange,
    handleSubmitCreateStatus,
    openCreateStatusSidebar,
    closeCreateStatusSidebar,
    createSidebarConfig,
    showEditStatusModal,
    selectedStatusName,
    selectedStatusColor,
    handleEditStatusNameChange,
    handleEditStatusColorChange,
    handleSubmitEditStatus,
    closeEditStatusModal,
    editSidebarConfig,
    showDeleteStatusModal,
    closeDeleteStatusModal,
    handleSubmitDeleteStatus,
  } = useTicketStatusesPage();

  return (
    <div className={embeddedInMainSettings ? "tickets-settings-panel" : undefined}>
      {showBreadcrumb ? (
        <BreadcrumbItem
          mainTitle="Tickets"
          mainLink={breadcrumbMainLink}
          subTitle="Ticket Status"
        />
      ) : null}
      <TicketStatusesPageView
        embeddedInMainSettings={embeddedInMainSettings}
        data={data}
        loading={loading}
        columns={columns}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        totalRows={totalRows}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onPaginationChange={handlePaginationChange}
        canViewList={canViewList}
        canCreate={canCreate}
        showCreateStatusSidebar={showCreateStatusSidebar}
        newStatusName={newStatusName}
        newStatusColor={newStatusColor}
        onNewStatusNameChange={handleNewStatusNameChange}
        onNewStatusColorChange={handleNewStatusColorChange}
        onSubmitCreateStatus={handleSubmitCreateStatus}
        onOpenCreateStatusSidebar={openCreateStatusSidebar}
        onCloseCreateStatusSidebar={closeCreateStatusSidebar}
        createSidebarConfig={createSidebarConfig}
        showEditStatusModal={showEditStatusModal}
        selectedStatusName={selectedStatusName}
        selectedStatusColor={selectedStatusColor}
        onEditStatusNameChange={handleEditStatusNameChange}
        onEditStatusColorChange={handleEditStatusColorChange}
        onSubmitEditStatus={handleSubmitEditStatus}
        onCloseEditStatusModal={closeEditStatusModal}
        editSidebarConfig={editSidebarConfig}
        showDeleteStatusModal={showDeleteStatusModal}
        onCloseDeleteStatusModal={closeDeleteStatusModal}
        onSubmitDeleteStatus={handleSubmitDeleteStatus}
      />
    </div>
  );
};

export default TicketStatusesPanel;
