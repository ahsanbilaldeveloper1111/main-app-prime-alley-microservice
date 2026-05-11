import "@assets/scss/datatable-style.scss";

import { type ReactElement } from "react";
import type { NextPage } from "next";

import Layout from "@layout/index";

import "@assets/scss/common.scss";

import {
  CallRecordingsBreadcrumb,
  CallRecordingsView,
} from "@components/communications";

const CallRecordings: NextPage & {
  getLayout?: (page: ReactElement) => React.ReactNode;
} = () => {
  return (
    <div className="call-recordings-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `
              /* Allow page/table chrome to extend vertically (avoid clipping tall pages) */
              .call-recordings-page .generic-table-container {
                overflow-x: hidden;
                overflow-y: visible;
              }

              /* Filter pills: single horizontal row + scroll (avoid stacked layout hiding actions) */
              .call-recordings-page .gt-filter-pills {
                overflow-x: auto;
                overflow-y: visible;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: thin;
                flex-wrap: nowrap !important;
                flex-direction: row !important;
                align-items: center !important;
                padding-bottom: 10px;
                gap: 8px;
              }

              .call-recordings-page .gt-filter-pills > .d-flex.align-items-center.gap-2.flex-wrap {
                flex-wrap: nowrap !important;
                align-items: center !important;
                gap: 8px !important;
                min-width: max-content;
              }

              .call-recordings-page .gt-filter-pills-right-actions {
                flex-shrink: 0;
                margin-left: auto;
                position: sticky;
                right: 0;
                z-index: 4;
                padding-left: 12px;
                background-color: #ffffff;
                box-shadow: -12px 0 14px -10px rgba(0, 0, 0, 0.18);
              }

              .call-recordings-page .gt-toolbar-tabs-section .gt-tab-button { margin-left: 12px; }
              .call-recordings-page .call-recordings-date-chip { max-width: 100%; }
              .call-recordings-page .call-recordings-date-text { white-space: nowrap; line-height: 1.35; }

              @media (max-width: 992px) {
                .call-recordings-page .gt-toolbar-tabs-section > .d-flex {
                  flex-wrap: wrap;
                  row-gap: 8px;
                }
                .call-recordings-page .call-recordings-date-range-wrap {
                  display:none !important;
                }
                .call-recordings-page .call-recordings-date-chip {
                  width: 100%;
                }
                .call-recordings-page .call-recordings-date-text {
                  white-space: normal !important;
                  overflow-wrap: anywhere;
                  word-break: break-word;
                }
                .call-recordings-page .gt-filter-pills {
                  flex-direction: row !important;
                  align-items: center !important;
                  padding: 12px 16px 10px;
                }
              }

              @media (max-width: 768px) {
                .call-recordings-page .gt-filter-pills {
                  flex-direction: row !important;
                  align-items: center !important;
                  padding: 10px 12px 10px;
                }
              }
            `,
        }}
      />
      <CallRecordingsBreadcrumb />
      <CallRecordingsView />
    </div>
  );
};

CallRecordings.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallRecordings;
