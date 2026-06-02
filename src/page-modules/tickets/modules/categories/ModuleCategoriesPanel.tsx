import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React from "react";
import { ModuleCategoriesPageView } from "@page-modules/tickets/modules/categories/components/ModuleCategoriesPageView";
import { useModuleCategoriesPage } from "@page-modules/tickets/modules/categories/useModuleCategoriesPage";
import { useTicketsPanelChrome } from "@page-modules/tickets/shared/useTicketsPanelChrome";

const ModuleCategoriesPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink, embeddedInMainSettings } =
    useTicketsPanelChrome("categories");
  const c = useModuleCategoriesPage();

  return (
    <div className={embeddedInMainSettings ? "tickets-settings-panel" : undefined}>
      <ModuleCategoriesPageView
        showBreadcrumb={showBreadcrumb}
        embeddedInMainSettings={embeddedInMainSettings}
        breadcrumbMainLink={breadcrumbMainLink}
        data={c.data}
        loading={c.loading}
        columns={c.columns}
        actions={c.actions}
        currentPage={c.currentPage}
        rowsPerPage={c.rowsPerPage}
        totalRows={c.totalRows}
        searchValue={c.searchValue}
        onSearchChange={c.handleSearchChange}
        onPaginationChange={c.handlePaginationChange}
        showCreateModal={c.showCreateModal}
        onCloseCreateModal={() => c.setShowCreateModal(false)}
        onOpenCreateModal={() => c.setShowCreateModal(true)}
        newSubmoduleName={c.newSubmoduleName}
        onNewSubmoduleNameChange={c.setNewSubmoduleName}
        newSubmoduleDescription={c.newSubmoduleDescription}
        onNewSubmoduleDescriptionChange={c.setNewSubmoduleDescription}
        newSubmoduleModuleId={c.newSubmoduleModuleId}
        onNewSubmoduleModuleIdChange={c.setNewSubmoduleModuleId}
        modules={c.modules}
        onSubmitCreateCategory={c.handleCreateSubmodule}
        showDeleteModal={c.showSubmoduleDeleteModal}
        onCloseDeleteModal={() => c.setShowSubmoduleDeleteModal(false)}
        onConfirmDelete={c.handleDeleteSubmodule}
      />
    </div>
  );
};

export default ModuleCategoriesPanel;
