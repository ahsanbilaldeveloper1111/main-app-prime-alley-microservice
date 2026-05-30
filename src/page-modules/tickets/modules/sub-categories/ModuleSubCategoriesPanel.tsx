import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React from "react";
import { ModuleSubCategoriesPageView } from "@page-modules/tickets/modules/sub-categories/components/ModuleSubCategoriesPageView";
import { useModuleSubCategoriesPage } from "@page-modules/tickets/modules/sub-categories/useModuleSubCategoriesPage";
import { useTicketsPanelChrome } from "@page-modules/tickets/shared/useTicketsPanelChrome";

const ModuleSubCategoriesPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink, embeddedInMainSettings } =
    useTicketsPanelChrome("sub-categories");
  const s = useModuleSubCategoriesPage();

  return (
    <div className={embeddedInMainSettings ? "tickets-settings-panel" : undefined}>
      <ModuleSubCategoriesPageView
        showBreadcrumb={showBreadcrumb}
        embeddedInMainSettings={embeddedInMainSettings}
        breadcrumbMainLink={breadcrumbMainLink}
        data={s.data}
        loading={s.loading}
        columns={s.columns}
        actions={s.actions}
        currentPage={s.currentPage}
        rowsPerPage={s.rowsPerPage}
        totalRows={s.totalRows}
        searchValue={s.searchValue}
        onSearchChange={s.handleSearchChange}
        onPaginationChange={s.handlePaginationChange}
        showSubmoduleChildrenModal={s.showSubmoduleChildrenModal}
        onCloseSubCategoryModal={s.closeSubCategoryModal}
        onOpenNewSubcategoryModal={s.openNewSubcategoryModal}
        modules={s.modules}
        newChildModuleId={s.newChildModuleId}
        onModuleChange={s.handleChangeModule}
        submodules={s.submodules}
        newChildSubmoduleId={s.newChildSubmoduleId}
        onSubmoduleChange={s.setNewChildSubmoduleId}
        newChildName={s.newChildName}
        onNewChildNameChange={s.setNewChildName}
        newChildDescription={s.newChildDescription}
        onNewChildDescriptionChange={s.setNewChildDescription}
        onSubmitCreateSubCategory={s.handleCreateChild}
        showDeleteModal={s.showSubmoduleDeleteModal}
        onCloseDeleteModal={() => s.setShowSubmoduleDeleteModal(false)}
        onConfirmDelete={s.handleDeleteChild}
      />
    </div>
  );
};

export default ModuleSubCategoriesPanel;
