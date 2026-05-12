import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { FAQTypesPageView } from "@page-modules/faqs/types/components/FAQTypesPageView";
import { useFAQTypesPage } from "@page-modules/faqs/types/useFAQTypesPage";

const FAQTypes = () => {
  const ctx = useFAQTypesPage();

  return (
    <FAQTypesPageView
      selectedTopic={ctx.selectedTopic}
      onTopicChange={ctx.setSelectedTopic}
      topicOptions={ctx.topicOptions}
      isLoadingTopics={ctx.isLoadingTopics}
      types={ctx.types}
      loading={ctx.loading}
    />
  );
};

FAQTypes.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default FAQTypes;
