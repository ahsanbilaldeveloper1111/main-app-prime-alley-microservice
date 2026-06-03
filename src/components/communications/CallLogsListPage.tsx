import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import BreadcrumbItem from "@common/BreadcrumbItem";
import CallLogsDateRangeBannerConnected from "@components/communications/CallLogsDateRangeBannerConnected";
import CallLogsTableSection from "@components/communications/CallLogsTableSection";
import {
  CALL_LOGS_BREADCRUMB,
  CALL_LOGS_EXTRA_LAYOUT_CSS,
  CALL_LOGS_LIST_SCOPED_LAYOUT,
} from "@components/communications/callLogsListPageConfig";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import { useAppSelector } from "@toolkit/hooks";
import React from "react";

function CallLogsListPageExtraStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: CALL_LOGS_EXTRA_LAYOUT_CSS,
      }}
    />
  );
}

/** Call logs list — same shell and CSS hooks as CRM prospects (`prospects-scrollable-content`). */
export function CallLogsListPage() {
  const showPageLoader = useAppSelector(
    (s) => s.callLogsList?.showPageLoader ?? false,
  );

  return (
    <React.Fragment>
      <CrmListPageScopedLayoutStyles config={CALL_LOGS_LIST_SCOPED_LAYOUT} />
      <CallLogsListPageExtraStyles />
      <div className="prospects-page-container call-logs-page-container">
        <div className="prospects-scrollable-content">
          <BreadcrumbItem
            mainTitle={CALL_LOGS_BREADCRUMB.mainTitle}
            mainLink={CALL_LOGS_BREADCRUMB.mainLink}
            subTitle={CALL_LOGS_BREADCRUMB.subTitle}
            showPageLoader={showPageLoader}
          />

          <div className="container-fluid prospects-content-area">
            <CallLogsDateRangeBannerConnected />

            <div className="prospects-table-wrapper call-logs-table-wrapper">
              <CallLogsTableSection />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default CallLogsListPage;
