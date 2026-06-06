import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import React from "react";
import { FAQTypesPageView } from "@page-modules/faqs/types/components/FAQTypesPageView";
import { useFAQTypesPage } from "@page-modules/faqs/types/useFAQTypesPage";
import { useFaqsPanelChrome } from "@page-modules/faqs/shared/useFaqsPanelChrome";

const FAQTypesPanel = () => {
  const ctx = useFAQTypesPage();
  const { showBreadcrumb, breadcrumbMainLink, embeddedInMainSettings } =
    useFaqsPanelChrome("types");

  return (
    <div className={embeddedInMainSettings ? "faqs-settings-panel" : undefined}>
    <FAQTypesPageView
      showBreadcrumb={showBreadcrumb}
      breadcrumbMainLink={breadcrumbMainLink}
      selectedTopic={ctx.selectedTopic}
      onTopicChange={ctx.setSelectedTopic}
      topicOptions={ctx.topicOptions}
      isLoadingTopics={ctx.isLoadingTopics}
      types={ctx.types}
      loading={ctx.loading}
    />
    </div>
  );
};

export default FAQTypesPanel;
