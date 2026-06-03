import "@assets/scss/common.scss";
import "@assets/scss/live-calls.scss";

import BreadcrumbItem from "@common/BreadcrumbItem";
import WallboardsLiveView from "@components/communications/wallboards-live/WallboardsLiveView";
import {
  COMMUNICATIONS_LIST_SCOPED_LAYOUT,
  WALLBOARD_BREADCRUMB,
} from "@components/communications/callLogsListPageConfig";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import React, { useState } from "react";

/** Live wallboard — same communications breadcrumb shell as call logs list pages. */
export function WallboardsLiveListPage() {
  const [showPageLoader, setShowPageLoader] = useState(false);

  return (
    <React.Fragment>
      <CrmListPageScopedLayoutStyles config={COMMUNICATIONS_LIST_SCOPED_LAYOUT} />
      <div
        className="prospects-page-container wallboards-live-page-container"
        style={{
          display: "flex",
          gap: 0,
          height: "calc(100vh - 74px)",
          overflow: "hidden",
        }}
      >
        <div
          className="prospects-scrollable-content"
          style={{ flex: 1, height: "100%", overflowY: "auto" }}
        >
          <BreadcrumbItem
            mainTitle={WALLBOARD_BREADCRUMB.mainTitle}
            mainLink={WALLBOARD_BREADCRUMB.mainLink}
            subTitle={WALLBOARD_BREADCRUMB.subTitle}
            showPageLoader={showPageLoader}
          />

          <div className="container-fluid prospects-content-area">
            <WallboardsLiveView onShowPageLoaderChange={setShowPageLoader} />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default WallboardsLiveListPage;
