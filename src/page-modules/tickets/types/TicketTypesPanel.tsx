import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React from "react";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { TicketTypesPageView } from "@page-modules/tickets/types/components/TicketTypesPageView";
import { useTicketTypesPage } from "@page-modules/tickets/types/useTicketTypesPage";
import { useTicketsPanelChrome } from "@page-modules/tickets/shared/useTicketsPanelChrome";

const TicketTypesPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink } = useTicketsPanelChrome("types");
  const {
    data,
    loading,
    columns,
    actions,
    currentPage,
    rowsPerPage,
    totalRows,
    searchValue,
    handleSearchChange,
    handlePaginationChange,
    canViewList,
    canCreate,
    showEditTypeModal,
    showDeleteTypeModal,
    showCreateTypeModal,
    selectedTypeName,
    selectedTypeDescription,
    newTypeName,
    newTypeDescription,
    handleNewTypeNameChange,
    handleNewTypeDescriptionChange,
    handleEditTypeNameChange,
    handleEditTypeDescriptionChange,
    handleSubmitEditType,
    handleSubmitDeleteType,
    handleSubmitCreateType,
    closeEditTypeModal,
    closeDeleteTypeModal,
    closeCreateTypeModal,
    openCreateTypeModal,
  } = useTicketTypesPage();

  return (
    <React.Fragment>
      {showBreadcrumb ? (
        <BreadcrumbItem
          mainTitle="Tickets"
          mainLink={breadcrumbMainLink}
          subTitle="Ticket Types"
        />
      ) : null}
      <TicketTypesPageView
        data={data}
        loading={loading}
        columns={columns}
        actions={actions}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        totalRows={totalRows}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onPaginationChange={handlePaginationChange}
        canViewList={canViewList}
        canCreate={canCreate}
        showEditTypeModal={showEditTypeModal}
        showDeleteTypeModal={showDeleteTypeModal}
        showCreateTypeModal={showCreateTypeModal}
        selectedTypeName={selectedTypeName}
        selectedTypeDescription={selectedTypeDescription}
        newTypeName={newTypeName}
        newTypeDescription={newTypeDescription}
        onNewTypeNameChange={handleNewTypeNameChange}
        onNewTypeDescriptionChange={handleNewTypeDescriptionChange}
        onEditTypeNameChange={handleEditTypeNameChange}
        onEditTypeDescriptionChange={handleEditTypeDescriptionChange}
        onSubmitEditType={handleSubmitEditType}
        onSubmitDeleteType={handleSubmitDeleteType}
        onSubmitCreateType={handleSubmitCreateType}
        onCloseEditTypeModal={closeEditTypeModal}
        onCloseDeleteTypeModal={closeDeleteTypeModal}
        onCloseCreateTypeModal={closeCreateTypeModal}
        onOpenCreateTypeModal={openCreateTypeModal}
      />
    </React.Fragment>
  );
};

export default TicketTypesPanel;
