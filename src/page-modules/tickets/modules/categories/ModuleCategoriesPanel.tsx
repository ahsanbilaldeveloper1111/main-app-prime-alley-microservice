import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React from "react";
import { ModuleCategoriesPageView } from "@page-modules/tickets/modules/categories/components/ModuleCategoriesPageView";
import { useModuleCategoriesPage } from "@page-modules/tickets/modules/categories/useModuleCategoriesPage";
import { useTicketsPanelChrome } from "@page-modules/tickets/shared/useTicketsPanelChrome";
import type { Column } from "@components/CustomDataTable";

const ModuleCategoriesPanel = () => {
  const { showBreadcrumb, breadcrumbMainLink } = useTicketsPanelChrome("categories");
  const c = useModuleCategoriesPage();

  return (
    <ModuleCategoriesPageView
      showBreadcrumb={showBreadcrumb}
      breadcrumbMainLink={breadcrumbMainLink}
      memoizedFilters={c.memoizedFilters}
      columns={c.columns as unknown as Column<object>[]}
      getListQueryOptions={c.getListQueryOptions}
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
  );
};

export default ModuleCategoriesPanel;
