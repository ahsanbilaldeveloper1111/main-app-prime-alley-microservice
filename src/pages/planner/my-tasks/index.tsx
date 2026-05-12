import React, { ReactElement } from "react";
import Layout from "@layout/index";

type NextPageWithLayout<P = {}> = React.FC<P> & {
  getLayout?: (page: ReactElement) => ReactElement;
};

const PlannerMyTasksPage: React.FC = () => <MyDayTasksPage />;

PlannerMyTasksPage.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default PlannerMyTasksPage;
