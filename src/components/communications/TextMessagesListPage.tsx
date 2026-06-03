import "@assets/scss/datatable-style.scss";
import "@assets/scss/common.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/text-messages-page.scss";

import BreadcrumbItem from "@common/BreadcrumbItem";
import TextMessagesView from "@components/communications/TextMessagesView";
import {
  COMMUNICATIONS_LIST_SCOPED_LAYOUT,
  TEXT_MESSAGES_BREADCRUMB,
  TEXT_MESSAGES_EXTRA_LAYOUT_CSS,
} from "@components/communications/callLogsListPageConfig";
import { CrmListPageScopedLayoutStyles } from "@crm/shared/CrmListPageScopedLayoutStyles";
import React from "react";

function TextMessagesListPageExtraStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: TEXT_MESSAGES_EXTRA_LAYOUT_CSS,
      }}
    />
  );
}

/** Text messages inbox — same list shell as call logs (no communications dropdown). */
export function TextMessagesListPage() {
  return (
    <React.Fragment>
      <CrmListPageScopedLayoutStyles config={COMMUNICATIONS_LIST_SCOPED_LAYOUT} />
      <TextMessagesListPageExtraStyles />
      <div
        className="prospects-page-container text-messages-page-container"
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
            mainTitle={TEXT_MESSAGES_BREADCRUMB.mainTitle}
            mainLink={TEXT_MESSAGES_BREADCRUMB.mainLink}
            subTitle={TEXT_MESSAGES_BREADCRUMB.subTitle}
          />

          <div
            className="container-fluid prospects-content-area"
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              className="prospects-table-wrapper text-messages-table-wrapper text-messages-page"
              style={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <TextMessagesView />
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default TextMessagesListPage;
