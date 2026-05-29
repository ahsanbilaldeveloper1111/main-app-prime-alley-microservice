import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React from "react";
import { ModuleSubCategoriesPageView } from "@page-modules/tickets/modules/sub-categories/components/ModuleSubCategoriesPageView";
import { useModuleSubCategoriesPage } from "@page-modules/tickets/modules/sub-categories/useModuleSubCategoriesPage";
import { useTicketsPanelChrome } from "@page-modules/tickets/shared/useTicketsPanelChrome";
import type { Column } from "@components/CustomDataTable";

const ModuleSubCategoriesPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink } = useTicketsPanelChrome("sub-categories");
  const s = useModuleSubCategoriesPage();

  return (
    <ModuleSubCategoriesPageView
      showBreadcrumb={showBreadcrumb}
      breadcrumbMainLink={breadcrumbMainLink}
      memoizedFilters={s.memoizedFilters}
      columns={s.columns as unknown as Column<object>[]}
      getListQueryOptions={s.getListQueryOptions}
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
  );
};

export default ModuleSubCategoriesPanel;
