import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { ModuleCategoriesPageView } from "./components/ModuleCategoriesPageView";
import { useModuleCategoriesPage } from "./useModuleCategoriesPage";

const ModuleCategories = () => {
  const c = useModuleCategoriesPage();

  return (
    <ModuleCategoriesPageView
      refreshKey={c.refreshKey}
      memoizedFilters={c.memoizedFilters}
      columns={c.columns}
      fetchSubmodules={c.fetchSubmodules}
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

ModuleCategories.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ModuleCategories;
