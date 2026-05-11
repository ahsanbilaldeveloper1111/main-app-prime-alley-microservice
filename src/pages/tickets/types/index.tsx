import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { TicketTypesPageView } from "@page-modules/tickets/types/components/TicketTypesPageView";
import { useTicketTypesPage } from "@page-modules/tickets/types/useTicketTypesPage";

const TicketTypes = () => {
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
      <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/types" subTitle="Ticket Types" />
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

TicketTypes.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TicketTypes;
