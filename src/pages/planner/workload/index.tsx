import React, { ReactElement } from "react";
import Layout from "@layout/index";
import WorkloadPlannerPage from "@components/planner/WorkloadPlannerPage";
import "@assets/scss/workload-view.scss";

type NextPageWithLayout = React.FC & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const PlannerWorkloadPage: NextPageWithLayout = () => <WorkloadPlannerPage />;

PlannerWorkloadPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default PlannerWorkloadPage;
