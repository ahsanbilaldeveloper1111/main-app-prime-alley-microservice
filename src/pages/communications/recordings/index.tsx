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
