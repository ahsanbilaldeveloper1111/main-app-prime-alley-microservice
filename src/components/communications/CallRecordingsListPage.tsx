import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";

import BreadcrumbItem from "@common/BreadcrumbItem";
import CallRecordingsDateRangeBannerConnected from "@components/communications/CallRecordingsDateRangeBannerConnected";
import CallRecordingsView from "@components/communications/CallRecordingsView";
import {
  CALL_RECORDINGS_BREADCRUMB,
  CALL_RECORDINGS_EXTRA_LAYOUT_CSS,
  COMMUNICATIONS_LIST_SCOPED_LAYOUT,
} from "@components/communications/callLogsListPageConfig";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import { useAppSelector } from "@toolkit/hooks";
import React from "react";

function CallRecordingsListPageExtraStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: CALL_RECORDINGS_EXTRA_LAYOUT_CSS,
      }}
    />
  );
}

/** Call recordings — same list shell as call logs (prospects chrome + communications dropdown). */
export function CallRecordingsListPage() {
  const showPageLoader = useAppSelector(
    (s) => s.callRecordingsList?.showPageLoader ?? false,
  );

  return (
    <React.Fragment>
      <CrmListPageScopedLayoutStyles config={COMMUNICATIONS_LIST_SCOPED_LAYOUT} />
      <CallRecordingsListPageExtraStyles />
      <div className="prospects-page-container call-recordings-page-container">
        <div className="prospects-scrollable-content">
          <BreadcrumbItem
            mainTitle={CALL_RECORDINGS_BREADCRUMB.mainTitle}
            mainLink={CALL_RECORDINGS_BREADCRUMB.mainLink}
            subTitle={CALL_RECORDINGS_BREADCRUMB.subTitle}
            showPageLoader={showPageLoader}
          />

          <div className="container-fluid prospects-content-area">
            <CallRecordingsDateRangeBannerConnected />

            <div className="prospects-table-wrapper call-recordings-table-wrapper">
              <CallRecordingsView />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default CallRecordingsListPage;
