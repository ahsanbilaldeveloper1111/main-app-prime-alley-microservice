import React, { ReactElement } from "react";
import Layout from "@layout/index";
import WorkloadReportsPage from "@components/planner/reports/WorkloadReportsPage";
import "@assets/scss/workload-reports.scss";

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const PlannerReportsPage: NextPageWithLayout = () => <WorkloadReportsPage />;

PlannerReportsPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default PlannerReportsPage;
