import "@assets/scss/datatable-style.scss";
import React, { ReactElement } from "react";
import Layout from "@layout/index";
import { CallAnalysisListPage } from "@components/communications/CallAnalysisListPage";

/** Call analysis list is implemented in `CallAnalysisListPage`. */
const AnalyzeRecordings = () => <CallAnalysisListPage />;

AnalyzeRecordings.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default AnalyzeRecordings;
