import "@assets/scss/datatable-style.scss";
import "@assets/css/GenericTable.css";
import "@assets/scss/common.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { FaqItemsPageView } from "./components/FaqItemsPageView";
import { useFAQItemsPage } from "./useFAQItemsPage";

const FAQItems = () => {
  const ctx = useFAQItemsPage();

  return (
    <FaqItemsPageView
      tableData={ctx.tableData}
      totalRows={ctx.totalRows}
      isLoading={ctx.isLoading}
      columns={ctx.columns}
      actions={ctx.actions}
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
  );
};

FAQItems.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FAQItems;
