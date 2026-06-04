import "@assets/scss/datatable-style.scss";
import "@assets/css/GenericTable.css";
import "@assets/scss/common.scss";
import React from "react";
import { FaqItemsPageView } from "@page-modules/faqs/items/components/FaqItemsPageView";
import { useFAQItemsPage } from "@page-modules/faqs/items/useFAQItemsPage";
import { useFaqsPanelChrome } from "@page-modules/faqs/shared/useFaqsPanelChrome";

const FaqItemsPanel = () => {
  const ctx = useFAQItemsPage();
  const { showBreadcrumb, breadcrumbMainLink, embeddedInMainSettings } =
    useFaqsPanelChrome("items");

  return (
    <div className={embeddedInMainSettings ? "faqs-settings-panel" : undefined}>
      <FaqItemsPageView
        embeddedInMainSettings={embeddedInMainSettings}
        showBreadcrumb={showBreadcrumb}
        breadcrumbMainLink={breadcrumbMainLink}
        tableData={ctx.tableData}
        totalRows={ctx.totalRows}
        isLoading={ctx.isLoading}
        columns={ctx.columns}
        currentPage={ctx.currentPage}
        rowsPerPage={ctx.rowsPerPage}
        searchValue={ctx.searchValue}
        onSearchChange={ctx.handleSearchChange}
        onPaginationChange={ctx.handlePaginationChange}
        formData={ctx.formData}
        topicOptions={ctx.topicOptions}
        isLoadingTopics={ctx.isLoadingTopics}
        showCreateSidebar={ctx.showCreateSidebar}
        showEditSidebar={ctx.showEditSidebar}
        selectedItemId={ctx.selectedItemId}
        onTopicChange={ctx.handleTopicChange}
        onQuestionChange={ctx.handleQuestionChange}
        onAnswerChange={ctx.handleAnswerChange}
        onDescriptionChange={ctx.handleDescriptionChange}
        onTypeChange={ctx.handleTypeChange}
        onOpenCreate={ctx.openCreateSidebar}
        onCloseCreate={ctx.closeCreateSidebar}
        onCloseEdit={ctx.closeEditSidebar}
        onSubmitCreate={ctx.handleSubmitCreateItem}
        onSubmitEdit={ctx.handleSubmitEditItem}
        showDeleteItemModal={ctx.showDeleteItemModal}
        onCloseDeleteModal={ctx.closeDeleteModal}
        onConfirmDelete={ctx.handleSubmitDeleteItem}
        showSuccessfulModal={ctx.showSuccessfulModal}
        successModalTitle={ctx.successModalTitle}
        successModalDescription={ctx.successModalDescription}
        onCloseSuccessModal={ctx.closeSuccessModal}
        isSubmitting={ctx.isSubmitting}
      />
    </div>
  );
};

export default FaqItemsPanel;
