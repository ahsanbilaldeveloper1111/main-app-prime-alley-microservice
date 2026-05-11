import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import BreadcrumbItem from "@common/BreadcrumbItem";
import { TicketModulesPageView } from "./components/TicketModulesPageView";
import { useTicketModulesPage } from "./useTicketModulesPage";

const TicketModules = () => {
  const ctx = useTicketModulesPage();

  return (
    <React.Fragment>
      <BreadcrumbItem mainTitle="Tickets" mainLink="/tickets/modules" subTitle="Ticket Modules" />
      <TicketModulesPageView
        extensions={ctx.extensions}
        data={ctx.data}
        loading={ctx.loading}
        columns={ctx.columns}
        actions={ctx.actions}
        currentPage={ctx.currentPage}
        rowsPerPage={ctx.rowsPerPage}
        totalRows={ctx.totalRows}
        searchValue={ctx.searchValue}
        onSearchChange={ctx.handleSearchChange}
        onPaginationChange={ctx.handlePaginationChange}
        canViewList={ctx.canViewList}
        canCreate={ctx.canCreate}
        colorSuggestions={ctx.colorSuggestions}
        showEditModuleModal={ctx.showEditModuleModal}
        selectedModuleName={ctx.selectedModuleName}
        selectedModuleDescription={ctx.selectedModuleDescription}
        selectedModuleColor={ctx.selectedModuleColor}
        selectedModuleUserExtension={ctx.selectedModuleUserExtension}
        onSelectedModuleUserExtensionChange={ctx.setSelectedModuleUserExtension}
        onEditModuleNameChange={ctx.handleEditModuleNameChange}
        onEditModuleDescriptionChange={ctx.handleEditModuleDescriptionChange}
        onEditModuleColorChange={ctx.handleEditModuleColorChange}
        onSetSelectedModuleColor={ctx.setSelectedModuleColor}
        onSubmitEditModule={ctx.handleSubmitEditModule}
        onCloseEditModuleModal={ctx.closeEditModuleModal}
        showDeleteModuleModal={ctx.showDeleteModuleModal}
        deleteTargetName={ctx.deleteTargetName}
        onSubmitDeleteModule={ctx.handleSubmitDeleteModule}
        onCloseDeleteModuleModal={ctx.closeDeleteModuleModal}
        showCreateModuleModal={ctx.showCreateModuleModal}
        newModuleName={ctx.newModuleName}
        newModuleDescription={ctx.newModuleDescription}
        newModuleColor={ctx.newModuleColor}
        newModuleUserExtension={ctx.newModuleUserExtension}
        onNewModuleUserExtensionChange={ctx.setNewModuleUserExtension}
        onNewModuleNameChange={ctx.handleNewModuleNameChange}
        onNewModuleDescriptionChange={ctx.handleNewModuleDescriptionChange}
        onNewModuleColorChange={ctx.handleNewModuleColorChange}
        onSetNewModuleColor={ctx.setNewModuleColor}
        onSubmitCreateModule={ctx.handleSubmitCreateModule}
        onOpenCreateModuleModal={ctx.openCreateModuleModal}
        onCloseCreateModuleModal={ctx.closeCreateModuleModal}
        showSubmoduleModal={ctx.showSubmoduleModal}
        selectedModuleForSubmodules={ctx.selectedModuleForSubmodules}
        submodules={ctx.submodules}
        onCloseSubmoduleModal={ctx.closeSubmoduleModal}
        onDeleteSubmodule={ctx.handleDeleteSubmodule}
      />
    </React.Fragment>
  );
};

TicketModules.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default TicketModules;
