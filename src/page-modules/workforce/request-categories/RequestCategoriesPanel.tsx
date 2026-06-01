import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@page-modules/workforce/request-categories/requestCategoriesPage.scss";
import React from "react";
import { RequestCategoriesPageView } from "@page-modules/workforce/request-categories/components/RequestCategoriesPageView";
import { useWorkforcePanelChrome } from "@page-modules/workforce/request-categories/useWorkforcePanelChrome";

export function RequestCategoriesPanel() {
  const { showBreadcrumb } = useWorkforcePanelChrome("request-categories");
  const embeddedInMainSettings = !showBreadcrumb;

  return (
    <div className={embeddedInMainSettings ? "workforce-settings-panel" : undefined}>
      <RequestCategoriesPageView
        hideBreadcrumb={!showBreadcrumb}
        embeddedInMainSettings={embeddedInMainSettings}
      />
    </div>
  );
}

export default RequestCategoriesPanel;
