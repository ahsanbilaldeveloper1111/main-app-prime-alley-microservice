import "@assets/scss/datatable-style.scss";
import { type ReactElement } from "react";
import type { NextPage } from "next";

import Layout from "@layout/index";

import "@assets/scss/common.scss";
import "@assets/scss/report-style.scss";
import "@assets/scss/tabs.scss";
import "@assets/scss/call-analysis-page.scss";

import {
  CallAnalysisBreadcrumb,
  CallAnalysisView,
} from "@components/communications";

const AnalyzeRecordings: NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode;
} = () => {
  return (
    <div className="call-analysis-page">
      <CallAnalysisBreadcrumb />
      <CallAnalysisView />
    </div>
  );
};

AnalyzeRecordings.getLayout = (page: ReactElement) => {
  return <Layout>{page}</Layout>;
};

export default AnalyzeRecordings;
