import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { ModuleSubCategoriesPageView } from "@page-modules/tickets/modules/sub-categories/components/ModuleSubCategoriesPageView";
import { useModuleSubCategoriesPage } from "@page-modules/tickets/modules/sub-categories/useModuleSubCategoriesPage";

const ModuleSubCategories = () => {
  const s = useModuleSubCategoriesPage();

  return (
    <ModuleSubCategoriesPageView
      refreshKey={s.refreshKey}
      memoizedFilters={s.memoizedFilters}
      columns={s.columns}
      fetchSubCategories={s.fetchSubCategories}
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

ModuleSubCategories.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default ModuleSubCategories;
