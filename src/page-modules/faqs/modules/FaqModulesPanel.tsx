import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import React from "react";
import { FaqModulesPageView } from "@page-modules/faqs/modules/components/FaqModulesPageView";
import { useFAQModulesPage } from "@page-modules/faqs/modules/useFAQModulesPage";
import { useFaqsPanelChrome } from "@page-modules/faqs/shared/useFaqsPanelChrome";

const FaqModulesPanel = () => {
  const ctx = useFAQModulesPage();
  const { showBreadcrumb, breadcrumbMainLink } = useFaqsPanelChrome("modules");

  return (
    <FaqModulesPageView
      showBreadcrumb={showBreadcrumb}
      breadcrumbMainLink={breadcrumbMainLink}
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
      showCreateSidebar={ctx.showCreateSidebar}
      newModuleName={ctx.newModuleName}
      newModuleDescription={ctx.newModuleDescription}
      newModuleIcon={ctx.newModuleIcon}
      onNewModuleNameChange={ctx.onNewModuleNameChange}
      onNewModuleDescChange={ctx.onNewModuleDescChange}
      onNewModuleIconTextChange={ctx.onNewModuleIconTextChange}
      openCreateIconPicker={ctx.openCreateIconPicker}
      onSubmitCreateModule={ctx.handleSubmitCreateModule}
      onOpenCreateSidebar={ctx.openCreateSidebar}
      onCloseCreateSidebar={ctx.closeCreateSidebar}
      showEditSidebar={ctx.showEditSidebar}
      selectedModuleName={ctx.selectedModuleName}
      selectedModuleDescription={ctx.selectedModuleDescription}
      selectedModuleIcon={ctx.selectedModuleIcon}
      onEditModuleNameChange={ctx.onEditModuleNameChange}
      onEditModuleDescChange={ctx.onEditModuleDescChange}
      onEditModuleIconTextChange={ctx.onEditModuleIconTextChange}
      openEditIconPicker={ctx.openEditIconPicker}
      onSubmitEditModule={ctx.handleSubmitEditModule}
      onCloseEditSidebar={ctx.closeEditSidebar}
      showDeleteModuleModal={ctx.showDeleteModuleModal}
      onCloseDeleteModal={ctx.closeDeleteModal}
      onConfirmDelete={ctx.handleSubmitDeleteModule}
      showSuccessfulModal={ctx.showSuccessfulModal}
      successModalTitle={ctx.successModalTitle}
      successModalDescription={ctx.successModalDescription}
      onCloseSuccessModal={ctx.closeSuccessModal}
      showIconPicker={ctx.showIconPicker}
      onCloseIconPicker={ctx.closeIconPicker}
      allIcons={ctx.allIcons}
      filteredIcons={ctx.filteredIcons}
      iconSearchQuery={ctx.iconSearchQuery}
      onIconSearchChange={ctx.handleIconSearchChange}
      onIconSelect={ctx.handleIconSelect}
      isSubmitting={ctx.isSubmitting}
    />
  );
};

export default FaqModulesPanel;
