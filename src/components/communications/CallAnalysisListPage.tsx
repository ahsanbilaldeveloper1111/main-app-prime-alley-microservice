import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/report-style.scss";
import "@assets/scss/call-analysis-page.scss";

import BreadcrumbItem from "@common/BreadcrumbItem";
import CallAnalysisDateRangeBannerConnected from "@components/communications/CallAnalysisDateRangeBannerConnected";
import CallAnalysisView from "@components/communications/CallAnalysisView";
import {
  CALL_ANALYSIS_BREADCRUMB,
  CALL_ANALYSIS_EXTRA_LAYOUT_CSS,
  COMMUNICATIONS_LIST_SCOPED_LAYOUT,
} from "@components/communications/callLogsListPageConfig";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import { useAppSelector } from "@toolkit/hooks";
import React from "react";

function CallAnalysisListPageExtraStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: CALL_ANALYSIS_EXTRA_LAYOUT_CSS,
      }}
    />
  );
}

/** Call analysis — same list shell as call logs (prospects chrome + communications dropdown). */
export function CallAnalysisListPage() {
  const showPageLoader = useAppSelector(
    (s) => s.callAnalysisList?.showPageLoader ?? false,
  );

  return (
    <React.Fragment>
      <CrmListPageScopedLayoutStyles config={COMMUNICATIONS_LIST_SCOPED_LAYOUT} />
      <CallAnalysisListPageExtraStyles />
      <div
        className="prospects-page-container call-analysis-page-container"
        style={{
          display: "flex",
          gap: 0,
          height: "calc(100vh - 74px)",
          overflow: "hidden",
        }}
      >
        <div
          className="prospects-scrollable-content"
          style={{ flex: 1, height: "100%", overflowY: "hidden" }}
        >
          <BreadcrumbItem
            mainTitle={CALL_ANALYSIS_BREADCRUMB.mainTitle}
            mainLink={CALL_ANALYSIS_BREADCRUMB.mainLink}
            subTitle={CALL_ANALYSIS_BREADCRUMB.subTitle}
            showPageLoader={showPageLoader}
          />

          <div
            className="container-fluid prospects-content-area"
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CallAnalysisDateRangeBannerConnected />

            <div
              className="prospects-table-wrapper call-analysis-table-wrapper"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <CallAnalysisView />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default CallAnalysisListPage;
