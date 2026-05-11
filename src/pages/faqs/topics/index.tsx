import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { FAQTopicsPageView } from "./components/FAQTopicsPageView";
import { useFAQTopicsPage } from "./useFAQTopicsPage";

const FAQTopics = () => {
  const ctx = useFAQTopicsPage();

  return (
    <FAQTopicsPageView
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
      showSidebar={ctx.showSidebar}
      sidebarMode={ctx.sidebarMode}
      moduleOptions={ctx.moduleOptions}
      isLoadingModules={ctx.isLoadingModules}
      topicName={ctx.topicName}
      topicDescription={ctx.topicDescription}
      topicModuleId={ctx.topicModuleId}
      onTopicNameChange={ctx.handleTopicNameChange}
      onTopicDescChange={ctx.handleTopicDescChange}
      onTopicModuleChange={ctx.handleTopicModuleChange}
      onSubmitTopic={ctx.handleSubmitTopic}
      onOpenCreateSidebar={ctx.openCreateSidebar}
      onCloseSidebar={ctx.closeSidebar}
      showDeleteTopicModal={ctx.showDeleteTopicModal}
      deleteTopicName={ctx.deleteTopicName}
      onCloseDeleteModal={ctx.closeDeleteModal}
      onConfirmDelete={ctx.handleSubmitDeleteTopic}
      showSuccessfulModal={ctx.showSuccessfulModal}
      successModalTitle={ctx.successModalTitle}
      successModalDescription={ctx.successModalDescription}
      onCloseSuccessModal={ctx.closeSuccessModal}
      isSubmitting={ctx.isSubmitting}
    />
  );
};

FAQTopics.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FAQTopics;
