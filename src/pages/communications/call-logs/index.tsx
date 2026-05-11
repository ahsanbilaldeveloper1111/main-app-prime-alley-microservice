import "@assets/scss/datatable-style.scss";
import { type ReactElement } from "react";

import Layout from "@layout/index";

import "@assets/scss/common.scss";

import {
  CallLogsBreadcrumb,
  CallLogsDateRangeBannerConnected,
  CallLogsTableSection,
} from "@components/communications";

const CallLogs = () => {
  return (
    <div className="call-logs-page">
      <style
        dangerouslySetInnerHTML={{
          __html: `.call-logs-page .gt-toolbar-tabs-section .gt-tab-button { margin-left: 12px; }`,
        }}
      />
      <CallLogsBreadcrumb />

      <CallLogsDateRangeBannerConnected />

      <CallLogsTableSection />
    </div>
  );
};

CallLogs.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default CallLogs;
